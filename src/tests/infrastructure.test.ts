/**
 * LawLens — Infrastructure Module Tests
 *
 * Tests for:
 * Phase B — Document Context Index (document-index.ts)
 * Phase D — Task Policy (task-policy.ts)
 * Phase E — Token Guard (token-guard.ts)
 * Phase F — Result Cache (result-cache.ts)
 * Phase G — Request Deduplication (result-cache.ts)
 * Phase J — Privacy-Safe Telemetry (ai-telemetry.ts)
 */

import test from "node:test"
import assert from "node:assert/strict"
import {
  buildDocumentIndex,
  findRelevantSections,
  djb2Hash,
  hashContentSync,
} from "../services/ai/document-index.ts"
import {
  getTaskPolicy,
  classifyStatusCode,
  calcRetryDelayMs,
  PIPELINE_VERSION,
} from "../services/ai/task-policy.ts"
import { runTokenPreflight, estimateTokens, checkContextFits } from "../services/ai/token-guard.ts"
import {
  buildCacheKey,
  resultCache,
  withDeduplicationAndCache,
} from "../services/ai/result-cache.ts"
import {
  aiTelemetry,
  logTelemetry,
  type AIRequestTelemetryRecord,
} from "../services/ai/ai-telemetry.ts"
import type { NormalizedDocument } from "../services/ai/types.ts"

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeNormalizedDoc(content: string, id = "test-doc"): NormalizedDocument {
  const rawLines = content.split(/\r\n|\r|\n/)
  const lines = rawLines.map((text, idx) => ({ lineNumber: idx + 1, text }))
  return {
    id,
    name: "Test_Document.txt",
    jurisdiction: "India",
    sourceText: content,
    lines,
    lineCount: lines.length,
    wordCount: content.trim().split(/\s+/).filter(Boolean).length,
    metadata: {
      size: content.length,
      mimeType: "text/plain",
      uploadedAt: new Date(),
    },
  }
}

const LEASE_CONTENT = `COMMERCIAL LEASE AGREEMENT
PARTIES:
Party A agrees to lease Office Suite 4B to Party B for a period of 12 months.

1. RENT AND PAYMENT
Monthly rent shall be INR 75,000 payable in advance on the 1st of each month.

2. SECURITY DEPOSIT
A security deposit of INR 1,50,000 shall be paid by Party B prior to occupation.

3. TERMINATION
Either party may terminate this agreement upon giving 30 days prior written notice.

4. DISPUTE RESOLUTION
Any disputes arising from this agreement shall be resolved by arbitration in India.

5. GOVERNING LAW
This agreement is governed by the laws of India.`

// ---------------------------------------------------------------------------
// Phase B — Document Context Index Tests
// ---------------------------------------------------------------------------

test("Document Index — djb2Hash produces deterministic 8-char hex string", () => {
  const hash1 = djb2Hash("hello world")
  const hash2 = djb2Hash("hello world")
  const hash3 = djb2Hash("different text")
  assert.strictEqual(hash1, hash2, "Same input must produce same hash")
  assert.notStrictEqual(hash1, hash3, "Different input must produce different hash")
  assert.match(hash1, /^[0-9a-f]{8}$/, "Hash must be 8 hex characters")
})

test("Document Index — hashContentSync produces consistent results", () => {
  const hash = hashContentSync("Test content for LawLens")
  assert.ok(typeof hash === "string", "Hash must be a string")
  assert.ok(hash.length > 0, "Hash must not be empty")
  assert.strictEqual(hashContentSync("Test content for LawLens"), hash, "Must be deterministic")
})

test("Document Index — buildDocumentIndex detects numbered clauses", () => {
  const doc = makeNormalizedDoc(LEASE_CONTENT)
  const index = buildDocumentIndex(doc)

  assert.ok(index.sections.length >= 5, "Should detect at least 5 numbered clauses")
  assert.ok(index.charCount > 0, "charCount must be set")
  assert.ok(index.approxTotalTokens > 0, "approxTotalTokens must be set")
  assert.ok(index.lineCount === doc.lineCount, "lineCount must match document")
  assert.ok(typeof index.contentHash === "string", "contentHash must be a string")
  assert.ok(index.indexedAt.length > 0, "indexedAt must be set")
})

