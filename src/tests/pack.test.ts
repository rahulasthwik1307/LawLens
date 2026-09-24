import test from "node:test"
import assert from "node:assert/strict"
import { composePreparationPack } from "../services/ai/pack-composer.ts"
import {
  validatePreparationPackSchema,
  ProfessionalPreparationPackSchema,
} from "../services/ai/pack-schema.ts"
import { SAMPLE_DOCUMENTS } from "../lib/sample-documents.ts"
import type {
  ActionItem,
  ComparisonDifference,
  DocumentAnalysisResult,
  DocumentComparisonResult,
  DocumentQAResult,
  LegalFinding,
} from "../services/ai/types.ts"
import type { UploadedDocument } from "../types/document.ts"

const sampleDocA = SAMPLE_DOCUMENTS.find(
  (d) => d.id === "sample_commercial_lease"
)!
const sampleDocB = SAMPLE_DOCUMENTS.find(
  (d) => d.id === "sample_commercial_lease_v2"
)!

const mockFinding: LegalFinding = {
  id: "finding_term_1",
  category: "termination",
  title: "Termination Notice Requirement",
  explanation: "Either party may terminate this agreement by providing sixty (60) days' prior written notice.",
  confidence: "clear_in_document",
  evidence: {
    sourceText: "Either party may terminate this Lease by providing sixty (60) days' prior written notice to the other party.",
    startLine: 50,
    endLine: 52,
    verificationStatus: "verified",
  },
}

const mockUnverifiedFinding: LegalFinding = {
  id: "finding_unverified",
  category: "review_points",
  title: "Alleged Late Key Penalty",
  explanation: "Unverified claim that lessee must pay double rent on late key handover.",
  confidence: "needs_review",
  evidence: {
    sourceText: "Lessee shall pay double rent for late key return.",
    startLine: 99,
    endLine: 100,
    verificationStatus: "unverified",
  },
}

const mockAnalysisResult: DocumentAnalysisResult = {
  documentId: sampleDocA.id,
  documentName: sampleDocA.name,
  documentType: "Commercial Lease Agreement",
  jurisdiction: "India",
  summary: "A standard commercial office lease agreement with clear monthly rent, deposit, and 60-day notice provisions.",
  findings: [mockFinding, mockUnverifiedFinding],
  categories: {
    parties: [
      {
        id: "p1",
        category: "parties",
        title: "ABC Properties Pvt Ltd",
        explanation: "Lessor / Property Owner",
        confidence: "clear_in_document",
      },
      {
        id: "p2",
        category: "parties",
        title: "TechNova Solutions Ltd",
        explanation: "Lessee / Commercial Tenant",
        confidence: "clear_in_document",
      },
    ],
    dates: [
      {
        id: "d1",
        category: "dates",
        title: "01-04-2024",
        explanation: "Lease commencement date",
        confidence: "clear_in_document",
        evidence: {
          sourceText: "This Lease shall commence on 01-04-2024",
          startLine: 12,
          endLine: 13,
          verificationStatus: "verified",
        },
      },
    ],
    monetary: [
      {
        id: "m1",
        category: "monetary",
        title: "INR 3,60,000/- per month",
        explanation: "Monthly rent obligation",
        confidence: "clear_in_document",
        evidence: {
          sourceText: "monthly rent of INR 3,60,000/- (Rupees Three Lakh Sixty Thousand only)",
          startLine: 18,
          endLine: 19,
          verificationStatus: "verified",
        },
      },
    ],
    rights: [],
    obligations: [
      {
        id: "ob_1",
        category: "obligations",
        title: "Punctual Rent Payment",
        explanation: "Lessee is obligated to pay monthly rent in advance by the 7th of each calendar month.",
        confidence: "clear_in_document",
        evidence: {
          sourceText: "The Lessee shall pay the rent on or before the 7th day of each calendar month.",
          startLine: 20,
          endLine: 21,
          verificationStatus: "verified",
        },
      },
    ],
    restrictions: [
      {
        id: "res_1",
        category: "restrictions",
        title: "Subletting Restriction",
        explanation: "Lessee is strictly prohibited from subletting or assigning the premises without prior written consent.",
        confidence: "clear_in_document",
        evidence: {
          sourceText: "The Lessee shall not assign, sublet, or part with possession of the Leased Premises.",
          startLine: 35,
          endLine: 36,
          verificationStatus: "verified",
        },
      },
    ],
    termination: [mockFinding],
    dispute_resolution: [],
    review_points: [mockUnverifiedFinding],
  },
  stats: {
    totalFindings: 6,
    verifiedFindingsCount: 5,
    unverifiedFindingsCount: 1,
    verificationRate: 83.3,
  },
  metadata: {
    providerId: "mock_test_provider",
    modelName: "LawLens Test Suite",
    analyzedAt: new Date().toISOString(),
  },
}

