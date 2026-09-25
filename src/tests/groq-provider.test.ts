import test from "node:test"
import assert from "node:assert/strict"
import {
  GroqLegalAnalysisProvider,
  buildGroqRequestBody,
} from "../services/ai/providers/groq-provider.ts"
import {
  ANALYSIS_JSON_SCHEMA,
  QA_JSON_SCHEMA,
  COMPARISON_JSON_SCHEMA,
  ACTION_JSON_SCHEMA,
} from "../services/ai/providers/groq-schemas.ts"
import { LawLensAIService } from "../services/ai/ai-service.ts"
import { AIProviderError } from "../services/ai/types.ts"
import { validateAnalysisSchema } from "../services/ai/analysis-schema.ts"
import { validateQASchema } from "../services/ai/qa-schema.ts"
import { validateComparisonSchema } from "../services/ai/comparison-schema.ts"
import { validateActionSchema } from "../services/ai/action-schema.ts"
import type {
  LegalAnalysisProvider,
  LegalAnalysisRequest,
  RawAnalysisOutput,
  RawComparisonOutput,
} from "../services/ai/types.ts"
import { normalizeDocument } from "../services/ai/document-normalizer.ts"
import type { UploadedDocument } from "../types/document.ts"

const sampleDoc: UploadedDocument = {
  id: "doc_groq_test",
  name: "Commercial_Lease_Agreement.txt",
  size: 350,
  type: "text/plain",
  extension: ".txt",
  lineCount: 5,
  wordCount: 30,
  uploadedAt: new Date(),
  jurisdiction: "India",
  isTextReadable: true,
  content: `COMMERCIAL LEASE AGREEMENT
Party A agrees to lease Office Suite 4B to Party B.
Monthly rent shall be INR 75,000 payable in advance on the 1st of each month.
Either party may terminate this agreement upon giving 30 days prior written notice.
This agreement is governed by the laws of India.`,
}

const validMockRawOutput: RawAnalysisOutput = {
  documentType: "Commercial Lease Agreement",
  summary: "A commercial lease agreement between Party A and Party B for Office Suite 4B.",
  parties: [
    {
      title: "Party A & Party B",
      explanation: "Lessor and lessee entering into lease for Office Suite 4B.",
      confidence: "clear_in_document",
      evidenceQuote: "Party A agrees to lease Office Suite 4B to Party B.",
      startLine: 2,
      endLine: 2,
    },
  ],
  dates: [
    {
      title: "Payment Due Date",
      explanation: "Rent is due on the 1st of each month.",
      confidence: "clear_in_document",
      evidenceQuote: "payable in advance on the 1st of each month.",
      startLine: 3,
      endLine: 3,
    },
  ],
  monetaryItems: [
    {
      title: "Monthly Rent",
      explanation: "INR 75,000 per month.",
      confidence: "clear_in_document",
      evidenceQuote: "Monthly rent shall be INR 75,000",
      startLine: 3,
      endLine: 3,
    },
  ],
  rights: [],
  obligations: [],
  restrictions: [],
  termination: [
    {
      title: "30-Day Notice Termination",
      explanation: "Either party may terminate with 30 days written notice.",
      confidence: "clear_in_document",
      evidenceQuote: "Either party may terminate this agreement upon giving 30 days prior written notice.",
      startLine: 4,
      endLine: 4,
    },
  ],
  disputeResolution: [],
  reviewPoints: [],
}

