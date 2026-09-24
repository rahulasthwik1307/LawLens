import test from "node:test"
import assert from "node:assert/strict"
import { validateQASchema } from "../services/ai/qa-schema.ts"
import { retrieveTargetedContext } from "../services/ai/context-retriever.ts"
import { verifyQAEvidence } from "../services/ai/evidence-validator.ts"
import { LawLensAIService } from "../services/ai/ai-service.ts"
import { GroqLegalAnalysisProvider } from "../services/ai/providers/groq-provider.ts"
import { AIProviderError } from "../services/ai/types.ts"
import type {
  LegalAnalysisProvider,
  NormalizedDocument,
  RawAnalysisOutput,
  RawQAOutput,
} from "../services/ai/types.ts"
import type { UploadedDocument } from "../types/document.ts"

const mockNormalizedDoc: NormalizedDocument = {
  id: "qa_test_doc",
  name: "Commercial_Lease.txt",
  jurisdiction: "India",
  sourceText: `COMMERCIAL LEASE AGREEMENT
THIS LEASE is executed on October 1, 2026.
PARTIES:
1. SHANTHA REALTY VENTURES PRIVATE LIMITED (LESSOR);
2. NEXUS CLOUD COMPUTING SOLUTIONS PRIVATE LIMITED (LESSEE).
CLAUSE 3: RENT AND ESCALATION
The Lessee shall pay a monthly lease rental of INR 3,60,000/-.
The rent shall escalate by 5% annually.
CLAUSE 4: SECURITY DEPOSIT
Lessee deposits INR 21,60,000 as refundable interest-free security deposit.
CLAUSE 14: TERMINATION
Either party may terminate by providing sixty (60) days prior written notice.
Lock-in Period: 12 months from commencement.`,
  lines: [
    { lineNumber: 1, text: "COMMERCIAL LEASE AGREEMENT" },
    { lineNumber: 2, text: "THIS LEASE is executed on October 1, 2026." },
    { lineNumber: 3, text: "PARTIES:" },
    { lineNumber: 4, text: "1. SHANTHA REALTY VENTURES PRIVATE LIMITED (LESSOR);" },
    { lineNumber: 5, text: "2. NEXUS CLOUD COMPUTING SOLUTIONS PRIVATE LIMITED (LESSEE)." },
    { lineNumber: 6, text: "CLAUSE 3: RENT AND ESCALATION" },
    { lineNumber: 7, text: "The Lessee shall pay a monthly lease rental of INR 3,60,000/-." },
    { lineNumber: 8, text: "The rent shall escalate by 5% annually." },
    { lineNumber: 9, text: "CLAUSE 4: SECURITY DEPOSIT" },
    { lineNumber: 10, text: "Lessee deposits INR 21,60,000 as refundable interest-free security deposit." },
    { lineNumber: 11, text: "CLAUSE 14: TERMINATION" },
    { lineNumber: 12, text: "Either party may terminate by providing sixty (60) days prior written notice." },
    { lineNumber: 13, text: "Lock-in Period: 12 months from commencement." },
  ],
  lineCount: 13,
  wordCount: 85,
  metadata: {
    size: 700,
    mimeType: "text/plain",
    uploadedAt: new Date(),
  },
}

const mockUploadedDoc: UploadedDocument = {
  id: "qa_test_doc",
  name: "Commercial_Lease.txt",
  size: 700,
  type: "text/plain",
  extension: ".txt",
  lineCount: 13,
  wordCount: 85,
  uploadedAt: new Date(),
  jurisdiction: "India",
  isSample: true,
  isTextReadable: true,
  content: mockNormalizedDoc.sourceText,
}

// 1. Schema Validation Tests
test("QA Schema — Valid structured response passes", () => {
  const raw = {
    answer: "The lease rental is INR 3,60,000 per month.",
    confidence: "clear_in_document",
    uncertainty: "",
    evidence: [
      {
        quote: "The Lessee shall pay a monthly lease rental of INR 3,60,000/-.",
        startLine: 7,
        endLine: 7,
      },
    ],
  }

  const result = validateQASchema(raw)
  assert.ok(result.success)
  assert.strictEqual(result.data?.confidence, "clear_in_document")
  assert.strictEqual(result.data?.evidence.length, 1)
})

test("QA Schema — Missing answer is safely rejected", () => {
  const raw = {
    confidence: "clear_in_document",
    evidence: [],
  }

  const result = validateQASchema(raw)
  assert.strictEqual(result.success, false)
  assert.ok(result.error?.includes("answer"))
})

test("QA Schema — Non-positive line numbers are gracefully converted", () => {
  const raw = {
    answer: "No penalty is mentioned in this document.",
    confidence: "unclear_from_document",
    uncertainty: "Document does not specify a penalty.",
    evidence: [
      {
        quote: "",
        startLine: 0,
        endLine: 0,
      },
    ],
  }

  const result = validateQASchema(raw)
  assert.ok(result.success)
  assert.strictEqual(result.data?.confidence, "unclear_from_document")
  assert.strictEqual(result.data?.evidence[0].startLine, undefined)
})

