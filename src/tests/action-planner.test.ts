import test from "node:test"
import assert from "node:assert/strict"
import {
  buildLegalActionPlan,
  convertPlanToActionItem,
  getActionableFindings,
  isFindingActionable,
} from "../services/ai/legal-action-planner.ts"
import { composePreparationPack } from "../services/ai/pack-composer.ts"
import { SAMPLE_DOCUMENTS } from "../lib/sample-documents.ts"
import type { LegalFinding } from "../services/ai/types.ts"

const sampleDoc = SAMPLE_DOCUMENTS.find(
  (d) => d.id === "sample_commercial_lease"
)!

const terminationFinding: LegalFinding = {
  id: "finding_term_1",
  category: "termination",
  title: "Termination Notice Window",
  explanation: "Either party may terminate this agreement by providing sixty (60) days' prior written notice.",
  confidence: "clear_in_document",
  evidence: {
    sourceText: "Either party may terminate this Lease by providing sixty (60) days' prior written notice to the other party.",
    startLine: 50,
    endLine: 52,
    verificationStatus: "verified",
  },
}

const monetaryFinding: LegalFinding = {
  id: "finding_mon_1",
  category: "monetary",
  title: "Monthly Rent & Invoicing Cycle",
  explanation: "Monthly rent of INR 1,80,000 is payable in advance within 5 days of invoice submission.",
  confidence: "supported_by_source",
  evidence: {
    sourceText: "The Lessee shall pay monthly rent of INR 1,80,000/- within five (5) days of receipt of invoice.",
    startLine: 18,
    endLine: 20,
    verificationStatus: "verified",
  },
}

const ambiguousFinding: LegalFinding = {
  id: "finding_amb_1",
  category: "review_points",
  title: "Unilateral Alteration Right",
  explanation: "The Lessor retains right to modify building regulations without prior Lessee approval.",
  confidence: "needs_review",
  evidence: {
    sourceText: "The Lessor reserves unilateral discretion to amend common area guidelines.",
    startLine: 80,
    endLine: 81,
    verificationStatus: "verified",
  },
}

test("Action Planner — determines actionable findings accurately", () => {
  assert.equal(isFindingActionable(terminationFinding), true)
  assert.equal(isFindingActionable(monetaryFinding), true)
  assert.equal(isFindingActionable(ambiguousFinding), true)

  const nonActionableFinding: LegalFinding = {
    id: "finding_party_1",
    category: "parties",
    title: "Contracting Parties",
    explanation: "ABC Realty Pvt Ltd and XYZ Tech Labs",
    confidence: "clear_in_document",
  }
  assert.equal(isFindingActionable(nonActionableFinding), false)

  const actionableList = getActionableFindings([
    terminationFinding,
    monetaryFinding,
    nonActionableFinding,
  ])
  assert.equal(actionableList.length, 2)
  assert.equal(actionableList[0].id, terminationFinding.id)
})

test("Action Planner — finding → action planner mapping produces valid 7-stage plan", () => {
  const plan = buildLegalActionPlan({
    finding: terminationFinding,
    document: sampleDoc,
    allFindings: [terminationFinding, monetaryFinding],
  })

  // 1. Finding & What Document Says
  assert.equal(plan.findingId, "finding_term_1")
  assert.equal(plan.findingTitle, "Termination Notice Window")
  assert.equal(plan.whatItSays, terminationFinding.evidence!.sourceText)

  // 2. What it Means
  assert.ok(plan.whatItMeans.length > 20)
  assert.ok(plan.whatItMeans.includes("notice"))

  // 3. Why it Matters
  assert.ok(plan.whyItMatters.length > 20)
  assert.ok(plan.whyItMatters.includes("termination") || plan.whyItMatters.includes("rollover"))

  // 4. What to Check
  assert.ok(plan.whatToCheck.length >= 1)
  assert.ok(plan.whatToCheck[0].label.length > 0)

  // 5. Possible Next Steps
  assert.ok(plan.possibleNextSteps.length >= 2)
  assert.equal(plan.possibleNextSteps[0].stepNumber, 1)
  assert.equal(typeof plan.possibleNextSteps[0].completed, "boolean")

  // 6. Questions to Ask a Lawyer
  assert.ok(plan.questionsToAskLawyer.length >= 2)
  assert.ok(plan.questionsToAskLawyer[0].question.endsWith("?"))
  assert.ok(plan.questionsToAskLawyer[0].whyAskThis.length > 10)

  // 7. Evidence Grounding
  assert.equal(plan.evidence.startLine, 50)
  assert.equal(plan.evidence.endLine, 52)
  assert.equal(plan.evidence.verificationStatus, "verified")
})