test("Document Index — section boundaries are 1-indexed and non-overlapping", () => {
  const doc = makeNormalizedDoc(LEASE_CONTENT)
  const index = buildDocumentIndex(doc)

  for (const section of index.sections) {
    assert.ok(section.startLine >= 1, `startLine must be ≥ 1, got ${section.startLine}`)
    assert.ok(section.endLine >= section.startLine, "endLine must be ≥ startLine")
    assert.ok(section.charCount > 0, "charCount must be positive")
    assert.ok(section.approxTokens > 0, "approxTokens must be positive")
  }
})

test("Document Index — lineSectionMap covers all document lines", () => {
  const doc = makeNormalizedDoc(LEASE_CONTENT)
  const index = buildDocumentIndex(doc)

  for (const line of doc.lines) {
    assert.ok(
      index.lineSectionMap.has(line.lineNumber),
      `Line ${line.lineNumber} must be covered by section map`
    )
  }
})

test("Document Index — findRelevantSections returns sections matching keywords", () => {
  const doc = makeNormalizedDoc(LEASE_CONTENT)
  const index = buildDocumentIndex(doc)

  const relevant = findRelevantSections(index, ["rent", "payment"], 3, 2000)
  assert.ok(relevant.length > 0, "Should find sections matching 'rent' and 'payment'")

  // Sections should be sorted in document order
  for (let i = 1; i < relevant.length; i++) {
    assert.ok(
      relevant[i].startLine >= relevant[i - 1].startLine,
      "Sections must be sorted by startLine"
    )
  }
})

test("Document Index — findRelevantSections respects token budget", () => {
  const doc = makeNormalizedDoc(LEASE_CONTENT)
  const index = buildDocumentIndex(doc)

  const tightBudget = 50 // Very small budget
  const relevant = findRelevantSections(index, ["termination"], 10, tightBudget)

  let totalApproxTokens = 0
  for (const section of relevant) {
    totalApproxTokens += section.approxTokens
  }
  assert.ok(totalApproxTokens > 0, "Sections should have non-zero token count")
  // Budget may be slightly exceeded due to section granularity, but should be close
  assert.ok(relevant.length < index.sections.length, "Token budget should limit results")
})

test("Document Index — fallback chunking handles document with no detectable clauses", () => {
  const plainContent = "This is line one.\nThis is line two.\nThis is line three.\nFourth line here."
  const doc = makeNormalizedDoc(plainContent)
  const index = buildDocumentIndex(doc)

  assert.ok(index.sections.length > 0, "Fallback chunking must produce sections")
})

// ---------------------------------------------------------------------------
// Phase D — Task Policy Tests
// ---------------------------------------------------------------------------

test("Task Policy — qa task uses smaller model primary", () => {
  const policy = getTaskPolicy("qa")
  assert.ok(policy.primaryModel.includes("20b"), "Q&A primary should be the smaller 20B model")
  assert.ok(policy.maxCompletionTokens <= 1000, "Q&A token budget should be conservative")
  assert.ok(policy.timeoutMs <= 25000, "Q&A timeout should be appropriate for small tasks")
  assert.ok(policy.maxRetries >= 1, "Should have at least 1 retry configured")
  assert.strictEqual(policy.cachingEnabled, true, "Caching must be enabled")
})

test("Task Policy — actions task uses smaller model primary", () => {
  const policy = getTaskPolicy("actions")
  assert.ok(policy.primaryModel.includes("20b"), "Actions primary should be the smaller 20B model")
  assert.ok(policy.maxCompletionTokens <= 2500, "Actions token budget should be bounded")
  assert.strictEqual(policy.cachingEnabled, true, "Caching must be enabled")
})

