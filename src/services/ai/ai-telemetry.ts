/**
 * LawLens — Privacy-Safe AI Telemetry Layer (Phase J)
 *
 * Records operational metadata about every AI request.
 * NEVER logs: API keys, full prompts, document content, user data.
 * ONLY logs: safe operational metadata for diagnostics and benchmarking.
 *
 * This is an in-memory telemetry store suitable for a single-process
 * Next.js server. It is NOT a database — it resets on server restart.
 * Future: can be flushed to a structured log or analytics backend.
 *
 * Privacy rules (enforced by type constraints):
 * - No document text
 * - No user questions
 * - Only hashed document identifiers
 * - No provider credentials
 */

import type { AITask } from "./task-policy.ts"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TelemetryOutcome =
  | "success"
  | "fallback_success"
  | "primary_failed_non_recoverable"
  | "dual_failure"
  | "cache_hit"
  | "deduplication_reuse"
  | "schema_failure"
  | "preflight_blocked"

export interface AIRequestTelemetryRecord {
  /** Unique request id (uuid-style) */
  requestId: string
  /** AI task type */
  task: AITask
  /** Provider identifier */
  provider: string
  /** Primary model used */
  primaryModel: string
  /** Fallback model (if used) */
  fallbackModel?: string
  /** Hashed document identifier (not the document itself) */
  documentHash: string
  /** Approximate input characters (not the content) */
  inputCharCount: number
  /** Estimated input tokens */
  estimatedInputTokens: number
  /** Maximum completion tokens configured */
  maxCompletionTokens: number
  /** Actual tokens used if provider reports them */
  actualInputTokens?: number
  actualOutputTokens?: number
  cachedTokens?: number
  /** Total request latency (ms) */
  latencyMs: number
  /** Primary model latency (ms) */
  primaryLatencyMs: number
  /** Fallback model latency (ms) if used */
  fallbackLatencyMs?: number
  /** HTTP status from primary attempt */
  primaryStatus: number | string
  /** HTTP status from fallback attempt */
  fallbackStatus?: number | string | null
  /** Outcome classification */
  outcome: TelemetryOutcome
  /** Whether a retry was attempted on primary model */
  retried: boolean
  /** Whether the fallback model was invoked */
  fallbackUsed: boolean
  /** Whether result was served from cache */
  cacheHit: boolean
  /** Whether request was deduplicated (reused in-flight result) */
  deduplicated: boolean
  /** Token preflight decision */
  preflightDecision?: "ok" | "warning" | "reduce"
  /** Failure category if applicable */
  failureCategory?: string
  /** ISO timestamp */
  recordedAt: string
}

// ---------------------------------------------------------------------------
// In-memory telemetry store
// ---------------------------------------------------------------------------

const MAX_TELEMETRY_RECORDS = 500 // Circular ring-buffer size

class AITelemetryStore {
  private records: AIRequestTelemetryRecord[] = []

  record(entry: AIRequestTelemetryRecord): void {
    // Ring-buffer: evict oldest when at capacity
    if (this.records.length >= MAX_TELEMETRY_RECORDS) {
      this.records.shift()
    }
    this.records.push(entry)
  }

  getAll(): Readonly<AIRequestTelemetryRecord[]> {
    return this.records
  }

  getByTask(task: AITask): AIRequestTelemetryRecord[] {
    return this.records.filter((r) => r.task === task)
  }

  getSummary(): TelemetrySummary {
    return computeTelemetrySummary(this.records)
  }

  clear(): void {
    this.records = []
  }
}

export const aiTelemetry = new AITelemetryStore()

// ---------------------------------------------------------------------------
// Summary / metrics computation
// ---------------------------------------------------------------------------

export interface TaskMetrics {
  task: AITask
  requestCount: number
  successCount: number
  failureCount: number
  cacheHitCount: number
  fallbackCount: number
  retryCount: number
  deduplicationCount: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  avgInputTokens: number
  avgOutputTokens: number
  successRate: number
  cacheHitRate: number
  fallbackRate: number
}

export interface TelemetrySummary {
  totalRequests: number
  byTask: Partial<Record<AITask, TaskMetrics>>
  overallSuccessRate: number
  overallCacheHitRate: number
  overallFallbackRate: number
}

function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0
  const idx = Math.ceil((p / 100) * sortedArr.length) - 1
  return sortedArr[Math.max(0, idx)]
}