const mockAction: ActionItem = {
  id: "act_1",
  type: "review",
  priority: "attention",
  status: "open",
  title: "Confirm the termination notice period",
  description: "The agreement mandates 60 days written notice.",
  whyItMatters: "Notice requirements must be strictly observed to avoid breach.",
  suggestedStep: "Check whether 60 days matches commercial operational requirements.",
  sourceEvidence: [
    {
      documentId: sampleDocA.id,
      documentName: sampleDocA.name,
      sourceText: "Either party may terminate this Lease by providing sixty (60) days' prior written notice to the other party.",
      startLine: 50,
      endLine: 52,
      verificationStatus: "verified",
    },
  ],
}

const mockAskAction: ActionItem = {
  id: "act_ask_1",
  type: "ask",
  priority: "important",
  status: "open",
  title: "Who bears the cost of HVAC routine servicing?",
  description: "Clause 6 assigns internal repairs to Lessee.",
  whyItMatters: "Maintenance obligations can lead to unexpected commercial operating expenses.",
  suggestedStep: "Request clarification on whether HVAC compressor replacements are covered.",
  sourceEvidence: [
    {
      documentId: sampleDocA.id,
      documentName: sampleDocA.name,
      sourceText: "The Lessee shall keep the interior of the premises in good and tenantable repair.",
      startLine: 38,
      endLine: 40,
      verificationStatus: "verified",
    },
  ],
}

const mockDifference: ComparisonDifference = {
  id: "diff_deposit_1",
  clauseTitle: "Security Deposit",
  clauseNumber: "4",
  type: "value_changed",
  reviewStatus: "review_recommended",
  summary: "Security deposit increased from INR 21,60,000 to INR 40,00,000",
  explanation: "Document A required an interest-free security deposit of INR 21,60,000, whereas Document B substantially raises the deposit to INR 40,00,000.",
  evidenceA: [
    {
      documentId: sampleDocA.id,
      documentName: sampleDocA.name,
      sourceText: "The Lessee shall pay an interest-free refundable Security Deposit of INR 21,60,000/-",
      startLine: 24,
      endLine: 25,
      verificationStatus: "verified",
    },
  ],
  evidenceB: [
    {
      documentId: sampleDocB.id,
      documentName: sampleDocB.name,
      sourceText: "The Lessee shall deposit an interest-free refundable Security Deposit of INR 40,00,000/-",
      startLine: 30,
      endLine: 31,
      verificationStatus: "verified",
    },
  ],
}