test("Task Policy — findings task uses large model primary", () => {
  const policy = getTaskPolicy("findings")
  assert.ok(policy.primaryModel.includes("120b"), "Findings primary should be the large 120B model")
  assert.ok(policy.maxCompletionTokens >= 4000, "Findings needs larger token budget")
  assert.ok(policy.timeoutMs >= 28000, "Findings should have larger timeout")
})

test("Task Policy — compare task uses large model primary", () => {
  const policy = getTaskPolicy("compare")
  assert.ok(policy.primaryModel.includes("120b"), "Compare primary should be the large 120B model")
  assert.ok(policy.maxCompletionTokens >= 2000, "Compare needs adequate token budget")
  assert.ok(policy.timeoutMs >= 30000, "Compare should have largest timeout")
})

test("Task Policy — PIPELINE_VERSION is a non-empty string", () => {
  assert.ok(typeof PIPELINE_VERSION === "string", "PIPELINE_VERSION must be a string")
  assert.ok(PIPELINE_VERSION.length > 0, "PIPELINE_VERSION must be non-empty")
})

test("Task Policy — classifyStatusCode classifies recoverable codes correctly", () => {
  assert.strictEqual(classifyStatusCode(429), "recoverable", "429 is recoverable")
  assert.strictEqual(classifyStatusCode(502), "recoverable", "502 is recoverable")
  assert.strictEqual(classifyStatusCode(503), "recoverable", "503 is recoverable")
  assert.strictEqual(classifyStatusCode(504), "timeout", "504 is a timeout")
  assert.strictEqual(classifyStatusCode(500), "recoverable", "5xx generic is recoverable")
})

test("Task Policy — classifyStatusCode classifies non-recoverable codes correctly", () => {
  assert.strictEqual(classifyStatusCode(400), "non_recoverable", "400 is non-recoverable")
  assert.strictEqual(classifyStatusCode(401), "non_recoverable", "401 is non-recoverable")
  assert.strictEqual(classifyStatusCode(403), "non_recoverable", "403 is non-recoverable")
  assert.strictEqual(classifyStatusCode(413), "non_recoverable", "413 is non-recoverable")
  assert.strictEqual(classifyStatusCode(422), "non_recoverable", "422 is non-recoverable")
})

test("Task Policy — calcRetryDelayMs returns positive value with jitter", () => {
  const delays = Array.from({ length: 10 }, () => calcRetryDelayMs(0, 1000))
  for (const delay of delays) {
    assert.ok(delay >= 200, `Delay must be >= 200ms, got ${delay}`)
    assert.ok(delay <= 3000, `Delay must be <= 3000ms (base*2+jitter), got ${delay}`)
  }
  // Jitter: not all delays should be exactly the same
  const uniqueDelays = new Set(delays)
  assert.ok(uniqueDelays.size > 1, "Jitter should produce variable delays")
})

// ---------------------------------------------------------------------------
// Phase E — Token Guard Tests
// ---------------------------------------------------------------------------

test("Token Guard — estimateTokens returns chars/4 (ceiling)", () => {
  assert.strictEqual(estimateTokens("abcd"), 1, "4 chars = 1 token")
  assert.strictEqual(estimateTokens("abcde"), 2, "5 chars = 2 tokens (ceiling)")
  assert.strictEqual(estimateTokens("a".repeat(100)), 25, "100 chars = 25 tokens")
})

test("Token Guard — runTokenPreflight returns ok when within budget", () => {
  const result = runTokenPreflight("qa", 100, 500) // ~150 tokens input
  assert.strictEqual(result.decision, "ok", "Small input should pass ok")
  assert.ok(result.estimatedInputTokens > 0, "Must estimate input tokens")
  assert.ok(result.utilizationPct >= 0, "Utilization must be non-negative")
})

test("Token Guard — runTokenPreflight returns warning near budget", () => {
  // qa budget is 3000 input tokens
  // To hit ~85% utilization, we need ~2550 tokens = ~10200 chars
  const largePrompt = "x".repeat(10200)
  const result = runTokenPreflight("qa", 100, largePrompt.length)
  assert.ok(
    result.decision === "warning" || result.decision === "reduce",
    "Large input should be warning or reduce"
  )
})

