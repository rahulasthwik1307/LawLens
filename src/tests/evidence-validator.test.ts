import test from "node:test"
import assert from "node:assert/strict"
import { verifyFindingEvidence } from "../services/ai/evidence-validator.ts"
import type { NormalizedDocument } from "../services/ai/types.ts"

const mockDocument: NormalizedDocument = {
  id: "doc_test_1",
  name: "Sample_Lease.txt",
  jurisdiction: "India",
  sourceText: `COMMERCIAL LEASE AGREEMENT
THIS COMMERCIAL LEASE AGREEMENT is executed on this 1st day of October, 2026.
BY AND BETWEEN:
1. SHANTHA REALTY VENTURES PRIVATE LIMITED (LESSOR);
AND
2. NEXUS CLOUD COMPUTING SOLUTIONS PRIVATE LIMITED (LESSEE).
3. RENT AND ESCALATION
The Lessee shall pay a monthly lease rental of INR 3,60,000/-.
The rent shall be subject to an escalation of 5% every 12 months.
14. TERMINATION
Lock-in Period: Both parties agree to a lock-in period of twelve (12) months.`,
  lines: [
    { lineNumber: 1, text: "COMMERCIAL LEASE AGREEMENT" },
    { lineNumber: 2, text: "THIS COMMERCIAL LEASE AGREEMENT is executed on this 1st day of October, 2026." },
    { lineNumber: 3, text: "BY AND BETWEEN:" },
    { lineNumber: 4, text: "1. SHANTHA REALTY VENTURES PRIVATE LIMITED (LESSOR);" },
    { lineNumber: 5, text: "AND" },
    { lineNumber: 6, text: "2. NEXUS CLOUD COMPUTING SOLUTIONS PRIVATE LIMITED (LESSEE)." },
    { lineNumber: 7, text: "3. RENT AND ESCALATION" },
    { lineNumber: 8, text: "The Lessee shall pay a monthly lease rental of INR 3,60,000/-." },
    { lineNumber: 9, text: "The rent shall be subject to an escalation of 5% every 12 months." },
    { lineNumber: 10, text: "14. TERMINATION" },
    { lineNumber: 11, text: "Lock-in Period: Both parties agree to a lock-in period of twelve (12) months." },
  ],
  lineCount: 11,
  wordCount: 78,
  metadata: {
    size: 500,
    mimeType: "text/plain",
    uploadedAt: new Date(),
  },
}

test("Evidence Validator — Verbatim quote matches single line accurately", () => {
  const finding = verifyFindingEvidence(
    {
      title: "Monthly Rent",
      explanation: "Lessee pays monthly rent of INR 3,60,000.",
      confidence: "clear_in_document",
      evidenceQuote: "The Lessee shall pay a monthly lease rental of INR 3,60,000/-.",
    },
    "monetary",
    mockDocument,
    0
  )

  assert.ok(finding.evidence)
  assert.strictEqual(finding.evidence.verificationStatus, "verified")
  assert.strictEqual(finding.evidence.startLine, 8)
  assert.strictEqual(finding.evidence.endLine, 8)
  assert.strictEqual(finding.confidence, "clear_in_document")
})

test("Evidence Validator — Multi-line quote resolves correct spanning line range", () => {
  const finding = verifyFindingEvidence(
    {
      title: "Rent and Escalation",
      explanation: "Escalation clause over consecutive years.",
      confidence: "supported_by_source",
      evidenceQuote: "monthly lease rental of INR 3,60,000/-. The rent shall be subject to an escalation",
    },
    "monetary",
    mockDocument,
    1
  )

  assert.ok(finding.evidence)
  assert.strictEqual(finding.evidence.verificationStatus, "verified")
  assert.strictEqual(finding.evidence.startLine, 8)
  assert.strictEqual(finding.evidence.endLine, 9)
})

test("Evidence Validator — Model quote containing [L{num}] prefix is cleaned and matched", () => {
  const finding = verifyFindingEvidence(
    {
      title: "Lock-in Period",
      explanation: "12 months lock-in period.",
      confidence: "clear_in_document",
      evidenceQuote: "[L11] Lock-in Period: Both parties agree to a lock-in period",
    },
    "termination",
    mockDocument,
    2
  )

  assert.ok(finding.evidence)
  assert.strictEqual(finding.evidence.verificationStatus, "verified")
  assert.strictEqual(finding.evidence.startLine, 11)
  assert.strictEqual(finding.evidence.endLine, 11)
})

test("Evidence Validator — Hallucinated quote not in document is flagged unverified", () => {
  const finding = verifyFindingEvidence(
    {
      title: "Fabricated Security Deposit",
      explanation: "Tenant pays security deposit of INR 50,00,000.",
      confidence: "clear_in_document",
      evidenceQuote: "Lessee shall deposit fifty lakh rupees as non-refundable deposit.",
    },
    "monetary",
    mockDocument,
    3
  )

  assert.ok(finding.evidence)
  assert.strictEqual(finding.evidence.verificationStatus, "unverified")
  // Confidence must be downgraded from clear_in_document
  assert.strictEqual(finding.confidence, "needs_review")
  assert.ok(finding.uncertainty?.includes("Quote"))
})
