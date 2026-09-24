import test from "node:test"
import assert from "node:assert/strict"
import { GeminiLegalAnalysisProvider } from "../services/ai/providers/gemini-provider.ts"
import { LawLensAIService } from "../services/ai/ai-service.ts"
import { AIProviderError } from "../services/ai/types.ts"
import type {
  LegalAnalysisProvider,
  LegalAnalysisRequest,
  RawAnalysisOutput,
} from "../services/ai/types.ts"
import type { UploadedDocument } from "../types/document.ts"

const sampleDoc: UploadedDocument = {
  id: "doc_test_lease",
  name: "Lease_Sample.txt",
  size: 300,
  type: "text/plain",
  extension: ".txt",
  lineCount: 4,
  wordCount: 25,
  uploadedAt: new Date(),
  jurisdiction: "India",
  isTextReadable: true,
  content: `COMMERCIAL LEASE
Party A leases property to Party B.
Rent is INR 50,000 payable on 1st of each month.
Governing law is India.`,
}

test("Provider Failure — Missing API key throws safe 503 error", async () => {
  // Empty key
  const provider = new GeminiLegalAnalysisProvider("")
  await assert.rejects(
    async () => {
      await provider.analyzeDocument({
        document: {
          id: "1",
          name: "test.txt",
          jurisdiction: "India",
          sourceText: "Hello",
          lines: [{ lineNumber: 1, text: "Hello" }],
          lineCount: 1,
          wordCount: 1,
          metadata: { size: 5, mimeType: "text/plain", uploadedAt: new Date() },
        },
      })
    },
    (err: any) => {
      assert.strictEqual(err.code, "MISSING_API_KEY")
      assert.strictEqual(err.statusCode, 503)
      assert.strictEqual(err.retryable, false)
      assert.ok(err.userMessage.includes("Gemini API key is not configured"))
      return true
    }
  )
})

test("Provider Abstraction — Custom provider plugs into LawLensAIService seamlessly", async () => {
  // Mock custom provider demonstrating provider-independence
  class MockLegalProvider implements LegalAnalysisProvider {
    readonly id = "mock_provider"
    readonly name = "Mock Legal Engine"

    async analyzeDocument(
      request: LegalAnalysisRequest
    ): Promise<RawAnalysisOutput> {
      return {
        documentType: "Commercial Lease",
        summary: "Mock analysis summary for testing.",
        parties: [
          {
            title: "Party A",
            explanation: "Lessor in the agreement.",
            confidence: "clear_in_document",
            evidenceQuote: "Party A leases property to Party B.",
            startLine: 2,
            endLine: 2,
          },
        ],
        dates: [
          {
            title: "Payment Date",
            explanation: "1st of each month.",
            confidence: "clear_in_document",
            evidenceQuote: "payable on 1st of each month.",
            startLine: 3,
            endLine: 3,
          },
        ],
        monetaryItems: [
          {
            title: "Monthly Rent",
            explanation: "INR 50,000 per month.",
            confidence: "clear_in_document",
            evidenceQuote: "Rent is INR 50,000",
            startLine: 3,
            endLine: 3,
          },
        ],
        rights: [],
        obligations: [],
        restrictions: [],
        termination: [],
        disputeResolution: [],
        reviewPoints: [],
      }
    }
  }

  const customService = new LawLensAIService(new MockLegalProvider())
  assert.strictEqual(customService.providerId, "mock_provider")
  assert.strictEqual(customService.providerName, "Mock Legal Engine")

  const result = await customService.analyzeDocument(sampleDoc)
  assert.strictEqual(result.documentType, "Commercial Lease")
  assert.strictEqual(result.stats.totalFindings, 3)
  assert.strictEqual(result.stats.verifiedFindingsCount, 3)
  assert.strictEqual(result.stats.verificationRate, 100)
  assert.strictEqual(result.categories.parties[0].evidence?.verificationStatus, "verified")
})

test("Provider Abstraction — Malformed provider output is rejected safely", async () => {
  class MalformedProvider implements LegalAnalysisProvider {
    readonly id = "malformed_provider"
    readonly name = "Malformed Provider"

    async analyzeDocument(): Promise<any> {
      return {
        // Missing required summary and documentType
        parties: "invalid string instead of array",
      }
    }
  }

  const failingService = new LawLensAIService(new MalformedProvider())
  await assert.rejects(
    async () => {
      await failingService.analyzeDocument(sampleDoc)
    },
    (err: any) => {
      assert.strictEqual(err.code, "MALFORMED_OUTPUT")
      assert.strictEqual(err.statusCode, 422)
      assert.ok(err.userMessage.includes("reliably structure"))
      return true
    }
  )
})