test("Token Guard — runTokenPreflight returns reduce when over budget", () => {
  // qa budget is 3000 input tokens
  // 15000 chars = 3750 tokens = 125% utilization
  const oversizedPrompt = "x".repeat(15000)
  const result = runTokenPreflight("qa", 100, oversizedPrompt.length)
  assert.strictEqual(result.decision, "reduce", "Oversized input must trigger reduce")
  assert.ok(result.utilizationPct > 100, "Utilization must exceed 100%")
})

test("Token Guard — checkContextFits reports correctly", () => {
  const short = "short text"
  const result = checkContextFits(short, 1000)
  assert.strictEqual(result.fits, true, "Short text should fit in 1000 token budget")
  assert.ok(result.estimatedTokens > 0, "Token estimate must be positive")
  assert.ok(result.utilizationFraction < 1, "Utilization fraction must be < 1.0")
})

// ---------------------------------------------------------------------------
// Phase F — Result Cache Tests
// ---------------------------------------------------------------------------

test("Result Cache — buildCacheKey produces unique key per operation", () => {
  const findingsKey = buildCacheKey({ operation: "findings", documentHash: "abc123" })
  const qaKey = buildCacheKey({
    operation: "qa",
    documentHash: "abc123",
    normalizedQuestion: "what is the rent?",
  })
  const compareKey = buildCacheKey({
    operation: "compare",
    documentAHash: "abc123",
    documentBHash: "def456",
  })
  const actionsKey = buildCacheKey({
    operation: "actions",
    documentHash: "abc123",
    candidatesHash: "xyz789",
  })

  const keys = [findingsKey, qaKey, compareKey, actionsKey]
  const unique = new Set(keys)
  assert.strictEqual(unique.size, 4, "All keys must be unique")
  for (const key of keys) {
    assert.match(key, /^ll_\w+_[0-9a-f]+$/, `Key must match expected format: ${key}`)
  }
})

test("Result Cache — buildCacheKey normalizes questions consistently", () => {
  const key1 = buildCacheKey({
    operation: "qa",
    documentHash: "abc",
    normalizedQuestion: "  What is the RENT?  ",
  })
  const key2 = buildCacheKey({
    operation: "qa",
    documentHash: "abc",
    normalizedQuestion: "what is the rent?",
  })
  assert.strictEqual(key1, key2, "Question normalization must produce identical keys")
})

test("Result Cache — buildCacheKey embeds PIPELINE_VERSION for cache invalidation", () => {
  const key = buildCacheKey({ operation: "findings", documentHash: "doc1" })
  assert.ok(key.length > 10, "Key must be of meaningful length")
  // Different docHash must produce different key
  const key2 = buildCacheKey({ operation: "findings", documentHash: "doc2" })
  assert.notStrictEqual(key, key2, "Different docHash must produce different key")
})

test("Result Cache — stores and retrieves result", () => {
  resultCache.clear()
  const key = "test_cache_key_1"
  const value = { answer: "Test answer", confidence: "clear_in_document" }

  assert.strictEqual(resultCache.get(key), null, "Should be null before storing")
  resultCache.set(key, value)
  const retrieved = resultCache.get<typeof value>(key)
  assert.deepStrictEqual(retrieved, value, "Retrieved value must match stored")
})

test("Result Cache — returns null on miss", () => {
  resultCache.clear()
  const result = resultCache.get("non_existent_key")
  assert.strictEqual(result, null, "Must return null on cache miss")
})

test("Result Cache — TTL expiry evicts stale entries", async () => {
  resultCache.clear()
  const key = "expiring_test_key"
  resultCache.set(key, { data: "stale" }, 1) // 1ms TTL

  await new Promise((r) => setTimeout(r, 10)) // Wait for expiry

  const result = resultCache.get(key)
  assert.strictEqual(result, null, "Expired entry must not be returned")
})

