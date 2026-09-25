import test from "node:test"
import assert from "node:assert/strict"
import { normalizeDocument } from "../services/ai/document-normalizer.ts"
import {
  parseDocumentClauses,
  alignClauses,
  buildAlignedComparisonContext,
} from "../services/ai/clause-aligner.ts"
import {
  validateComparisonSchema,
} from "../services/ai/comparison-schema.ts"
import { verifyComparisonDifference } from "../services/ai/evidence-validator.ts"
import { LawLensAIService } from "../services/ai/ai-service.ts"
import { SAMPLE_DOCUMENTS } from "../lib/sample-documents.ts"
import {
  AIProviderError,
  type LegalAnalysisProvider,
  type RawComparisonOutput,
} from "../services/ai/types.ts"
import type { UploadedDocument } from "../types/document.ts"

const sampleDocA = SAMPLE_DOCUMENTS.find(
  (d) => d.id === "sample_commercial_lease"
)!
const sampleDocB = SAMPLE_DOCUMENTS.find(
  (d) => d.id === "sample_commercial_lease_v2"
)!

test("Clause Aligner — Parses numbered clauses and sections from legal document", () => {
  const normA = normalizeDocument(sampleDocA)
  const clausesA = parseDocumentClauses(normA)

  assert.ok(clausesA.length > 0, "Should parse clauses from Document A")
  const rentClause = clausesA.find((c) => c.clauseNumber === "3")
  assert.ok(rentClause, "Should find Clause 3")
  assert.match(rentClause.title, /RENT/i)
  assert.ok(rentClause.startLine > 0)
  assert.ok(rentClause.endLine >= rentClause.startLine)
})

test("Clause Aligner — Aligns corresponding clauses and detects added clause in Document B", () => {
  const normA = normalizeDocument(sampleDocA)
  const normB = normalizeDocument(sampleDocB)

  const clausesA = parseDocumentClauses(normA)
  const clausesB = parseDocumentClauses(normB)

  const pairs = alignClauses(clausesA, clausesB)

  // Rent clause (3) should be matched in both
  const rentPair = pairs.find((p) => p.clauseKey === "clause_3")
  assert.ok(rentPair, "Should find aligned Clause 3 pair")
  assert.equal(rentPair.status, "both_present")
  assert.ok(rentPair.clauseA)
  assert.ok(rentPair.clauseB)

  // Maintenance clause (8) is present in v2 but absent in v1
  const maintPair = pairs.find((p) => p.clauseKey === "clause_8")
  assert.ok(maintPair, "Should find Clause 8 pair")
  assert.equal(maintPair.status, "added_in_b")
  assert.ok(!maintPair.clauseA)
  assert.ok(maintPair.clauseB)

  // Context formatting
  const alignedContext = buildAlignedComparisonContext(normA, normB)
  assert.ok(alignedContext.formattedContext.includes("[DocA:L"))
  assert.ok(alignedContext.formattedContext.includes("[DocB:L"))
})

test("Comparison Schema — Validates valid comparison payload and normalizes types", () => {
  const rawValid: RawComparisonOutput = {
    executiveSummary:
      "Document B revises monthly rent, escalation rate, and security deposit while adding a maintenance clause.",
    unchangedProvisionsSummary:
      "Core terms including lease duration, demised premises, and governing law remain unchanged.",
    differences: [
      {
        clauseTitle: "Rent and Escalation",
        clauseNumber: "3",
        type: "value_changed",
        reviewStatus: "standard_modification",
        summary: "Monthly lease rental increased by INR 40,000.",
        explanation:
          "Document A specifies INR 3,60,000/- while Document B increases rent to INR 4,00,000/-.",
        evidenceA: [
          {
            document: "A",
            quote: "INR 3,60,000/- (Rupees Three Lakh Sixty Thousand only)",
            startLine: 47,
            endLine: 49,
          },
        ],
        evidenceB: [
          {
            document: "B",
            quote: "INR 4,00,000/- (Rupees Four Lakh only)",
            startLine: 47,
            endLine: 49,
          },
        ],
      },
      {
        clauseTitle: "Premises Maintenance",
        clauseNumber: "8",
        type: "added",
        reviewStatus: "review_recommended",
        summary: "New maintenance and capital expenditure obligations added for Lessee.",
        explanation:
          "Document B introduces Clause 8 requiring Lessee to maintain HVAC and wiring.",
        evidenceA: [],
        evidenceB: [
          {
            document: "B",
            quote: "The Lessee shall be solely responsible for regular maintenance",
            startLine: 62,
            endLine: 66,
          },
        ],
        riskOrReviewNote: "Places internal maintenance liabilities directly on Lessee.",
      },
    ],
  }

  const result = validateComparisonSchema(rawValid)
  assert.ok(result.success, "Should pass schema validation")
  assert.equal(result.data?.differences.length, 2)
  assert.equal(result.data?.differences[0].type, "value_changed")
  assert.equal(result.data?.differences[1].reviewStatus, "review_recommended")
})

test("Comparison Schema — Rejects malformed payload missing executiveSummary", () => {
  const invalidPayload = {
    differences: [],
  }

  const result = validateComparisonSchema(invalidPayload)
  assert.equal(result.success, false)
  assert.ok(result.error?.includes("executiveSummary"))
})