// 2. Targeted Context Retrieval Tests
test("Context Retriever — Preserves original 1-indexed line numbers", () => {
  const result = retrieveTargetedContext(mockNormalizedDoc, "When can the agreement be terminated?")
  assert.ok(result.lines.length > 0)
  for (const line of result.lines) {
    assert.ok(line.lineNumber >= 1 && line.lineNumber <= mockNormalizedDoc.lineCount)
    assert.ok(line.text.length > 0)
  }
  assert.ok(result.formattedStream.includes("[L11]"))
})

test("Context Retriever — Finds termination clause with padding for large document", () => {
  // Create a document with 100 lines to test windowing
  const extendedLines = Array.from({ length: 100 }, (_, i) => ({
    lineNumber: i + 1,
    text: i === 50 ? "CLAUSE 14: Either party may terminate with 60 days notice." : `Standard clause text line ${i + 1}`,
  }))

  const largeDoc: NormalizedDocument = {
    ...mockNormalizedDoc,
    lines: extendedLines,
    lineCount: 100,
  }

  const result = retrieveTargetedContext(largeDoc, "What are the termination conditions?", { fallbackThreshold: 50, windowPadding: 2 })
  assert.strictEqual(result.retrievalMethod, "targeted_window")
  // Line 51 should be in the selected lines
  const hasTerminationLine = result.lines.some((l) => l.lineNumber === 51)
  assert.ok(hasTerminationLine)
})

// 3. Evidence Verification Tests
test("QA Evidence Validator — Verbatim quote matches exact line numbers", () => {
  const rawEvidence = [
    {
      quote: "Either party may terminate by providing sixty (60) days prior written notice.",
      startLine: 12,
      endLine: 12,
    },
  ]

  const verified = verifyQAEvidence(rawEvidence, mockNormalizedDoc)
  assert.strictEqual(verified.length, 1)
  assert.strictEqual(verified[0].verificationStatus, "verified")
  assert.strictEqual(verified[0].startLine, 12)
  assert.strictEqual(verified[0].endLine, 12)
})

test("QA Evidence Validator — Hallucinated quote not in document is flagged unverified", () => {
  const rawEvidence = [
    {
      quote: "Tenant shall pay an additional penalty fee of 20% for any late payment.",
      startLine: 7,
      endLine: 7,
    },
  ]

  const verified = verifyQAEvidence(rawEvidence, mockNormalizedDoc)
  assert.strictEqual(verified.length, 1)
  assert.strictEqual(verified[0].verificationStatus, "unverified")
})

// 4. AIService End-to-End Coordination Tests
test("AIService Q&A — Custom provider returns verified result", async () => {
  const mockProvider: LegalAnalysisProvider = {
    id: "mock-qa",
    name: "Mock Provider",
    async analyzeDocument(): Promise<RawAnalysisOutput> {
      throw new Error("Not used")
    },
    async answerQuestion(): Promise<RawQAOutput> {
      return {
        answer: "The monthly rent is INR 3,60,000.",
        confidence: "clear_in_document",
        uncertainty: "",
        evidence: [
          {
            quote: "The Lessee shall pay a monthly lease rental of INR 3,60,000/-.",
            startLine: 7,
            endLine: 7,
          },
        ],
      }
    },
  }

  const service = new LawLensAIService(mockProvider)
  const result = await service.askQuestion(mockUploadedDoc, "What is the monthly rent?")

  assert.strictEqual(result.question, "What is the monthly rent?")
  assert.strictEqual(result.answer, "The monthly rent is INR 3,60,000.")
  assert.strictEqual(result.confidence, "clear_in_document")
  assert.strictEqual(result.stats.verifiedCount, 1)
  assert.strictEqual(result.stats.unverifiedCount, 0)
  assert.strictEqual(result.evidence[0].startLine, 7)
})

test("AIService Q&A — Insufficient evidence calibrates confidence to unclear_from_document", async () => {
  const mockProvider: LegalAnalysisProvider = {
    id: "mock-qa",
    name: "Mock Provider",
    async analyzeDocument(): Promise<RawAnalysisOutput> {
      throw new Error("Not used")
    },
    async answerQuestion(): Promise<RawQAOutput> {
      return {
        answer: "The provided document does not specify any late payment penalty.",
        confidence: "supported_by_source",
        uncertainty: "Late payment penalty is not mentioned in the agreement.",
        evidence: [],
      }
    },
  }

  const service = new LawLensAIService(mockProvider)
  const result = await service.askQuestion(mockUploadedDoc, "What is the late payment penalty?")

  assert.strictEqual(result.confidence, "unclear_from_document")
  assert.ok(result.answer.includes("does not specify"))
  assert.strictEqual(result.stats.totalEvidenceCount, 0)
})

test("AIService Q&A — Missing API key in Groq provider throws safe 503 error", async () => {
  const emptyKeyProvider = new GroqLegalAnalysisProvider("")
  const service = new LawLensAIService(emptyKeyProvider)

  await assert.rejects(
    async () => {
      await service.askQuestion(mockUploadedDoc, "Who is the lessor?")
    },
    (err: unknown) => {
      assert.ok(err instanceof AIProviderError)
      assert.strictEqual(err.code, "MISSING_API_KEY")
      assert.strictEqual(err.statusCode, 503)
      return true
    }
  )
})