const mockComparisonResult: DocumentComparisonResult = {
  documentA: {
    id: sampleDocA.id,
    name: sampleDocA.name,
    lineCount: 100,
  },
  documentB: {
    id: sampleDocB.id,
    name: sampleDocB.name,
    lineCount: 120,
  },
  executiveSummary: "Draft 2 introduces a higher deposit and expanded lessee repair duties.",
  unchangedProvisionsSummary: "Standard boilerplate clauses remain unchanged.",
  differences: [mockDifference],
  stats: {
    totalDifferences: 1,
    addedCount: 0,
    removedCount: 0,
    modifiedCount: 0,
    valueChangedCount: 1,
    unchangedCount: 8,
    reviewRecommendedCount: 1,
    totalEvidenceItems: 2,
    verifiedEvidenceItems: 2,
    unverifiedEvidenceItems: 0,
  },
  metadata: {
    providerId: "test_provider",
    modelName: "Test Model",
    comparedAt: new Date().toISOString(),
  },
}

const mockQA: DocumentQAResult = {
  question: "What is the notice period for termination?",
  answer: "The lease specifies a 60-day prior written notice period for either party.",
  confidence: "clear_in_document",
  evidence: [
    {
      sourceText: "Either party may terminate this Lease by providing sixty (60) days' prior written notice to the other party.",
      startLine: 50,
      endLine: 52,
      verificationStatus: "verified",
    },
  ],
  stats: {
    totalEvidenceCount: 1,
    verifiedCount: 1,
    unverifiedCount: 0,
  },
  metadata: {
    providerId: "test_provider",
    modelName: "Test Model",
    retrievalMethod: "exact_clause",
    targetedLineCount: 3,
    answeredAt: new Date().toISOString(),
  },
}

// 1. Valid preparation pack schema passes validation
test("Pack Schema — Valid preparation pack passes validation", () => {
  const pack = composePreparationPack({
    document: sampleDocA,
    analysisResult: mockAnalysisResult,
    actions: [mockAction, mockAskAction],
    comparisonResult: mockComparisonResult,
    comparisonDocB: sampleDocB,
    qaHistory: [mockQA],
  })

  const validation = validatePreparationPackSchema(pack)
  assert.equal(validation.success, true)
  assert.ok(validation.data)
  assert.equal(validation.data.overview.documentName, sampleDocA.name)
  assert.ok(validation.data.reviewItems.length > 0)
  assert.ok(validation.data.questionsToDiscuss.length > 0)
})

// 2. Malformed pack rejected
test("Pack Schema — Malformed pack payload missing executiveSummary fails validation safely", () => {
  const malformed = {
    id: "pack_invalid",
    createdAt: new Date().toISOString(),
    overview: {
      documentName: "Test.txt",
      jurisdiction: "India",
      lineCount: 10,
      wordCount: 50,
    },
    // executiveSummary missing
    reviewItems: [],
    questionsToDiscuss: [],
    keyTerms: [],
    evidenceAppendix: [],
    stats: {
      totalReviewItems: 0,
      totalQuestions: 0,
      totalKeyTerms: 0,
      totalComparisonChanges: 0,
      totalEvidenceCitations: 0,
      verifiedCitationsCount: 0,
    },
    legalNotice: "Legal notice text",
  }

  const validation = validatePreparationPackSchema(malformed)
  assert.equal(validation.success, false)
  assert.ok(validation.error?.includes("executiveSummary"))
})

// 3. Verified finding appears in pack
test("Pack Composition — Verified finding appears as review item and in key terms", () => {
  const pack = composePreparationPack({
    document: sampleDocA,
    analysisResult: mockAnalysisResult,
  })

  assert.ok(pack.reviewItems.length > 0, "Review items should be populated from findings")
  const termItem = pack.reviewItems.find((r) => r.title.includes("Termination Notice"))
  assert.ok(termItem, "Termination finding should appear in review items")
  assert.equal(termItem?.priority, "important")
  assert.equal(termItem?.sourceEvidence[0].startLine, 50)
  assert.equal(termItem?.sourceEvidence[0].endLine, 52)
})