test("Comparison Evidence Validator — Grounding verified quotes and flagging unverified text", () => {
  const normA = normalizeDocument(sampleDocA)
  const normB = normalizeDocument(sampleDocB)

  // Difference with authentic quotes in Doc A and Doc B
  const validDiff = {
    clauseTitle: "Rent and Escalation",
    clauseNumber: "3",
    type: "value_changed" as const,
    reviewStatus: "standard_modification" as const,
    summary: "Rent increased",
    explanation: "Rent went from 3.6L to 4.0L",
    evidenceA: [
      {
        document: "A" as const,
        quote: "monthly lease rental of INR 3,60,000/-",
      },
    ],
    evidenceB: [
      {
        document: "B" as const,
        quote: "monthly lease rental of INR 4,00,000/-",
      },
    ],
  }

  const verified = verifyComparisonDifference(validDiff, normA, normB, 0)
  assert.equal(verified.evidenceA.length, 1)
  assert.equal(verified.evidenceA[0].verificationStatus, "verified")
  assert.equal(verified.evidenceA[0].documentId, sampleDocA.id)
  assert.ok(verified.evidenceA[0].startLine > 0)
  assert.ok(verified.evidenceA[0].endLine >= verified.evidenceA[0].startLine)

  assert.equal(verified.evidenceB.length, 1)
  assert.equal(verified.evidenceB[0].verificationStatus, "verified")
  assert.equal(verified.evidenceB[0].documentId, sampleDocB.id)
  assert.ok(verified.evidenceB[0].startLine > 0)
  assert.ok(verified.evidenceB[0].endLine >= verified.evidenceB[0].startLine)

  // Difference with hallucinated/unmatched quote
  const hallucinatedDiff = {
    clauseTitle: "Penalty",
    type: "modified" as const,
    reviewStatus: "review_recommended" as const,
    summary: "Fake penalty clause",
    explanation: "Hallucinated penalty",
    evidenceA: [
      {
        document: "A" as const,
        quote: "Non-existent penalty of 50 percent per day",
      },
    ],
    evidenceB: [],
  }

  const flagged = verifyComparisonDifference(hallucinatedDiff, normA, normB, 1)
  assert.equal(flagged.evidenceA.length, 1)
  assert.equal(flagged.evidenceA[0].verificationStatus, "unverified")
})

test("AIService compareDocuments — Rejects comparing a document against itself", async () => {
  const service = new LawLensAIService()

  await assert.rejects(
    async () => {
      await service.compareDocuments(sampleDocA, sampleDocA)
    },
    (err: unknown) => {
      assert(err instanceof AIProviderError)
      assert.equal(err.code, "INVALID_COMPARISON")
      return true
    }
  )
})

test("AIService compareDocuments — Rejects unreadable documents", async () => {
  const service = new LawLensAIService()
  const unreadableDoc: UploadedDocument = {
    id: "unreadable_1",
    name: "scanned.pdf",
    size: 2000,
    type: "application/pdf",
    extension: ".pdf",
    lineCount: 0,
    wordCount: 0,
    uploadedAt: new Date(),
    jurisdiction: "India",
    isSample: false,
    isTextReadable: false,
    content: "",
  }

  await assert.rejects(
    async () => {
      await service.compareDocuments(sampleDocA, unreadableDoc)
    },
    (err: unknown) => {
      assert(err instanceof AIProviderError)
      assert.equal(err.code, "UNREADABLE_DOCUMENT")
      return true
    }
  )
})

test("AIService compareDocuments — Orchestrates comparison with mock provider", async () => {
  const mockProvider: LegalAnalysisProvider = {
    id: "mock-comparison-provider",
    name: "Mock Comparison Provider",
    async analyzeDocument() {
      throw new Error("Not implemented")
    },
    async compareDocuments() {
      return {
        executiveSummary: "Document B modifies rental amounts and notice periods.",
        unchangedProvisionsSummary: "Demised premises and governing law remain unchanged.",
        differences: [
          {
            clauseTitle: "Rent and Escalation",
            clauseNumber: "3",
            type: "value_changed",
            reviewStatus: "standard_modification",
            summary: "Monthly lease rental increased by INR 40,000.",
            explanation: "Rent increased from 3.6L to 4.0L.",
            evidenceA: [
              {
                document: "A",
                quote: "monthly lease rental of INR 3,60,000/-",
                startLine: 47,
                endLine: 49,
              },
            ],
            evidenceB: [
              {
                document: "B",
                quote: "monthly lease rental of INR 4,00,000/-",
                startLine: 47,
                endLine: 49,
              },
            ],
          },
          {
            clauseTitle: "Premises Maintenance and Repairs",
            clauseNumber: "8",
            type: "added",
            reviewStatus: "review_recommended",
            summary: "Lessee now responsible for internal HVAC and electrical maintenance.",
            explanation: "New Clause 8 introduced in Document B.",
            evidenceA: [],
            evidenceB: [
              {
                document: "B",
                quote: "The Lessee shall be solely responsible for regular maintenance",
                startLine: 62,
                endLine: 66,
              },
            ],
            riskOrReviewNote: "Lessee should verify air conditioning warranty coverage.",
          },
        ],
      }
    },
  }

  const service = new LawLensAIService(mockProvider)
  const result = await service.compareDocuments(sampleDocA, sampleDocB)

  assert.equal(result.documentA.id, sampleDocA.id)
  assert.equal(result.documentB.id, sampleDocB.id)
  assert.equal(result.differences.length, 2)
  assert.equal(result.stats.totalDifferences, 2)
  assert.equal(result.stats.valueChangedCount, 1)
  assert.equal(result.stats.addedCount, 1)
  assert.equal(result.stats.reviewRecommendedCount, 1)
  assert.ok(result.stats.verifiedEvidenceItems >= 2)
  assert.equal(result.metadata.providerId, "mock-comparison-provider")
})