function computeTaskMetrics(records: AIRequestTelemetryRecord[], task: AITask): TaskMetrics {
  const taskRecords = records.filter((r) => r.task === task)
  if (taskRecords.length === 0) {
    return {
      task,
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      cacheHitCount: 0,
      fallbackCount: 0,
      retryCount: 0,
      deduplicationCount: 0,
      avgLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      avgInputTokens: 0,
      avgOutputTokens: 0,
      successRate: 0,
      cacheHitRate: 0,
      fallbackRate: 0,
    }
  }

  const successCount = taskRecords.filter(
    (r) => r.outcome === "success" || r.outcome === "fallback_success" || r.outcome === "cache_hit"
  ).length
  const failureCount = taskRecords.length - successCount
  const cacheHitCount = taskRecords.filter((r) => r.cacheHit).length
  const fallbackCount = taskRecords.filter((r) => r.fallbackUsed).length
  const retryCount = taskRecords.filter((r) => r.retried).length
  const deduplicationCount = taskRecords.filter((r) => r.deduplicated).length

  const latencies = taskRecords.map((r) => r.latencyMs).sort((a, b) => a - b)
  const avgLatencyMs = Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)
  const p50LatencyMs = percentile(latencies, 50)
  const p95LatencyMs = percentile(latencies, 95)

  const inputTokens = taskRecords
    .filter((r) => r.estimatedInputTokens > 0)
    .map((r) => r.estimatedInputTokens)
  const avgInputTokens =
    inputTokens.length > 0
      ? Math.round(inputTokens.reduce((s, v) => s + v, 0) / inputTokens.length)
      : 0

  const outputTokens = taskRecords
    .filter((r) => r.actualOutputTokens !== undefined)
    .map((r) => r.actualOutputTokens!)
  const avgOutputTokens =
    outputTokens.length > 0
      ? Math.round(outputTokens.reduce((s, v) => s + v, 0) / outputTokens.length)
      : 0

  return {
    task,
    requestCount: taskRecords.length,
    successCount,
    failureCount,
    cacheHitCount,
    fallbackCount,
    retryCount,
    deduplicationCount,
    avgLatencyMs,
    p50LatencyMs,
    p95LatencyMs,
    avgInputTokens,
    avgOutputTokens,
    successRate: Math.round((successCount / taskRecords.length) * 100),
    cacheHitRate: Math.round((cacheHitCount / taskRecords.length) * 100),
    fallbackRate: Math.round((fallbackCount / taskRecords.length) * 100),
  }
}

function computeTelemetrySummary(records: AIRequestTelemetryRecord[]): TelemetrySummary {
  const tasks: AITask[] = ["qa", "actions", "findings", "compare"]
  const byTask: Partial<Record<AITask, TaskMetrics>> = {}
  for (const task of tasks) {
    byTask[task] = computeTaskMetrics(records, task)
  }

  const totalRequests = records.length
  const successCount = records.filter(
    (r) => r.outcome === "success" || r.outcome === "fallback_success" || r.outcome === "cache_hit"
  ).length
  const cacheHitCount = records.filter((r) => r.cacheHit).length
  const fallbackCount = records.filter((r) => r.fallbackUsed).length

  return {
    totalRequests,
    byTask,
    overallSuccessRate: totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 0,
    overallCacheHitRate:
      totalRequests > 0 ? Math.round((cacheHitCount / totalRequests) * 100) : 0,
    overallFallbackRate:
      totalRequests > 0 ? Math.round((fallbackCount / totalRequests) * 100) : 0,
  }
}

// ---------------------------------------------------------------------------
// Safe telemetry log helper
// ---------------------------------------------------------------------------

/**
 * Logs a safe telemetry event to console in structured format.
 * Never includes document content, API keys, or prompts.
 */
export function logTelemetry(record: AIRequestTelemetryRecord): void {
  const {
    requestId,
    task,
    provider,
    primaryModel,
    documentHash,
    estimatedInputTokens,
    maxCompletionTokens,
    latencyMs,
    primaryLatencyMs,
    outcome,
    retried,
    fallbackUsed,
    cacheHit,
    preflightDecision,
    failureCategory,
  } = record

  if (outcome === "success" || outcome === "fallback_success" || outcome === "cache_hit") {
    console.info(
      `[LawLens:AI] ${outcome.toUpperCase()} ` +
        `task=${task} provider=${provider} model=${primaryModel} ` +
        `reqId=${requestId} docHash=${documentHash} ` +
        `inputTokens≈${estimatedInputTokens} maxOutput=${maxCompletionTokens} ` +
        `latencyMs=${latencyMs} primaryMs=${primaryLatencyMs} ` +
        `fallback=${fallbackUsed} retry=${retried} cache=${cacheHit} ` +
        `preflight=${preflightDecision ?? "n/a"}`
    )
  } else {
    console.warn(
      `[LawLens:AI] ${outcome.toUpperCase()} ` +
        `task=${task} provider=${provider} model=${primaryModel} ` +
        `reqId=${requestId} docHash=${documentHash} ` +
        `inputTokens≈${estimatedInputTokens} ` +
        `latencyMs=${latencyMs} ` +
        `failureCategory=${failureCategory ?? "unknown"} ` +
        `fallback=${fallbackUsed} retry=${retried}`
    )
  }
}