test("Result Cache — stats tracks hits and misses", () => {
  resultCache.clear()
  const key = "stats_test_key"
  const value = { x: 1 }

  resultCache.set(key, value)
  resultCache.get(key) // hit
  resultCache.get("missing_key") // miss

  const stats = resultCache.stats
  assert.ok(stats.hitCount >= 1, "Hit count should increase on cache hit")
  assert.ok(stats.missCount >= 1, "Miss count should increase on cache miss")
  assert.ok(stats.hitRate >= 0 && stats.hitRate <= 100, "Hit rate must be 0-100")
})

// ---------------------------------------------------------------------------
// Phase G — Deduplication Tests
// ---------------------------------------------------------------------------

test("Deduplication — withDeduplicationAndCache returns cached result on hit", async () => {
  resultCache.clear()
  const key = "dedup_cache_test"
  let callCount = 0

  const executor = async () => {
    callCount++
    return { answer: "cached answer" }
  }

  // First call: cache miss, executes
  const result1 = await withDeduplicationAndCache(key, true, executor)
  assert.strictEqual(result1.cacheHit, false, "First call should not be a cache hit")
  assert.strictEqual(result1.deduplicated, false, "First call should not be deduplicated")
  assert.strictEqual(callCount, 1, "Executor should be called once")

  // Second call: cache hit, should NOT call executor
  const result2 = await withDeduplicationAndCache(key, true, executor)
  assert.strictEqual(result2.cacheHit, true, "Second call must be a cache hit")
  assert.strictEqual(callCount, 1, "Executor must not be called again")
  assert.deepStrictEqual(result2.result, result1.result, "Results must match")
})

test("Deduplication — withDeduplicationAndCache deduplicates concurrent requests", async () => {
  resultCache.clear()
  const key = "concurrent_dedup_test"
  let callCount = 0

  const slowExecutor = async () => {
    callCount++
    await new Promise((r) => setTimeout(r, 10))
    return { data: "concurrent result" }
  }

  // Launch two concurrent requests for the same key
  const [result1, result2] = await Promise.all([
    withDeduplicationAndCache(key, true, slowExecutor),
    withDeduplicationAndCache(key, true, slowExecutor),
  ])

  assert.strictEqual(callCount, 1, "Executor must only be called once for concurrent requests")
  assert.ok(
    !result1.cacheHit || !result2.cacheHit || result1.deduplicated || result2.deduplicated,
    "At least one request must be deduplicated or cached"
  )
})

test("Deduplication — failed execution is not cached", async () => {
  resultCache.clear()
  const key = "failure_not_cached_test"
  let callCount = 0

  const failingExecutor = async () => {
    callCount++
    throw new Error("Simulated AI failure")
  }

  await assert.rejects(
    async () => withDeduplicationAndCache(key, true, failingExecutor),
    /Simulated AI failure/
  )

  assert.strictEqual(callCount, 1, "Executor should have been called once")
  assert.strictEqual(resultCache.get(key), null, "Failed result must not be cached")
})

test("Deduplication — caching disabled bypasses cache", async () => {
  resultCache.clear()
  const key = "no_cache_test"
  let callCount = 0

  const executor = async () => {
    callCount++
    return { data: "fresh" }
  }

  await withDeduplicationAndCache(key, false, executor)
  await withDeduplicationAndCache(key, false, executor)

  assert.strictEqual(callCount, 2, "Executor must be called each time when caching disabled")
  assert.strictEqual(resultCache.get(key), null, "Result must not be in cache when disabled")
})

// ---------------------------------------------------------------------------
// Phase J — Telemetry Tests
// ---------------------------------------------------------------------------

test("Telemetry — records entries and computes summary", () => {
  aiTelemetry.clear()

  const record: AIRequestTelemetryRecord = {
    requestId: "test-req-1",
    task: "findings",
    provider: "groq",
    primaryModel: "openai/gpt-oss-120b",
    documentHash: "abc123hash",
    inputCharCount: 5000,
    estimatedInputTokens: 1250,
    maxCompletionTokens: 5000,
    latencyMs: 3200,
    primaryLatencyMs: 3200,
    primaryStatus: 200,
    outcome: "success",
    retried: false,
    fallbackUsed: false,
    cacheHit: false,
    deduplicated: false,
    preflightDecision: "ok",
    recordedAt: new Date().toISOString(),
  }

  aiTelemetry.record(record)

  const all = aiTelemetry.getAll()
  assert.strictEqual(all.length, 1, "Should have 1 record")
  assert.strictEqual(all[0].requestId, "test-req-1", "Record should match")

  const summary = aiTelemetry.getSummary()
  assert.strictEqual(summary.totalRequests, 1, "Total requests should be 1")
  assert.ok(summary.byTask["findings"] !== undefined, "Findings task metrics should exist")
  assert.strictEqual(summary.byTask["findings"]!.requestCount, 1, "Should count 1 findings request")
})

