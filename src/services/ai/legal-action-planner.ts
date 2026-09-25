import type { UploadedDocument } from "../../types/document.ts"
import type {
  ActionEvidenceItem,
  ActionItem,
  ActionPriority,
  ActionType,
  FindingCategory,
  FindingEvidence,
  LegalFinding,
  NormalizedDocument,
} from "./types.ts"

export interface CheckItem {
  id: string
  label: string
  details: string
  startLine?: number
  endLine?: number
  sourceText?: string
  relatedFindingId?: string
}

export interface NextStepItem {
  id: string
  stepNumber: number
  text: string
  detail: string
  completed: boolean
}

export interface LawyerQuestionItem {
  id: string
  question: string
  whyAskThis: string
}

export interface LegalActionPlan {
  id: string
  findingId: string
  findingTitle: string
  findingCategory: FindingCategory
  status: "verified" | "needs_review" | "unclear" | "professional_review_suggested"
  whatItSays: string
  whatItMeans: string
  whyItMatters: string
  whatToCheck: CheckItem[]
  possibleNextSteps: NextStepItem[]
  questionsToAskLawyer: LawyerQuestionItem[]
  evidence: FindingEvidence
  documentId: string
  documentName: string
  disclaimer: string
}

/**
 * Checks whether a finding has actionable contractual implications.
 * Focuses on obligations, dates, monetary terms, restrictions, termination,
 * review points, and dispute resolution.
 */
export function isFindingActionable(finding: LegalFinding): boolean {
  if (
    finding.category === "obligations" ||
    finding.category === "dates" ||
    finding.category === "monetary" ||
    finding.category === "restrictions" ||
    finding.category === "termination" ||
    finding.category === "review_points" ||
    finding.category === "dispute_resolution"
  ) {
    return true
  }

  // Also include any finding flagged as needing review
  if (finding.confidence === "needs_review" || finding.confidence === "unclear_from_document") {
    return true
  }

  return false
}

/**
 * Returns all findings from an analysis result that are eligible for action planning.
 */
export function getActionableFindings(findings: LegalFinding[]): LegalFinding[] {
  return findings.filter(isFindingActionable)
}

/**
 * Deterministically constructs a comprehensive, evidence-grounded Legal Action Plan
 * from a verified finding and existing document context.
 */