// 4. Verified action appears in pack
test("Pack Composition — Verified Phase 6 actions appear in review and question sections", () => {
  const pack = composePreparationPack({
    document: sampleDocA,
    actions: [mockAction, mockAskAction],
  })

  assert.equal(pack.reviewItems.length, 1)
  assert.equal(pack.reviewItems[0].title, mockAction.title)
  assert.equal(pack.reviewItems[0].priority, "attention")

  assert.equal(pack.questionsToDiscuss.length, 1)
  assert.equal(pack.questionsToDiscuss[0].question, mockAskAction.title)
  assert.equal(pack.questionsToDiscuss[0].sourceEvidence[0].startLine, 38)
})

// 5. Verified comparison difference appears in pack
test("Pack Composition — Verified comparison differences appear with Document A and B identity", () => {
  const pack = composePreparationPack({
    document: sampleDocA,
    comparisonResult: mockComparisonResult,
    comparisonDocB: sampleDocB,
  })

  assert.ok(pack.comparisonChanges)
  assert.equal(pack.comparisonChanges.length, 1)
  const comp = pack.comparisonChanges[0]
  assert.equal(comp.clauseTitle, "Security Deposit")
  assert.equal(comp.summary, mockDifference.summary)
  assert.equal(comp.evidenceA?.[0]?.documentId, sampleDocA.id)
  assert.equal(comp.evidenceB?.[0]?.documentId, sampleDocB.id)
})

// 6. Unverified evidence marked correctly in appendix
test("Pack Composition — Unverified evidence items preserve their unverified status", () => {
  const pack = composePreparationPack({
    document: sampleDocA,
    analysisResult: mockAnalysisResult,
  })

  const unverified = pack.evidenceAppendix.find((e) => e.verificationStatus === "unverified")
  assert.ok(unverified, "Unverified finding evidence must be present in appendix")
  assert.equal(unverified?.verificationStatus, "unverified")
  assert.equal(unverified?.startLine, 99)
  assert.equal(unverified?.endLine, 100)
})

// 7. Document A/B identity preserved
test("Pack Composition — Overview and evidence appendix preserve Document A and B distinct identities", () => {
  const pack = composePreparationPack({
    document: sampleDocA,
    comparisonResult: mockComparisonResult,
    comparisonDocB: sampleDocB,
  })

  assert.equal(pack.overview.documentName, sampleDocA.name)
  assert.equal(pack.overview.comparisonDocumentName, sampleDocB.name)

  const docACitations = pack.evidenceAppendix.filter((e) => e.documentId === sampleDocA.id)
  const docBCitations = pack.evidenceAppendix.filter((e) => e.documentId === sampleDocB.id)
  assert.ok(docACitations.length > 0)
  assert.ok(docBCitations.length > 0)
})

// 8. Line numbers preserved
test("Pack Composition — Citations accurately preserve 1-indexed startLine and endLine", () => {
  const pack = composePreparationPack({
    document: sampleDocA,
    actions: [mockAction],
  })

  const citation = pack.evidenceAppendix[0]
  assert.equal(citation.startLine, 50)
  assert.equal(citation.endLine, 52)
  assert.equal(citation.documentId, sampleDocA.id)
})

// 9. Q&A inclusion is evidence-grounded
test("Pack Composition — Grounded Q&A is included while ungrounded Q&A is excluded", () => {
  const ungroundedQA: DocumentQAResult = {
    question: "Is there a rooftop swimming pool?",
    answer: "The document does not mention any pool facility.",
    confidence: "unclear_from_document",
    evidence: [],
    stats: { totalEvidenceCount: 0, verifiedCount: 0, unverifiedCount: 0 },
    metadata: {
      providerId: "test",
      modelName: "test",
      retrievalMethod: "none",
      targetedLineCount: 0,
      answeredAt: new Date().toISOString(),
    },
  }

  const pack = composePreparationPack({
    document: sampleDocA,
    qaHistory: [mockQA, ungroundedQA],
  })

  assert.ok(pack.selectedQA)
  assert.equal(pack.selectedQA.length, 1, "Only evidence-grounded Q&A should be included")
  assert.equal(pack.selectedQA[0].question, mockQA.question)
})