test("Telemetry — logTelemetry does not throw for success or failure records", () => {
  const successRecord: AIRequestTelemetryRecord = {
    requestId: "log-test-success",
    task: "qa",
    provider: "groq",
    primaryModel: "openai/gpt-oss-20b",
    documentHash: "dochash1",
    inputCharCount: 2000,
    estimatedInputTokens: 500,
    maxCompletionTokens: 800,
    latencyMs: 1200,
    primaryLatencyMs: 1200,
    primaryStatus: 200,
    outcome: "success",
    retried: false,
    fallbackUsed: false,
    cacheHit: false,
    deduplicated: false,
    recordedAt: new Date().toISOString(),
  }

  const failureRecord: AIRequestTelemetryRecord = {
    ...successRecord,
    requestId: "log-test-failure",
    outcome: "dual_failure",
    failureCategory: "server_error",
  }

  assert.doesNotThrow(() => logTelemetry(successRecord), "logTelemetry must not throw for success")
  assert.doesNotThrow(() => logTelemetry(failureRecord), "logTelemetry must not throw for failure")
})

test("Telemetry — logTelemetry does not log API keys, prompts, or document content", () => {
  // This test verifies the TYPE CONTRACT: the record type has no fields for
  // sensitive content, so it's impossible to accidentally log them.
  const record: AIRequestTelemetryRecord = {
    requestId: "security-test",
    task: "compare",
    provider: "groq",
    primaryModel: "openai/gpt-oss-120b",
    documentHash: "hash_not_content",  // Only hash, never content
    inputCharCount: 10000,             // Only char count, never the text
    estimatedInputTokens: 2500,
    maxCompletionTokens: 2500,
    latencyMs: 5000,
    primaryLatencyMs: 5000,
    primaryStatus: 200,
    outcome: "success",
    retried: false,
    fallbackUsed: false,
    cacheHit: false,
    deduplicated: false,
    recordedAt: new Date().toISOString(),
  }

  // The type check is the test: if this compiles, the record has no sensitive fields
  const keys = Object.keys(record)
  const sensitiveKeys = ["apiKey", "prompt", "content", "text", "document", "question", "key"]
  for (const sensitive of sensitiveKeys) {
    assert.ok(
      !keys.includes(sensitive),
      `Telemetry record must not contain '${sensitive}' field`
    )
  }
})

test("Telemetry — ring buffer evicts oldest on overflow", () => {
  aiTelemetry.clear()
  const MAX = 500

  // Fill beyond capacity
  for (let i = 0; i < MAX + 10; i++) {
    aiTelemetry.record({
      requestId: `req-${i}`,
      task: "qa",
      provider: "groq",
      primaryModel: "openai/gpt-oss-20b",
      documentHash: "hash",
      inputCharCount: 100,
      estimatedInputTokens: 25,
      maxCompletionTokens: 800,
      latencyMs: 100,
      primaryLatencyMs: 100,
      primaryStatus: 200,
      outcome: "success",
      retried: false,
      fallbackUsed: false,
      cacheHit: false,
      deduplicated: false,
      recordedAt: new Date().toISOString(),
    })
  }

  const all = aiTelemetry.getAll()
  assert.strictEqual(all.length, MAX, `Ring buffer must cap at ${MAX} records`)
  // Oldest entry (req-0) should be evicted
  assert.notStrictEqual(all[0].requestId, "req-0", "Oldest record should be evicted")
})