export function buildLegalActionPlan(params: {
  finding: LegalFinding
  document: UploadedDocument | NormalizedDocument
  allFindings?: LegalFinding[]
  existingActions?: ActionItem[]
  jurisdiction?: string
}): LegalActionPlan {
  const { finding, document, allFindings = [], existingActions = [], jurisdiction = "India" } = params

  const findingTitleLower = finding.title.toLowerCase()
  const explanationLower = finding.explanation.toLowerCase()
  const cat = finding.category

  // 1. What the document says
  const whatItSays = finding.evidence?.sourceText
    ? finding.evidence.sourceText
    : finding.explanation

  // 2. What it means (objective plain-language contractual explanation)
  let whatItMeans = finding.explanation
  if (cat === "termination") {
    whatItMeans = `This clause defines the contractual requirements, notice timeframes, or conditions under which either party may terminate or exit the agreement.`
  } else if (cat === "monetary") {
    whatItMeans = `This provision specifies the financial consideration, fee schedule, deposit requirement, or payment terms agreed upon in the contract.`
  } else if (cat === "dates") {
    whatItMeans = `This section establishes a binding chronological milestone, performance deadline, notice window, or renewal date.`
  } else if (cat === "obligations") {
    whatItMeans = `This clause imposes an affirmative operational or legal duty on one or both parties during the contract term.`
  } else if (cat === "restrictions") {
    whatItMeans = `This covenant restricts or limits specific activities, commercial conduct, intellectual property use, or transfer of rights.`
  } else if (cat === "dispute_resolution") {
    whatItMeans = `This section governs the formal procedure, arbitration forum, and legal jurisdiction that apply if a dispute arises.`
  } else if (cat === "review_points") {
    whatItMeans = `This clause contains language, unilateral discretion, or potential ambiguity that merits close examination prior to formal execution.`
  }

  // If the explanation has specific details, merge them cleanly
  if (finding.explanation && finding.explanation !== whatItMeans) {
    whatItMeans = `${whatItMeans} Specifically: ${finding.explanation}`
  }

  // 3. Why it matters (practical significance based strictly on the document text)
  let whyItMatters = "Understanding this provision ensures contractual compliance and clarifies risk allocation between parties."

  // Check matching existing action item if available
  const matchedAction = existingActions.find(
    (a) => a.relatedFindingId === finding.id || a.title.toLowerCase().includes(findingTitleLower)
  )
  if (matchedAction && matchedAction.whyItMatters) {
    whyItMatters = matchedAction.whyItMatters
  } else {
    if (cat === "termination") {
      whyItMatters = "Failure to comply strictly with termination notice windows or conditions can result in accidental contract rollover, breach claims, or loss of exit rights."
    } else if (cat === "monetary") {
      if (findingTitleLower.includes("deposit") || explanationLower.includes("deposit")) {
        whyItMatters = "Security deposits involve capital outlay; unclear refund timelines or unilateral deduction clauses create financial recovery exposure."
      } else {
        whyItMatters = "Payment schedules and interest rates directly determine financial cash flow obligations; late payments can trigger contractual default provisions."
      }
    } else if (cat === "dates") {
      whyItMatters = "Missing contractual milestones can lead to automatic renewals, forfeiture of cure periods, or default triggers without further notice."
    } else if (cat === "obligations") {
      whyItMatters = "Unperformed contractual obligations can result in formal breach notices, damages claims, or immediate suspension of counterparty performance."
    } else if (cat === "restrictions") {
      whyItMatters = "Restrictive covenants constrain operational flexibility and may restrict business operations, hiring, or commercial relationships."
    } else if (cat === "dispute_resolution") {
      whyItMatters = "The specified dispute forum, seat of arbitration, and governing law directly affect litigation costs, procedural delays, and enforceability."
    } else if (cat === "review_points") {
      whyItMatters = "Provisions with ambiguous scope or asymmetrical obligations create unpredictable liability if contested later."
    }
  }

  // 4. What to check (related clauses with cross-references)
  const whatToCheck: CheckItem[] = []

  // Check for related findings in other categories
  for (const other of allFindings) {
    if (other.id === finding.id) continue
    const otherTitleLower = other.title.toLowerCase()
    const otherExplLower = other.explanation.toLowerCase()

    let isRelated = false
    let relationshipReason = ""

    if (cat === "termination") {
      if (other.category === "dates") {
        isRelated = true
        relationshipReason = "Notice period timeline and cure duration"
      } else if (other.category === "monetary" && (otherTitleLower.includes("deposit") || otherTitleLower.includes("fee") || otherTitleLower.includes("penalty"))) {
        isRelated = true
        relationshipReason = "Financial consequences or refund upon exit"
      }
    } else if (cat === "monetary") {
      if (other.category === "dates" && (otherTitleLower.includes("payment") || otherTitleLower.includes("due") || otherTitleLower.includes("invoice"))) {
        isRelated = true
        relationshipReason = "Payment window and billing cycle"
      } else if (other.category === "termination" && (otherExplLower.includes("payment") || otherExplLower.includes("default"))) {
        isRelated = true
        relationshipReason = "Termination rights triggered by non-payment"
      }
    } else if (cat === "obligations") {
      if (other.category === "restrictions") {
        isRelated = true
        relationshipReason = "Corresponding behavioral boundaries and limitations"
      } else if (other.category === "termination" && otherExplLower.includes("breach")) {
        isRelated = true
        relationshipReason = "Default remedy if obligation is breached"
      }
    } else if (cat === "dispute_resolution") {
      if (other.category === "review_points" || otherTitleLower.includes("jurisdiction") || otherTitleLower.includes("law")) {
        isRelated = true
        relationshipReason = "Jurisdiction and applicable legal statutory provisions"
      }
    }

    if (isRelated && whatToCheck.length < 3) {
      whatToCheck.push({
        id: `check_${other.id}`,
        label: other.title,
        details: relationshipReason,
        startLine: other.evidence?.startLine,
        endLine: other.evidence?.endLine,
        sourceText: other.evidence?.sourceText,
        relatedFindingId: other.id,
      })
    }
  }

  // Fallback check items if no cross-findings matched
  if (whatToCheck.length === 0) {
    if (cat === "termination") {
      whatToCheck.push({
        id: `check_term_1`,
        label: "Notice Window Requirements",
        details: "Verify whether written notice requires registered post, courier, or formal email acknowledgment.",
        startLine: finding.evidence?.startLine,
        endLine: finding.evidence?.endLine,
      })
      whatToCheck.push({
        id: `check_term_2`,
        label: "Cure / Rectification Period",
        details: "Check if the contract allows a cure window before termination takes legal effect.",
      })
    } else if (cat === "monetary") {
      whatToCheck.push({
        id: `check_mon_1`,
        label: "Invoice Delivery & Acceptance Terms",
        details: "Verify when the payment clock starts ticking (date of invoice vs. date of receipt).",
        startLine: finding.evidence?.startLine,
        endLine: finding.evidence?.endLine,
      })
      whatToCheck.push({
        id: `check_mon_2`,
        label: "Late Payment Penalties / Interest",
        details: "Confirm whether interest or penal charges accrue on disputed or delayed amounts.",
      })
    } else if (cat === "dates") {
      whatToCheck.push({
        id: `check_date_1`,
        label: "Renewal or Expiration Timeline",
        details: "Confirm whether the agreement auto-renews unless notice is delivered by a specific cut-off date.",
        startLine: finding.evidence?.startLine,
        endLine: finding.evidence?.endLine,
      })
    } else {
      whatToCheck.push({
        id: `check_gen_1`,
        label: "Clause Scope & Reciprocal Duties",
        details: "Confirm whether obligations under this clause are bilateral or unilateral.",
        startLine: finding.evidence?.startLine,
        endLine: finding.evidence?.endLine,
      })
    }
  }

  // 5. Possible Next Steps (Safe, informational, operational review steps)
  const possibleNextSteps: NextStepItem[] = []

  if (matchedAction && matchedAction.suggestedStep) {
    possibleNextSteps.push({
      id: `step_1`,
      stepNumber: 1,
      text: matchedAction.suggestedStep,
      detail: "Operational check grounded in the verified finding.",
      completed: matchedAction.status === "reviewed",
    })
  } else {
    if (cat === "termination") {
      possibleNextSteps.push({
        id: `step_1`,
        stepNumber: 1,
        text: "Confirm the designated notice delivery method and address with the counterparty.",
        detail: "Ensure addresses listed in the notices clause remain current and active.",
        completed: false,
      })
      possibleNextSteps.push({
        id: `step_2`,
        stepNumber: 2,
        text: "Calculate the exact calendar cut-off date required for valid notice delivery.",
        detail: "Account for business days versus calendar days as defined in the contract.",
        completed: false,
      })
    } else if (cat === "monetary") {
      possibleNextSteps.push({
        id: `step_1`,
        stepNumber: 1,
        text: "Compare the stipulated amounts and payment schedule against agreed commercial proposals.",
        detail: "Confirm that figures and GST/tax withholding terms match your commercial understanding.",
        completed: false,
      })
      possibleNextSteps.push({
        id: `step_2`,
        stepNumber: 2,
        text: "Establish internal calendar reminders for invoice submission and verification milestones.",
        detail: "Avoid accidental delayed-payment interest triggers by tracking invoice verification.",
        completed: false,
      })
    } else if (cat === "dates") {
      possibleNextSteps.push({
        id: `step_1`,
        stepNumber: 1,
        text: "Record all contractual deadlines and renewal windows in your organization's calendar.",
        detail: "Set advance alerts at least 15 to 30 days prior to contractual milestones.",
        completed: false,
      })
    } else {
      possibleNextSteps.push({
        id: `step_1`,
        stepNumber: 1,
        text: "Review this clause internally with the operational team responsible for its performance.",
        detail: "Confirm that team capabilities and procedures satisfy all referenced requirements.",
        completed: false,
      })
    }
  }

  // Standard second/third steps maintaining safety guidelines
  if (possibleNextSteps.length === 1) {
    possibleNextSteps.push({
      id: `step_2`,
      stepNumber: 2,
      text: "Gather relevant supporting records, schedules, or certificates referenced in this clause.",
      detail: "Have supporting documentation compiled before entering operational execution.",
      completed: false,
    })
  }

  possibleNextSteps.push({
    id: `step_final`,
    stepNumber: possibleNextSteps.length + 1,
    text: "Prepare key questions to discuss with a qualified legal professional if ambiguity remains.",
    detail: "Use the consultation questions below during formal legal review.",
    completed: false,
  })

  // 6. Questions to ask a lawyer (tailored, practical professional review questions)
  const questionsToAskLawyer: LawyerQuestionItem[] = []

  if (cat === "termination") {
    questionsToAskLawyer.push({
      id: `q_1`,
      question: "Does the contract require written notice by registered post, or is electronic mail legally sufficient under applicable law?",
      whyAskThis: "Notice delivery formalities are strictly construed in commercial disputes.",
    })
    questionsToAskLawyer.push({
      id: `q_2`,
      question: "Are there any unexpired lock-in periods or financial termination penalties that apply upon early exit?",
      whyAskThis: "To verify whether termination triggers liquidated damages or forfeiture.",
    })
  } else if (cat === "monetary") {
    questionsToAskLawyer.push({
      id: `q_1`,
      question: "Under what specific conditions can the counterparty lawfully deduct from or withhold the deposit/payment?",
      whyAskThis: "To establish clear contractual limits against arbitrary deductions.",
    })
    questionsToAskLawyer.push({
      id: `q_2`,
      question: "Does the stipulated late-payment interest rate comply with statutory interest rate ceilings in this jurisdiction?",
      whyAskThis: "Excessive penal interest rates may be subject to statutory challenges or negotiation.",
    })
  } else if (cat === "restrictions") {
    questionsToAskLawyer.push({
      id: `q_1`,
      question: "Is the geographic scope and duration of this restriction enforceable under section 27 of the Indian Contract Act?",
      whyAskThis: "Restraint-of-trade covenants have strict statutory boundaries under Indian law.",
    })
    questionsToAskLawyer.push({
      id: `q_2`,
      question: "Does this restriction prevent ordinary commercial expansion or hiring of general contractors?",
      whyAskThis: "To clarify operational boundaries before committing.",
    })
  } else if (cat === "dispute_resolution") {
    questionsToAskLawyer.push({
      id: `q_1`,
      question: "Is the designated arbitration seat and jurisdiction convenient, and does it exclude judicial interim relief under Section 9 of the Arbitration Act?",
      whyAskThis: "To ensure emergency interim protection remains accessible if urgent disputes arise.",
    })
  } else {
    questionsToAskLawyer.push({
      id: `q_1`,
      question: `Does this ${cat.replace(/_/g, " ")} provision create any unilateral or unreciprocated liability under applicable law?`,
      whyAskThis: "To identify asymmetrical contractual risk before signing.",
    })
    questionsToAskLawyer.push({
      id: `q_2`,
      question: "What documentation or evidence should be preserved to prove compliance with this clause?",
      whyAskThis: "To maintain an audit trail protecting against future breach allegations.",
    })
  }

  // 7. Status & Evidence Grounding
  let status: LegalActionPlan["status"] = "verified"
  if (finding.confidence === "needs_review") {
    status = "needs_review"
  } else if (finding.confidence === "unclear_from_document") {
    status = "unclear"
  } else if (cat === "review_points" || cat === "restrictions") {
    status = "professional_review_suggested"
  }

  const defaultEvidence: FindingEvidence = finding.evidence || {
    sourceText: whatItSays,
    startLine: 1,
    endLine: 1,
    verificationStatus: "verified",
  }

  return {
    id: `plan_${finding.id}`,
    findingId: finding.id,
    findingTitle: finding.title,
    findingCategory: finding.category,
    status,
    whatItSays,
    whatItMeans,
    whyItMatters,
    whatToCheck,
    possibleNextSteps,
    questionsToAskLawyer,
    evidence: defaultEvidence,
    documentId: document.id,
    documentName: document.name,
    disclaimer: "Informational action plan grounded strictly in document evidence. Does not constitute legal advice. Review critical decisions with a qualified advocate.",
  }
}