// 10. No unsupported factual item enters verified sections
test("Evidence Integrity — Unverified claims do not increment verifiedCitationsCount", () => {
  const pack = composePreparationPack({
    document: sampleDocA,
    analysisResult: {
      ...mockAnalysisResult,
      categories: {
        ...mockAnalysisResult.categories,
        dates: [],
        monetary: [],
        obligations: [],
        restrictions: [],
        termination: [],
        review_points: [mockUnverifiedFinding], // only unverified finding
      },
    },
  })

  assert.equal(pack.stats.verifiedCitationsCount, 0, "Verified count must be 0 when only unverified citations exist")
  assert.ok(pack.stats.totalEvidenceCitations > 0)
})

// 11. Empty preparation state handled
test("Pack Composition — Empty document produces clean non-fabricated preparation pack", () => {
  const emptyDoc: UploadedDocument = {
    id: "empty_doc",
    name: "Draft_Empty.txt",
    size: 20,
    type: "text/plain",
    extension: "txt",
    content: "Empty document.",
    isTextReadable: true,
    lineCount: 1,
    wordCount: 2,
    uploadedAt: new Date(),
    jurisdiction: "India",
  }

  const pack = composePreparationPack({
    document: emptyDoc,
  })

  assert.equal(pack.overview.documentName, "Draft_Empty.txt")
  assert.equal(pack.reviewItems.length, 0)
  assert.equal(pack.questionsToDiscuss.length, 0)
  assert.equal(pack.keyTerms.length, 0)
  assert.equal(pack.evidenceAppendix.length, 0)
  assert.ok(pack.executiveSummary.includes("Draft_Empty.txt"))
})

// 12. Export/print mode does not expose internal controls
test("Pack Schema & Export — Legal notice clearly communicates non-legal-advice boundary", () => {
  const pack = composePreparationPack({
    document: sampleDocA,
  })

  assert.ok(pack.legalNotice.includes("does not constitute legal advice"))
  assert.ok(pack.legalNotice.includes("information and organization aid"))
  assert.ok(!pack.legalNotice.includes("guaranteed outcome"))
})

// 13. Action status does not alter source evidence
test("Pack Composition — Action status 'reviewed' or 'completed' is marked without modifying citation", () => {
  const completedAction: ActionItem = {
    ...mockAction,
    status: "completed",
  }

  const pack = composePreparationPack({
    document: sampleDocA,
    actions: [completedAction],
  })

  assert.equal(pack.reviewItems[0].status, "completed")
  assert.equal(pack.reviewItems[0].sourceEvidence[0].startLine, 50)
  assert.equal(pack.reviewItems[0].sourceEvidence[0].endLine, 52)
})

// 14. Missing data is handled safely
test("Pack Composition — Undefined optional inputs fall back gracefully", () => {
  const pack = composePreparationPack({
    document: sampleDocA,
    analysisResult: null,
    actions: undefined,
    comparisonResult: null,
    comparisonDocB: null,
    qaHistory: undefined,
  })

  assert.ok(pack.id)
  assert.ok(pack.overview.documentName)
  assert.equal(pack.reviewItems.length, 0)
  assert.equal(pack.stats.totalReviewItems, 0)
})

// 15. Duplicate evidence citations are prevented in appendix
test("Pack Composition — Identical citations across findings and actions are deduplicated in appendix", () => {
  const duplicateAction: ActionItem = {
    ...mockAction,
    id: "act_dup_2",
  }

  const pack = composePreparationPack({
    document: sampleDocA,
    actions: [mockAction, duplicateAction], // Both share identical quote and line range
  })

  assert.equal(pack.reviewItems.length, 2, "Review items list can contain both actions")
  assert.equal(pack.evidenceAppendix.length, 1, "Evidence appendix must deduplicate identical citation")
})
