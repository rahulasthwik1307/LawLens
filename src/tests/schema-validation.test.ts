import test from "node:test"
import assert from "node:assert/strict"
import { validateAnalysisSchema, AnalysisOutputSchema } from "../services/ai/analysis-schema.ts"

test("Schema Validation — Valid AI output passes successfully", () => {
  const validOutput = {
    documentType: "Commercial Lease Agreement",
    summary: "A commercial lease agreement for office space in Bengaluru.",
    parties: [
      {
        title: "Lessor",
        explanation: "Shantha Realty Ventures Private Limited",
        confidence: "clear_in_document",
        evidenceQuote: "SHANTHA REALTY VENTURES PRIVATE LIMITED",
        startLine: 22,
        endLine: 25,
      },
    ],
    dates: [
      {
        title: "Lease Term",
        explanation: "Three years starting November 1, 2026 to October 31, 2029.",
        confidence: "clear_in_document",
        evidenceQuote: "commencing from November 1, 2026 and expiring on October 31, 2029",
        startLine: 42,
        endLine: 44,
      },
    ],
    monetaryItems: [
      {
        title: "Monthly Rent",
        explanation: "INR 3,60,000 per month payable in advance.",
        confidence: "clear_in_document",
        evidenceQuote: "INR 3,60,000/- (Rupees Three Lakh Sixty Thousand only)",
        startLine: 47,
        endLine: 49,
      },
    ],
    rights: [],
    obligations: [],
    restrictions: [],
    termination: [],
    disputeResolution: [],
    reviewPoints: [],
  }

  const result = validateAnalysisSchema(validOutput)
  assert.strictEqual(result.success, true)
  assert.ok(result.data)
  assert.strictEqual(result.data.parties.length, 1)
  assert.strictEqual(result.data.dates.length, 1)
  assert.strictEqual(result.data.monetaryItems.length, 1)
  assert.strictEqual(result.data.parties[0].confidence, "clear_in_document")
})

test("Schema Validation — Missing required summary fails safely", () => {
  const invalidOutput = {
    documentType: "Lease",
    // summary is omitted
    parties: [],
  }

  const result = validateAnalysisSchema(invalidOutput)
  assert.strictEqual(result.success, false)
  assert.ok(result.error?.includes("summary"))
})

test("Schema Validation — Malformed party items fail safely", () => {
  const invalidOutput = {
    documentType: "Lease",
    summary: "Valid summary",
    parties: [
      {
        // title is missing
        explanation: "Missing title",
      },
    ],
  }

  const result = validateAnalysisSchema(invalidOutput)
  assert.strictEqual(result.success, false)
  assert.ok(result.error?.includes("title"))
})

test("Schema Validation — Confidence normalization handles various model formats", () => {
  const output = {
    documentType: "Lease",
    summary: "Summary text",
    parties: [
      { title: "P1", explanation: "Exp 1", confidence: "Clear in Document" },
      { title: "P2", explanation: "Exp 2", confidence: "supported by source" },
      { title: "P3", explanation: "Exp 3", confidence: "needs-review" },
      { title: "P4", explanation: "Exp 4", confidence: "unclear" },
      { title: "P5", explanation: "Exp 5", confidence: "unknown string" },
    ],
    dates: [],
    monetaryItems: [],
    rights: [],
    obligations: [],
    restrictions: [],
    termination: [],
    disputeResolution: [],
    reviewPoints: [],
  }

  const result = validateAnalysisSchema(output)
  assert.strictEqual(result.success, true)
  assert.ok(result.data)
  assert.strictEqual(result.data.parties[0].confidence, "clear_in_document")
  assert.strictEqual(result.data.parties[1].confidence, "supported_by_source")
  assert.strictEqual(result.data.parties[2].confidence, "needs_review")
  assert.strictEqual(result.data.parties[3].confidence, "unclear_from_document")
  assert.strictEqual(result.data.parties[4].confidence, "supported_by_source") // default fallback
})

test("Schema Validation — Tolerates null values returned by Groq strict JSON schemas", () => {
  const outputWithNulls = {
    documentType: null,
    summary: "Summary text with null fields",
    parties: [
      {
        title: "Lessor",
        explanation: "Party explanation",
        confidence: null,
        uncertainty: null,
        evidenceQuote: null,
        startLine: null,
        endLine: null,
      },
    ],
    dates: [],
    monetaryItems: [],
    rights: [],
    obligations: [],
    restrictions: [],
    termination: [],
    disputeResolution: [],
    reviewPoints: [],
  }

  const result = validateAnalysisSchema(outputWithNulls)
  assert.strictEqual(result.success, true)
  assert.ok(result.data)
  assert.strictEqual(result.data.documentType, "Legal Agreement")
  assert.strictEqual(result.data.parties[0].title, "Lessor")
  assert.strictEqual(result.data.parties[0].confidence, "supported_by_source")
  assert.strictEqual(result.data.parties[0].uncertainty, undefined)
  assert.strictEqual(result.data.parties[0].evidenceQuote, undefined)
  assert.strictEqual(result.data.parties[0].startLine, undefined)
  assert.strictEqual(result.data.parties[0].endLine, undefined)
})