/**
 * Converts a Legal Action Plan into an ActionItem compatible with the existing Actions
 * pipeline and Preparation Pack composer.
 */
export function convertPlanToActionItem(
  plan: LegalActionPlan,
  document: UploadedDocument | NormalizedDocument
): ActionItem {
  let actionType: ActionType = "review"
  if (plan.findingCategory === "dates") actionType = "track"
  else if (plan.findingCategory === "monetary") actionType = "verify"
  else if (plan.findingCategory === "obligations") actionType = "prepare"
  else if (plan.findingCategory === "review_points") actionType = "ask"

  let priority: ActionPriority = "standard"
  if (plan.status === "needs_review" || plan.status === "professional_review_suggested") {
    priority = "attention"
  } else if (plan.findingCategory === "monetary" || plan.findingCategory === "termination") {
    priority = "important"
  }

  const evidenceItem: ActionEvidenceItem = {
    documentId: document.id,
    documentName: document.name,
    sourceText: plan.evidence.sourceText,
    startLine: plan.evidence.startLine,
    endLine: plan.evidence.endLine,
    verificationStatus: plan.evidence.verificationStatus,
  }

  return {
    id: `act_${plan.findingId}`,
    type: actionType,
    title: plan.findingTitle,
    description: plan.whatItMeans,
    whyItMatters: plan.whyItMatters,
    suggestedStep: plan.possibleNextSteps[0]?.text || "Review clause with a qualified legal professional.",
    sourceEvidence: [evidenceItem],
    relatedFindingId: plan.findingId,
    priority,
    status: "open",
  }
}