test("Action Planner — preserves existing verified evidence and line numbers without hallucination", () => {
  const plan = buildLegalActionPlan({
    finding: monetaryFinding,
    document: sampleDoc,
    allFindings: [monetaryFinding],
  })

  assert.equal(plan.evidence.startLine, 18)
  assert.equal(plan.evidence.endLine, 20)
  assert.equal(plan.evidence.sourceText, monetaryFinding.evidence!.sourceText)
  assert.equal(plan.evidence.verificationStatus, "verified")
  assert.equal(plan.documentId, sampleDoc.id)
  assert.equal(plan.documentName, sampleDoc.name)
})

test("Action Planner — gracefully handles findings with missing or empty evidence", () => {
  const findingNoEvidence: LegalFinding = {
    id: "finding_no_ev",
    category: "obligations",
    title: "General Maintenance Obligation",
    explanation: "Tenant must maintain the leased premises in good order.",
    confidence: "clear_in_document",
  }

  const plan = buildLegalActionPlan({
    finding: findingNoEvidence,
    document: sampleDoc,
  })

  assert.equal(plan.whatItSays, "Tenant must maintain the leased premises in good order.")
  assert.equal(plan.evidence.startLine, 1)
  assert.equal(plan.evidence.endLine, 1)
  assert.ok(plan.possibleNextSteps.length >= 1)
  assert.ok(plan.questionsToAskLawyer.length >= 1)
})

test("Action Planner — enforces next-step safety constraints (no legal advice or litigation instructions)", () => {
  const plan = buildLegalActionPlan({
    finding: ambiguousFinding,
    document: sampleDoc,
    allFindings: [ambiguousFinding],
  })

  for (const step of plan.possibleNextSteps) {
    const textLower = step.text.toLowerCase()
    assert.equal(textLower.includes("you must sue"), false, "Step must not instruct to sue")
    assert.equal(textLower.includes("file a case"), false, "Step must not instruct litigation")
    assert.equal(textLower.includes("we guarantee"), false, "Step must not guarantee outcomes")
  }

  // Legal boundary notice must be present
  assert.ok(plan.disclaimer.includes("Does not constitute legal advice"))
})

test("Action Planner — question generation produces structured professional consultation inquiries", () => {
  const plan = buildLegalActionPlan({
    finding: monetaryFinding,
    document: sampleDoc,
  })

  assert.ok(plan.questionsToAskLawyer.length >= 2)
  for (const q of plan.questionsToAskLawyer) {
    assert.ok(q.question.length > 15)
    assert.ok(q.question.includes("?"))
    assert.ok(q.whyAskThis.length > 5)
  }
})

test("Action Planner — cross-references related document findings in whatToCheck", () => {
  const allFindings = [
    terminationFinding,
    monetaryFinding,
    ambiguousFinding,
  ]

  const plan = buildLegalActionPlan({
    finding: terminationFinding,
    document: sampleDoc,
    allFindings,
  })

  assert.ok(plan.whatToCheck.length > 0)
  // Cross check items should carry related finding IDs or line numbers
  const hasLineOrDetails = plan.whatToCheck.every((item) => item.label.length > 0 && item.details.length > 0)
  assert.equal(hasLineOrDetails, true)
})

test("Action Planner — convertPlanToActionItem integrates seamlessly with Preparation Pack composer", () => {
  const plan = buildLegalActionPlan({
    finding: terminationFinding,
    document: sampleDoc,
  })

  const actionItem = convertPlanToActionItem(plan, sampleDoc)

  assert.equal(actionItem.relatedFindingId, "finding_term_1")
  assert.equal(actionItem.title, "Termination Notice Window")
  assert.equal(actionItem.sourceEvidence[0].startLine, 50)
  assert.equal(actionItem.sourceEvidence[0].endLine, 52)
  assert.equal(actionItem.sourceEvidence[0].verificationStatus, "verified")

  // Feed into Preparation Pack
  const pack = composePreparationPack({
    document: sampleDoc,
    actions: [actionItem],
  })

  assert.ok(pack.reviewItems.length >= 1)
  const matchingReview = pack.reviewItems.find((r) => r.title === "Termination Notice Window")
  assert.ok(matchingReview, "Action plan must appear in Preparation Pack Items to Review")
  assert.equal(matchingReview?.sourceEvidence[0].startLine, 50)
})

test("Action Planner — status calibration reflects finding confidence", () => {
  const planClear = buildLegalActionPlan({
    finding: terminationFinding,
    document: sampleDoc,
  })
  assert.equal(planClear.status, "verified")

  const planReview = buildLegalActionPlan({
    finding: ambiguousFinding,
    document: sampleDoc,
  })
  assert.equal(planReview.status, "needs_review")
})