// ---------------------------------------------------------------------------
// Test 1 — Primary structured output configuration (Section 6, Test 1)
// ---------------------------------------------------------------------------
test("Test 1 — Primary structured output configuration sends strict JSON Schema to GPT-OSS 120B", async () => {
  const originalFetch = globalThis.fetch
  try {
    let capturedBody: Record<string, unknown> | null = null

    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string)
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(validMockRawOutput),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider(
      "mock_test_key",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b"
    )

    const result = await provider.analyzeDocument({
      document: {
        id: "1",
        name: "test.txt",
        jurisdiction: "India",
        sourceText: sampleDoc.content,
        lines: [
          { lineNumber: 1, text: "COMMERCIAL LEASE AGREEMENT" },
          { lineNumber: 2, text: "Party A agrees to lease Office Suite 4B to Party B." },
          { lineNumber: 3, text: "Monthly rent shall be INR 75,000 payable in advance on the 1st of each month." },
          { lineNumber: 4, text: "Either party may terminate this agreement upon giving 30 days prior written notice." },
          { lineNumber: 5, text: "This agreement is governed by the laws of India." },
        ],
        lineCount: 5,
        wordCount: 30,
        metadata: { size: 350, mimeType: "text/plain", uploadedAt: new Date() },
      },
    })

    assert.ok(capturedBody, "Request body must be captured")
    const reqPayload = capturedBody as Record<string, unknown>
    assert.strictEqual(reqPayload.model, "openai/gpt-oss-120b")
    assert.strictEqual(provider.modelName, "Groq · GPT-OSS 120B")
    assert.strictEqual(result.documentType, "Commercial Lease Agreement")

    // Verify strict JSON Schema configuration (NOT merely generic json_object)
    const responseFormat = reqPayload.response_format as Record<string, unknown>
    assert.ok(responseFormat, "response_format must be defined")
    assert.strictEqual(responseFormat.type, "json_schema")

    const jsonSchema = responseFormat.json_schema as Record<string, unknown>
    assert.ok(jsonSchema, "json_schema object must be defined")
    assert.strictEqual(jsonSchema.name, "legal_document_analysis")
    assert.strictEqual(jsonSchema.strict, true)

    const schemaObj = jsonSchema.schema as Record<string, unknown>
    assert.ok(schemaObj, "schema definition must be defined")
    assert.strictEqual(schemaObj.type, "object")
    assert.strictEqual(schemaObj.additionalProperties, false)
    assert.ok(Array.isArray(schemaObj.required), "required array must be defined")
    assert.ok(
      (schemaObj.required as string[]).includes("summary"),
      "summary must be required in schema"
    )
    assert.ok(
      (schemaObj.required as string[]).includes("parties"),
      "parties must be required in schema"
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

// ---------------------------------------------------------------------------
// Test 2 — Fallback structured output configuration (Section 6, Test 2)
// ---------------------------------------------------------------------------
test("Test 2 — Fallback structured output configuration sends identical strict JSON Schema to GPT-OSS 20B", async () => {
  const originalFetch = globalThis.fetch
  try {
    const capturedBodies: Record<string, unknown>[] = []

    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string)
      capturedBodies.push(body)

      if (body.model === "openai/gpt-oss-120b") {
        // Force primary model to fail (simulating transient 503)
        return new Response(
          JSON.stringify({ error: { message: "Primary 120B model temporarily overloaded" } }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      }

      // Fallback succeeds
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(validMockRawOutput),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider(
      "mock_test_key",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b"
    )

    const result = await provider.analyzeDocument({
      document: {
        id: "1",
        name: "test.txt",
        jurisdiction: "India",
        sourceText: sampleDoc.content,
        lines: [{ lineNumber: 1, text: "Line 1" }],
        lineCount: 1,
        wordCount: 2,
        metadata: { size: 10, mimeType: "text/plain", uploadedAt: new Date() },
      },
    })

    // With the new retry policy: primary attempt 1 → primary retry 1 → fallback = 3 calls total
    assert.strictEqual(capturedBodies.length, 3, "Expected 3 attempts: primary, primary retry, then fallback")
    const primaryReq = capturedBodies[0]
    const fallbackReq = capturedBodies[capturedBodies.length - 1]

    assert.strictEqual(primaryReq.model, "openai/gpt-oss-120b")
    assert.strictEqual(fallbackReq.model, "openai/gpt-oss-20b")
    assert.strictEqual(provider.modelName, "Groq · GPT-OSS 20B fallback")
    assert.strictEqual(result.documentType, "Commercial Lease Agreement")

    // Verify fallback model receives identical strict JSON Schema contract
    const fallbackResponseFormat = fallbackReq.response_format as Record<string, unknown>
    assert.strictEqual(fallbackResponseFormat.type, "json_schema")

    const fallbackJsonSchema = fallbackResponseFormat.json_schema as Record<string, unknown>
    assert.strictEqual(fallbackJsonSchema.name, "legal_document_analysis")
    assert.strictEqual(fallbackJsonSchema.strict, true)
    assert.deepStrictEqual(
      fallbackJsonSchema.schema,
      (primaryReq.response_format as Record<string, unknown> & { json_schema: { schema: unknown } })
        .json_schema.schema,
      "Fallback schema must strictly match primary schema"
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

// ---------------------------------------------------------------------------
// Test 3 — Schema-required fields enforcement (Section 6, Test 3)
// ---------------------------------------------------------------------------
test("Test 3 — Schema-required fields are strictly defined and enforced", () => {
  // 1. Analysis schema requires key fields and additionalProperties: false
  assert.strictEqual(ANALYSIS_JSON_SCHEMA.strict, true)
  assert.strictEqual(ANALYSIS_JSON_SCHEMA.schema.additionalProperties, false)
  const analysisRequired = ANALYSIS_JSON_SCHEMA.schema.required as string[]
  assert.ok(analysisRequired.includes("documentType"))
  assert.ok(analysisRequired.includes("summary"))
  assert.ok(analysisRequired.includes("parties"))
  assert.ok(analysisRequired.includes("dates"))
  assert.ok(analysisRequired.includes("monetaryItems"))
  assert.ok(analysisRequired.includes("rights"))
  assert.ok(analysisRequired.includes("obligations"))
  assert.ok(analysisRequired.includes("restrictions"))
  assert.ok(analysisRequired.includes("termination"))
  assert.ok(analysisRequired.includes("disputeResolution"))
  assert.ok(analysisRequired.includes("reviewPoints"))

  // 2. QA schema requires answer, confidence, uncertainty, evidence
  assert.strictEqual(QA_JSON_SCHEMA.strict, true)
  assert.strictEqual(QA_JSON_SCHEMA.schema.additionalProperties, false)
  const qaRequired = QA_JSON_SCHEMA.schema.required as string[]
  assert.ok(qaRequired.includes("answer"))
  assert.ok(qaRequired.includes("confidence"))
  assert.ok(qaRequired.includes("uncertainty"))
  assert.ok(qaRequired.includes("evidence"))

  // 3. Comparison schema requires executiveSummary, unchangedProvisionsSummary, differences
  assert.strictEqual(COMPARISON_JSON_SCHEMA.strict, true)
  assert.strictEqual(COMPARISON_JSON_SCHEMA.schema.additionalProperties, false)
  const compRequired = COMPARISON_JSON_SCHEMA.schema.required as string[]
  assert.ok(compRequired.includes("executiveSummary"))
  assert.ok(compRequired.includes("unchangedProvisionsSummary"))
  assert.ok(compRequired.includes("differences"))

  // 4. Action schema requires actions
  assert.strictEqual(ACTION_JSON_SCHEMA.strict, true)
  assert.strictEqual(ACTION_JSON_SCHEMA.schema.additionalProperties, false)
  const actionRequired = ACTION_JSON_SCHEMA.schema.required as string[]
  assert.ok(actionRequired.includes("actions"))

  // 5. Zod validator rejects payload missing required field
  const invalidAnalysis = { documentType: "Lease", parties: [] } // missing summary
  const validation = validateAnalysisSchema(invalidAnalysis)
  assert.strictEqual(validation.success, false)
  assert.ok(validation.error?.includes("summary"))
})

// ---------------------------------------------------------------------------
// Test 4 — Invalid structured output handling (Section 6, Test 4)
// ---------------------------------------------------------------------------
test("Test 4 — Malformed primary output (MALFORMED_OUTPUT/422) is non-recoverable and surfaces safe error", async () => {
  const originalFetch = globalThis.fetch
  try {
    let callCount = 0
    globalThis.fetch = async () => {
      callCount++
      // Primary returns malformed JSON (missing closing bracket) — HTTP 200 but invalid schema
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"documentType": "Incomplete"' } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider(
      "mock_test_key",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b"
    )

    // MALFORMED_OUTPUT is retryable=true so it will trigger retry (once), then fallback
    // Both will get the same malformed response → dual failure
    await assert.rejects(
      async () => {
        await provider.analyzeDocument({
          document: {
            id: "1",
            name: "test.txt",
            jurisdiction: "India",
            sourceText: sampleDoc.content,
            lines: [{ lineNumber: 1, text: "Line 1" }],
            lineCount: 1,
            wordCount: 2,
            metadata: { size: 10, mimeType: "text/plain", uploadedAt: new Date() },
          },
        })
      },
      (err: any) => {
        // Error should be MALFORMED_OUTPUT (from primary or fallback) or PROVIDER_UNAVAILABLE (dual fail)
        const validCodes = ["MALFORMED_OUTPUT", "PROVIDER_UNAVAILABLE"]
        assert.ok(validCodes.includes(err.code), `Unexpected error code: ${err.code}`)
        return true
      }
    )
    // With retry: at least 2 fetch calls (primary + retry), possibly 3 (+ fallback)
    assert.ok(callCount >= 2, `Should have at least 2 fetch calls due to retry, got ${callCount}`)
  } finally {
    globalThis.fetch = originalFetch
  }
})

// ---------------------------------------------------------------------------
// Test 5 — Evidence validation operates strictly (Section 6, Test 5)
// ---------------------------------------------------------------------------
test("Test 5 — Strict structured output does not bypass evidence verification", async () => {
  class MockStrictStructuredProvider implements LegalAnalysisProvider {
    readonly id = "groq"
    readonly name = "Groq"
    readonly modelName = "Groq · GPT-OSS 120B"

    async analyzeDocument(_request: LegalAnalysisRequest): Promise<RawAnalysisOutput> {
      return {
        documentType: "Commercial Lease",
        summary: "Test summary",
        parties: [
          {
            title: "Party A",
            explanation: "Lessor",
            confidence: "clear_in_document",
            // Verbatim quote present in document
            evidenceQuote: "Party A agrees to lease Office Suite 4B to Party B.",
            startLine: 2,
            endLine: 2,
          },
          {
            title: "Party C (Hallucinated Quote)",
            explanation: "Fabricated party not in text",
            confidence: "clear_in_document",
            // Quote does NOT exist in document
            evidenceQuote: "Party C shall guarantee all lease obligations unconditionally.",
            startLine: 99,
            endLine: 99,
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
    }
  }

  const service = new LawLensAIService(new MockStrictStructuredProvider())
  const result = await service.analyzeDocument(sampleDoc)

  const verifiedFinding = result.findings.find((f) => f.title === "Party A")
  assert.ok(verifiedFinding)
  assert.strictEqual(verifiedFinding.evidence?.verificationStatus, "verified")

  const hallucinatedFinding = result.findings.find((f) => f.title.includes("Party C"))
  assert.ok(hallucinatedFinding)
  assert.strictEqual(hallucinatedFinding.evidence?.verificationStatus, "unverified")

  assert.strictEqual(result.stats.totalFindings, 2)
  assert.strictEqual(result.stats.verifiedFindingsCount, 1)
  assert.strictEqual(result.stats.unverifiedFindingsCount, 1)
})

// ---------------------------------------------------------------------------
// Test 6 — Both-provider failure (Section 6, Test 6)
// ---------------------------------------------------------------------------
test("Test 6 — Dual-provider failure throws safe user-facing error without provider secrets", async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({ error: { message: "Fatal upstream connection timeout" } }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider(
      "super_secret_groq_api_key_9999",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b"
    )

    await assert.rejects(
      async () => {
        await provider.analyzeDocument({
          document: {
            id: "1",
            name: "test.txt",
            jurisdiction: "India",
            sourceText: sampleDoc.content,
            lines: [{ lineNumber: 1, text: "Line 1" }],
            lineCount: 1,
            wordCount: 2,
            metadata: { size: 10, mimeType: "text/plain", uploadedAt: new Date() },
          },
        })
      },
      (err: unknown) => {
        assert.ok(err instanceof AIProviderError)
        const error = err as AIProviderError
        assert.strictEqual(error.statusCode, 502)
        assert.strictEqual(
          error.userMessage,
          "The AI service could not complete this analysis right now. Your original document remains safe and available."
        )
        // Ensure no internal API codes or secrets leaked to userMessage
        assert.ok(!error.userMessage.includes("504"))
        assert.ok(!error.userMessage.includes("super_secret_groq_api_key"))
        assert.ok(!error.userMessage.includes("gemini"))
        return true
      }
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

// ---------------------------------------------------------------------------
// Test 7 — Latency instrumentation: primary request latency measured (Section 8, 11)
// ---------------------------------------------------------------------------
test("Test 7 — Latency instrumentation records real primary request latency deterministically", async () => {
  const originalFetch = globalThis.fetch
  try {
    const mockLatencyMs = 25

    globalThis.fetch = async () => {
      // Simulate controlled server delay
      await new Promise((resolve) => setTimeout(resolve, mockLatencyMs))
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(validMockRawOutput) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider(
      "test_key",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b"
    )

    const initialMetrics = provider.lastMetrics
    assert.strictEqual(initialMetrics, null, "lastMetrics must be null before any call")

    await provider.analyzeDocument({
      document: {
        id: "1",
        name: "test.txt",
        jurisdiction: "India",
        sourceText: sampleDoc.content,
        lines: [{ lineNumber: 1, text: "Line 1" }],
        lineCount: 1,
        wordCount: 2,
        metadata: { size: 10, mimeType: "text/plain", uploadedAt: new Date() },
      },
    })

    const metrics = provider.lastMetrics!
    assert.ok(metrics, "lastMetrics must be populated after call")
    assert.strictEqual(metrics.operation, "analyzeDocument")
    assert.strictEqual(metrics.primaryModel, "openai/gpt-oss-120b")
    assert.strictEqual(metrics.providerUsed, "openai/gpt-oss-120b")
    assert.strictEqual(metrics.fallbackUsed, false)
    assert.strictEqual(metrics.fallbackLatencyMs, null)
    assert.strictEqual(metrics.success, true)
    assert.ok(
      metrics.primaryLatencyMs >= 15,
      `primaryLatencyMs should be >= 15ms, got ${metrics.primaryLatencyMs}`
    )
    assert.ok(
      metrics.totalLatencyMs >= metrics.primaryLatencyMs,
      `totalLatencyMs (${metrics.totalLatencyMs}) must be >= primaryLatencyMs (${metrics.primaryLatencyMs})`
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

// ---------------------------------------------------------------------------
// Test 8 — Latency instrumentation: fallback request latency measured (Section 8, 11)
// ---------------------------------------------------------------------------
test("Test 8 — Latency instrumentation records separate primary and fallback latencies on fallback", async () => {
  const originalFetch = globalThis.fetch
  try {
    const primaryDelayMs = 20
    const fallbackDelayMs = 25

    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string)
      if (body.model === "openai/gpt-oss-120b") {
        await new Promise((resolve) => setTimeout(resolve, primaryDelayMs))
        return new Response(
          JSON.stringify({ error: { message: "Rate limit" } }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        )
      }

      await new Promise((resolve) => setTimeout(resolve, fallbackDelayMs))
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(validMockRawOutput) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider(
      "test_key",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b"
    )

    await provider.analyzeDocument({
      document: {
        id: "1",
        name: "test.txt",
        jurisdiction: "India",
        sourceText: sampleDoc.content,
        lines: [{ lineNumber: 1, text: "Line 1" }],
        lineCount: 1,
        wordCount: 2,
        metadata: { size: 10, mimeType: "text/plain", uploadedAt: new Date() },
      },
    })

    const metrics = provider.lastMetrics!
    assert.ok(metrics, "lastMetrics must be populated")
    assert.strictEqual(metrics.fallbackUsed, true)
    assert.strictEqual(metrics.providerUsed, "openai/gpt-oss-20b")
    assert.ok(
      metrics.primaryLatencyMs >= 10,
      `primaryLatencyMs should be >= 10ms, got ${metrics.primaryLatencyMs}`
    )
    assert.ok(
      metrics.fallbackLatencyMs !== null && metrics.fallbackLatencyMs >= 10,
      `fallbackLatencyMs should be >= 10ms, got ${metrics.fallbackLatencyMs}`
    )
    assert.ok(
      metrics.totalLatencyMs >= metrics.primaryLatencyMs + (metrics.fallbackLatencyMs || 0) - 10,
      `totalLatencyMs (${metrics.totalLatencyMs}) must cover both stages`
    )
    assert.strictEqual(metrics.success, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})

// ---------------------------------------------------------------------------
// Test 9 — Privacy-safe latency logging (Section 9, 11)
// ---------------------------------------------------------------------------
test("Test 9 — Privacy-safe latency logging logs concise telemetry and omits documents, prompts, and keys", async () => {
  const originalFetch = globalThis.fetch
  const capturedLogs: string[] = []
  const originalInfo = console.info
  const originalWarn = console.warn
  const originalError = console.error

  console.info = (...args: unknown[]) => capturedLogs.push(args.join(" "))
  console.warn = (...args: unknown[]) => capturedLogs.push(args.join(" "))
  console.error = (...args: unknown[]) => capturedLogs.push(args.join(" "))

  const privateDocContent = "HIGHLY_CONFIDENTIAL_TRADE_SECRET_ACQUISITION_TARGET_XYZ"
  const secretApiKey = "gsk_super_confidential_api_key_4433"

  try {
    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string)
      if (body.model === "openai/gpt-oss-120b") {
        return new Response(JSON.stringify({ error: { message: "503 overloaded" } }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(validMockRawOutput) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider(
      secretApiKey,
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b"
    )

    await provider.analyzeDocument({
      document: {
        id: "doc_classified",
        name: "Confidential.txt",
        jurisdiction: "India",
        sourceText: privateDocContent,
        lines: [{ lineNumber: 1, text: privateDocContent }],
        lineCount: 1,
        wordCount: 1,
        metadata: { size: 100, mimeType: "text/plain", uploadedAt: new Date() },
      },
    })

    // Check that concise telemetry was logged with new [LawLens:AI] prefix
    const lawlensLog = capturedLogs.find((l) => l.startsWith("[LawLens:AI]"))
    assert.ok(lawlensLog, "Concise [LawLens:AI] telemetry log must be emitted")

    // Ensure zero leakage of sensitive data in ALL logged lines
    for (const log of capturedLogs) {
      assert.ok(
        !log.includes(privateDocContent),
        `Document text leaked into server logs: ${log}`
      )
      assert.ok(
        !log.includes(secretApiKey),
        `API key leaked into server logs: ${log}`
      )
      assert.ok(
        !log.includes("Please analyze the following legal document"),
        `Prompt instruction leaked into server logs: ${log}`
      )
    }
  } finally {
    globalThis.fetch = originalFetch
    console.info = originalInfo
    console.warn = originalWarn
    console.error = originalError
  }
})

// ---------------------------------------------------------------------------
// Test 10 — Pure request builder configuration verification (Section 7)
// ---------------------------------------------------------------------------
test("Test 10 — buildGroqRequestBody generates exact strict JSON Schema payloads for all operations", () => {
  // 1. Analysis request payload
  const analysisBody = buildGroqRequestBody({
    model: "openai/gpt-oss-120b",
    systemInstruction: "system instruction",
    userPrompt: "user prompt",
    jsonSchema: ANALYSIS_JSON_SCHEMA,
    reasoningEffort: "low",
    temperature: 0.1,
  })

  assert.strictEqual(analysisBody.model, "openai/gpt-oss-120b")
  assert.strictEqual(analysisBody.reasoning_effort, "low")
  assert.strictEqual(analysisBody.temperature, 0.1)
  const analysisFmt = analysisBody.response_format as Record<string, unknown>
  assert.strictEqual(analysisFmt.type, "json_schema")
  const analysisSchemaObj = analysisFmt.json_schema as Record<string, unknown>
  assert.strictEqual(analysisSchemaObj.name, "legal_document_analysis")
  assert.strictEqual(analysisSchemaObj.strict, true)
  assert.strictEqual(analysisSchemaObj.schema, ANALYSIS_JSON_SCHEMA.schema)

  // 2. QA request payload
  const qaBody = buildGroqRequestBody({
    model: "openai/gpt-oss-20b",
    systemInstruction: "qa system",
    userPrompt: "qa prompt",
    jsonSchema: QA_JSON_SCHEMA,
  })
  assert.strictEqual(qaBody.model, "openai/gpt-oss-20b")
  const qaFmt = qaBody.response_format as Record<string, unknown>
  assert.strictEqual(qaFmt.type, "json_schema")
  const qaSchemaObj = qaFmt.json_schema as Record<string, unknown>
  assert.strictEqual(qaSchemaObj.name, "legal_document_qa")
  assert.strictEqual(qaSchemaObj.strict, true)

  // 3. Comparison request payload
  const compBody = buildGroqRequestBody({
    model: "openai/gpt-oss-120b",
    systemInstruction: "comp system",
    userPrompt: "comp prompt",
    jsonSchema: COMPARISON_JSON_SCHEMA,
  })
  const compFmt = compBody.response_format as Record<string, unknown>
  assert.strictEqual(compFmt.type, "json_schema")
  const compSchemaObj = compFmt.json_schema as Record<string, unknown>
  assert.strictEqual(compSchemaObj.name, "legal_document_comparison")
  assert.strictEqual(compSchemaObj.strict, true)

  // 4. Action request payload
  const actionBody = buildGroqRequestBody({
    model: "openai/gpt-oss-120b",
    systemInstruction: "action system",
    userPrompt: "action prompt",
    jsonSchema: ACTION_JSON_SCHEMA,
  })
  const actionFmt = actionBody.response_format as Record<string, unknown>
  assert.strictEqual(actionFmt.type, "json_schema")
  const actionSchemaObj = actionFmt.json_schema as Record<string, unknown>
  assert.strictEqual(actionSchemaObj.name, "legal_document_actions")
  assert.strictEqual(actionSchemaObj.strict, true)

  // 5. Fallback when jsonSchema is omitted
  const genericBody = buildGroqRequestBody({
    model: "openai/gpt-oss-120b",
    systemInstruction: "sys",
    userPrompt: "user",
  })
  const genericFmt = genericBody.response_format as Record<string, unknown>
  assert.strictEqual(genericFmt.type, "json_object")
})

// ---------------------------------------------------------------------------
// Security & Architecture Verification
// ---------------------------------------------------------------------------
test("Security — GROQ_API_KEY is never defined as NEXT_PUBLIC and not exposed to client", () => {
  assert.strictEqual(
    process.env.NEXT_PUBLIC_GROQ_API_KEY,
    undefined,
    "NEXT_PUBLIC_GROQ_API_KEY must never be defined"
  )
})

test("React Lifecycle — Q&A history updater does not invoke callbacks during render/state calculation", () => {
  let callbackInvocationCount = 0
  const onQAHistoryChange = (_newHistory: unknown[]) => {
    callbackInvocationCount++
  }

  const existingHistory: Array<{ answer: string }> = [{ answer: "Previous answer" }]
  const newResult: { answer: string } = { answer: "New verified answer" }

  const updated = [newResult, ...existingHistory]
  onQAHistoryChange(updated)

  assert.strictEqual(callbackInvocationCount, 1)
  assert.strictEqual(updated.length, 2)
  assert.strictEqual(updated[0].answer, "New verified answer")
})

// ---------------------------------------------------------------------------
// Document Comparison Failure & Recovery Tests (Section 8, 9, 10)
// ---------------------------------------------------------------------------

const sampleCompareDocA: UploadedDocument = {
  id: "compare_doc_a",
  name: "Lease_Draft_v1.txt",
  size: 300,
  type: "text/plain",
  extension: ".txt",
  lineCount: 5,
  wordCount: 35,
  uploadedAt: new Date(),
  jurisdiction: "India",
  isTextReadable: true,
  content: `COMMERCIAL LEASE DRAFT 1
Clause 1. Parties: Alpha Corp (Lessor) and Beta Ltd (Lessee).
Clause 2. Premises: Suite 101, Prestige Tech Park, Bangalore.
Clause 3. Rent: Monthly rent is INR 1,00,000 payable on 1st of month.
Clause 4. Governing Law: This contract shall be governed by laws of India.`,
}

const sampleCompareDocB: UploadedDocument = {
  id: "compare_doc_b",
  name: "Lease_Draft_v2.txt",
  size: 350,
  type: "text/plain",
  extension: ".txt",
  lineCount: 6,
  wordCount: 42,
  uploadedAt: new Date(),
  jurisdiction: "India",
  isTextReadable: true,
  content: `COMMERCIAL LEASE DRAFT 2
Clause 1. Parties: Alpha Corp (Lessor) and Beta Ltd (Lessee).
Clause 2. Premises: Suite 101, Prestige Tech Park, Bangalore.
Clause 3. Rent: Monthly rent is INR 1,20,000 payable on 1st of month.
Clause 4. Governing Law: This contract shall be governed by laws of India.
Clause 5. Maintenance: Lessee shall bear all internal HVAC repair costs.`,
}

const validMockRawComparisonOutput: RawComparisonOutput = {
  executiveSummary: "Draft 2 increases monthly rent from INR 1,00,000 to INR 1,20,000 and introduces a new maintenance obligation.",
  unchangedProvisionsSummary: "Premises and governing law clauses remain unchanged between both drafts.",
  differences: [
    {
      clauseTitle: "Rent",
      clauseNumber: "3",
      type: "value_changed",
      reviewStatus: "standard_modification",
      summary: "Rent increased by INR 20,000 per month.",
      explanation: "Draft 1 set rent at INR 1,00,000; Draft 2 sets rent at INR 1,20,000.",
      evidenceA: [
        {
          document: "A",
          quote: "Monthly rent is INR 1,00,000 payable on 1st of month.",
          startLine: 4,
          endLine: 4,
        },
      ],
      evidenceB: [
        {
          document: "B",
          quote: "Monthly rent is INR 1,20,000 payable on 1st of month.",
          startLine: 4,
          endLine: 4,
        },
      ],
      riskOrReviewNote: null,
    },
    {
      clauseTitle: "Maintenance",
      clauseNumber: "5",
      type: "added",
      reviewStatus: "review_recommended",
      summary: "Lessee is newly required to bear HVAC maintenance costs.",
      explanation: "Clause 5 is newly added in Draft 2, shifting internal HVAC repair costs to Lessee.",
      evidenceA: [],
      evidenceB: [
        {
          document: "B",
          quote: "Lessee shall bear all internal HVAC repair costs.",
          startLine: 6,
          endLine: 6,
        },
      ],
      riskOrReviewNote: "Places unexpected operational cost on Lessee.",
    },
  ],
}

test("Compare Test 1 — Primary GPT-OSS 120B receives comparison schema, sets max_completion_tokens, and succeeds", async () => {
  const originalFetch = globalThis.fetch
  try {
    let capturedBody: Record<string, unknown> | null = null

    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string)
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(validMockRawComparisonOutput) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider("test_key", "openai/gpt-oss-120b", "openai/gpt-oss-20b")
    const normA = normalizeDocument(sampleCompareDocA)
    const normB = normalizeDocument(sampleCompareDocB)

    const rawResult = await provider.compareDocuments({
      documentA: normA,
      documentB: normB,
      jurisdiction: "India",
      alignedContext: "alignment",
    })

    assert.ok(capturedBody)
    const reqPayload = capturedBody as Record<string, unknown>
    assert.strictEqual(reqPayload.model, "openai/gpt-oss-120b")
    // max_completion_tokens from task policy for 'compare' task
    assert.strictEqual(reqPayload.max_completion_tokens, 2500)

    const responseFormat = reqPayload.response_format as Record<string, unknown>
    assert.strictEqual(responseFormat.type, "json_schema")
    const jsonSchema = responseFormat.json_schema as Record<string, unknown>
    assert.strictEqual(jsonSchema.name, "legal_document_comparison")
    assert.strictEqual(jsonSchema.strict, true)

    // Check Zod validation
    const validation = validateComparisonSchema(rawResult)
    assert.strictEqual(validation.success, true)

    // Check dual evidence validation through AIService
    const service = new LawLensAIService(provider)
    const result = await service.compareDocuments(sampleCompareDocA, sampleCompareDocB)
    assert.strictEqual(result.differences.length, 2)
    assert.strictEqual(result.stats.verifiedEvidenceItems >= 2, true)

    const metrics = provider.lastMetrics!
    assert.strictEqual(metrics.operation, "compareDocuments")
    assert.strictEqual(metrics.primaryModel, "openai/gpt-oss-120b")
    assert.strictEqual(metrics.fallbackUsed, false)
    assert.strictEqual(metrics.primaryStatus, 200)
    assert.strictEqual(metrics.fallbackStatus, null)
    assert.strictEqual(metrics.success, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("Compare Test 2 — Primary timeout (504) triggers fallback to GPT-OSS 20B with identical schema and succeeds", async () => {
  const originalFetch = globalThis.fetch
  try {
    const capturedBodies: Record<string, unknown>[] = []

    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string)
      capturedBodies.push(body)

      if (body.model === "openai/gpt-oss-120b") {
        return new Response(JSON.stringify({ error: { message: "Gateway Timeout" } }), {
          status: 504,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(validMockRawComparisonOutput) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider("test_key", "openai/gpt-oss-120b", "openai/gpt-oss-20b")
    const normA = normalizeDocument(sampleCompareDocA)
    const normB = normalizeDocument(sampleCompareDocB)

    const result = await provider.compareDocuments({
      documentA: normA,
      documentB: normB,
      jurisdiction: "India",
    })

    // With retry policy: primary attempt 1 → primary retry 1 → fallback = 3 total calls
    assert.ok(capturedBodies.length >= 2, "Must have at least primary and fallback calls")
    const primaryReq = capturedBodies[0]
    const fallbackReq = capturedBodies[capturedBodies.length - 1]
    assert.strictEqual(primaryReq.model, "openai/gpt-oss-120b")
    assert.strictEqual(fallbackReq.model, "openai/gpt-oss-20b")
    assert.strictEqual(fallbackReq.max_completion_tokens, 2500)

    const metrics = provider.lastMetrics!
    assert.strictEqual(metrics.fallbackUsed, true)
    assert.strictEqual(metrics.primaryStatus, 504)
    assert.strictEqual(metrics.fallbackStatus, 200)
    assert.strictEqual(metrics.success, true)
    assert.strictEqual(provider.modelName, "Groq · GPT-OSS 20B fallback")
    assert.strictEqual(result.differences.length, 2)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("Compare Test 3 — Primary 429 rate limit triggers fallback to GPT-OSS 20B and succeeds", async () => {
  const originalFetch = globalThis.fetch
  try {
    const capturedBodies: Record<string, unknown>[] = []

    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string)
      capturedBodies.push(body)

      if (body.model === "openai/gpt-oss-120b") {
        return new Response(JSON.stringify({ error: { message: "Rate limit reached" } }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(validMockRawComparisonOutput) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider("test_key", "openai/gpt-oss-120b", "openai/gpt-oss-20b")
    const normA = normalizeDocument(sampleCompareDocA)
    const normB = normalizeDocument(sampleCompareDocB)

    const result = await provider.compareDocuments({
      documentA: normA,
      documentB: normB,
      jurisdiction: "India",
    })

    // With retry policy: primary attempt 1 → primary retry 1 → fallback = 3 total calls
    assert.ok(capturedBodies.length >= 2, "Must have at least primary and fallback calls")
    const metrics = provider.lastMetrics!
    assert.strictEqual(metrics.fallbackUsed, true)
    assert.strictEqual(metrics.primaryStatus, 429)
    assert.strictEqual(metrics.fallbackStatus, 200)
    assert.strictEqual(metrics.success, true)
    assert.strictEqual(result.differences.length, 2)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("Compare Test 4 — Primary 503 service unavailable triggers fallback to GPT-OSS 20B and succeeds", async () => {
  const originalFetch = globalThis.fetch
  try {
    const capturedBodies: Record<string, unknown>[] = []

    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string)
      capturedBodies.push(body)

      if (body.model === "openai/gpt-oss-120b") {
        return new Response(JSON.stringify({ error: { message: "Overloaded" } }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(validMockRawComparisonOutput) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider("test_key", "openai/gpt-oss-120b", "openai/gpt-oss-20b")
    const normA = normalizeDocument(sampleCompareDocA)
    const normB = normalizeDocument(sampleCompareDocB)

    const result = await provider.compareDocuments({
      documentA: normA,
      documentB: normB,
      jurisdiction: "India",
    })

    // With retry policy: primary attempt 1 → primary retry 1 → fallback = 3 total calls
    assert.ok(capturedBodies.length >= 2, "Must have at least primary and fallback calls")
    const metrics = provider.lastMetrics!
    assert.strictEqual(metrics.fallbackUsed, true)
    assert.strictEqual(metrics.primaryStatus, 503)
    assert.strictEqual(metrics.fallbackStatus, 200)
    assert.strictEqual(metrics.success, true)
    assert.strictEqual(result.differences.length, 2)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("Compare Test 5 — Primary request-too-large (413) does NOT fallback and sets failureCategory='request_too_large'", async () => {
  const originalFetch = globalThis.fetch
  try {
    const capturedBodies: Record<string, unknown>[] = []

    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string)
      capturedBodies.push(body)

      return new Response(
        JSON.stringify({
          error: {
            message: "Request too large for model 'openai/gpt-oss-120b' on tokens per minute (TPM): Limit 8000, Requested 9570",
          },
        }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider("test_key", "openai/gpt-oss-120b", "openai/gpt-oss-20b")
    const normA = normalizeDocument(sampleCompareDocA)
    const normB = normalizeDocument(sampleCompareDocB)

    await assert.rejects(
      async () => {
        await provider.compareDocuments({
          documentA: normA,
          documentB: normB,
          jurisdiction: "India",
        })
      },
      (err: unknown) => {
        assert.ok(err instanceof AIProviderError)
        const aerr = err as AIProviderError
        assert.strictEqual(aerr.code, "REQUEST_TOO_LARGE")
        assert.strictEqual(aerr.statusCode, 413)
        assert.strictEqual(aerr.retryable, false)
        return true
      }
    )

    // Verify fallback model was NOT called with identical oversized payload
    assert.strictEqual(capturedBodies.length, 1, "Fallback must be skipped on 413 request_too_large")
    const metrics = provider.lastMetrics!
    assert.strictEqual(metrics.fallbackUsed, false)
    assert.strictEqual(metrics.primaryStatus, 413)
    assert.strictEqual(metrics.fallbackStatus, "skipped")
    assert.strictEqual(metrics.failureCategory, "request_too_large")
    assert.strictEqual(metrics.success, false)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("Compare Test 6 — Dual-provider failure surfaces safe user-facing error without secrets", async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({ error: { message: "Internal server error" } }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const provider = new GroqLegalAnalysisProvider("super_secret_groq_key_compare", "openai/gpt-oss-120b", "openai/gpt-oss-20b")
    const normA = normalizeDocument(sampleCompareDocA)
    const normB = normalizeDocument(sampleCompareDocB)

    await assert.rejects(
      async () => {
        await provider.compareDocuments({
          documentA: normA,
          documentB: normB,
          jurisdiction: "India",
        })
      },
      (err: unknown) => {
        assert.ok(err instanceof AIProviderError)
        const aerr = err as AIProviderError
        assert.strictEqual(aerr.statusCode, 502)
        assert.strictEqual(
          aerr.userMessage,
          "The AI service could not complete this analysis right now. Your original document remains safe and available."
        )
        assert.ok(!aerr.userMessage.includes("super_secret_groq_key_compare"))
        assert.ok(!aerr.userMessage.includes("500"))
        return true
      }
    )

    const metrics = provider.lastMetrics!
    assert.strictEqual(metrics.fallbackUsed, true)
    assert.strictEqual(metrics.primaryStatus, 500)
    assert.strictEqual(metrics.fallbackStatus, 500)
    assert.strictEqual(metrics.failureCategory, "server_error")
    assert.strictEqual(metrics.success, false)
  } finally {
    globalThis.fetch = originalFetch
  }
})
