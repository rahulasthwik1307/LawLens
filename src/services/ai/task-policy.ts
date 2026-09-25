/**
 * LawLens — Task-Specific Model Routing Policy (Phase D)
 *
 * SINGLE SOURCE OF TRUTH for all AI task routing decisions.
 * No component, API route, or provider may scatter model names or
 * token budgets. All policy is defined here.
 *
 * Priority order per task:
 * Q&A:        20B primary (small output, targeted context)
 * Actions:    20B primary (deterministic candidates, medium output)
 * Findings:   120B primary (broader analysis, medium output)
 * Compare:    120B primary (dual evidence, larger output)
 *
 * Retry policy:
 * - Recoverable errors (429, 502, 503, 504, network): ONE controlled retry
 *   using exponential backoff with jitter, then fallback.
 * - Non-recoverable (400, 401, 403, 413, schema): no retry, no fallback.
 *
 * Timeout:
 * - Q&A / Actions: 20s (simpler task, smaller models)
 * - Findings:      30s (broader analysis, larger model)
 * - Compare:       35s (dual document, largest output)
 *
 * Token budgets are derived from the actual JSON schema structure.
 * These are MAXIMUM completion tokens, not expected usage.
 */

// ---------------------------------------------------------------------------
// Task types
// ---------------------------------------------------------------------------

export type AITask = "qa" | "actions" | "findings" | "compare"

// ---------------------------------------------------------------------------
// Task policy
// ---------------------------------------------------------------------------

export interface TaskPolicy {
  /** Primary model identifier */
  primaryModel: string
  /** Fallback model identifier (used after primary + retry fail on recoverable error) */
  fallbackModel: string
  /** Maximum completion tokens for this task */
  maxCompletionTokens: number
  /** Request timeout in milliseconds */
  timeoutMs: number
  /** Maximum number of retries on recoverable failure (before fallback) */
  maxRetries: number
  /** Base delay (ms) for first retry — exponential backoff doubles this */
  retryBaseDelayMs: number
  /**
   * Maximum input context (approx tokens) to send for this task.
   * Requests that exceed this should be reduced/chunked before calling.
   */
  maxInputContextTokens: number
  /**
   * Whether result caching is enabled for this task.
   * All tasks use caching. Can be overridden for debugging.
   */
  cachingEnabled: boolean
}

const PRIMARY_MODEL = process.env.GROQ_PRIMARY_MODEL ?? "openai/gpt-oss-120b"
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL ?? "openai/gpt-oss-20b"
const SMALL_MODEL = process.env.GROQ_SMALL_MODEL ?? "openai/gpt-oss-20b"

/**
 * Centralized task policy table.
 * All model names, budgets, timeouts, and retry configs live here.
 */
const TASK_POLICIES: Record<AITask, TaskPolicy> = {
  qa: {
    primaryModel: SMALL_MODEL,
    // Differentiated fallback: If 20B is rate-limited or fails, fall back to 120B!
    fallbackModel: PRIMARY_MODEL,
    maxCompletionTokens: 800, // QA answer + evidence, bounded
    timeoutMs: 22000,
    maxRetries: 1,
    retryBaseDelayMs: 1000,
    maxInputContextTokens: 3000, // Targeted context window
    cachingEnabled: true,
  },
  actions: {
    primaryModel: SMALL_MODEL,
    fallbackModel: PRIMARY_MODEL,
    maxCompletionTokens: 2000, // Action list, bounded
    timeoutMs: 22000,
    maxRetries: 1,
    retryBaseDelayMs: 1000,
    maxInputContextTokens: 6000, // Candidate XML + necessary context
    cachingEnabled: true,
  },
  findings: {
    primaryModel: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
    // Baseline budget for complex documents. Small/medium documents use adaptive budgeting.
    maxCompletionTokens: 8000,
    timeoutMs: 35000,
    maxRetries: 1,
    retryBaseDelayMs: 1500,
    maxInputContextTokens: 12000, // Full or bounded document
    cachingEnabled: true,
  },
  compare: {
    primaryModel: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
    maxCompletionTokens: 4000,
    timeoutMs: 40000,
    maxRetries: 1,
    retryBaseDelayMs: 2000,
    maxInputContextTokens: 14000, // Two documents, clause-aligned
    cachingEnabled: true,
  },
}

/**
 * Document complexity metrics used for safe adaptive output budgeting.
 */
export interface DocumentComplexityMetrics {
  lineCount?: number
  wordCount?: number
  estimatedInputTokens?: number
}

/**
 * Calculates a predictable, safe adaptive output token budget.
 *
 * Prevents over-requesting tokens against Groq's Tokens Per Minute (TPM) quota
 * on small/medium documents, while guaranteeing sufficient tokens + safety margin
 * for larger documents.
 *
 * Measured output distributions:
 * - Small (<40 lines, <500 words): ~1,400–3,200 output tokens. Budget: 4,500
 * - Medium (40–150 lines, 500–2,000 words): ~3,500–4,800 output tokens. Budget: 6,500
 * - Large (>150 lines, >2,000 words): up to ~6,000+ output tokens. Budget: 8,000
 */
export function calculateAdaptiveOutputBudget(
  task: AITask,
  metrics?: DocumentComplexityMetrics
): number {
  const policy = getTaskPolicy(task)

  if (task !== "findings") {
    return policy.maxCompletionTokens
  }

  if (!metrics) {
    return policy.maxCompletionTokens // Default 8000
  }

  const lines = metrics.lineCount ?? 0
  const words = metrics.wordCount ?? 0
  const inputTokens = metrics.estimatedInputTokens ?? 0

  // If no metrics available, default to safe 8000 baseline
  if (!lines && !words && !inputTokens) {
    return policy.maxCompletionTokens
  }

  // Complex / large legal document (>150 lines, >2000 words, or >4500 input tokens)
  if (lines > 150 || words > 2000 || inputTokens > 4500) {
    return 8000
  }

  // Medium complexity (40–150 lines, 500–2000 words, or 1500–4500 input tokens)
  if (lines >= 40 || words >= 500 || inputTokens >= 1500) {
    return 6500
  }

  // Low complexity: short/template agreements (<40 lines and <500 words)
  return 4500
}

/**
 * Safely escalates the completion budget by +2,500 tokens (up to max ceiling of 10,000)
 * when a TOKEN_LIMIT_EXCEEDED 400 is detected on Groq.
 */
export function escalateCompletionBudget(currentBudget: number, task: AITask): number {
  if (task === "qa") return Math.min(1500, currentBudget + 500)
  if (task === "actions") return Math.min(3500, currentBudget + 1000)
  if (task === "compare") return Math.min(6000, currentBudget + 2000)
  return Math.min(10000, currentBudget + 2500)
}

/**
 * Returns the task policy for a given AI task.
 * This is the ONLY place in the codebase that should resolve model names.
 */
export function getTaskPolicy(task: AITask): TaskPolicy {
  return TASK_POLICIES[task]
}

// ---------------------------------------------------------------------------
// Error classification (determines retry and fallback eligibility)
// ---------------------------------------------------------------------------

/**
 * HTTP status codes that indicate a transient, recoverable failure.
 * These may be retried with backoff, then fallen back to secondary model.
 */
const RECOVERABLE_STATUS_CODES = new Set([429, 502, 503, 504])

/**
 * HTTP status codes that indicate a PERMANENT, non-recoverable failure.
 * These must NOT be retried (retrying will produce identical failures).
 *
 * NOTE on 400: Groq returns 400 for two distinct reasons:
 *  1. Invalid request parameters (e.g., malformed schema) → non-recoverable
 *  2. Output token truncation (max_completion_tokens too small) → recoverable!
 *
 * Sub-case 2 is identified by the error message containing "max completion tokens".
 * The classifyStatusCode function handles this at the HTTP level; the provider
 * layer (parseGroqHttpResponse) uses classifyGroq400Detail to distinguish sub-cases
 * and sets the AIProviderError.retryable flag accordingly.
 */
const NON_RECOVERABLE_STATUS_CODES = new Set([401, 403, 413, 422])

export type ErrorRecoverability =
  | "recoverable" // Retry + fallback eligible
  | "non_recoverable" // No retry, no fallback
  | "timeout" // Special case: retry once with same model, then fallback

/**
 * Classifies an HTTP status code into a recoverability category.
 * Used by the retry/fallback engine.
 *
 * 400 is treated as "non_recoverable" by default — the provider layer
 * overrides this for TOKEN_LIMIT_EXCEEDED sub-cases by setting retryable=true.
 */
export function classifyStatusCode(statusCode: number): ErrorRecoverability {
  if (NON_RECOVERABLE_STATUS_CODES.has(statusCode)) return "non_recoverable"
  if (statusCode === 400) return "non_recoverable" // Provider may override via AIProviderError.retryable
  if (statusCode === 504) return "timeout"
  if (RECOVERABLE_STATUS_CODES.has(statusCode)) return "recoverable"
  if (statusCode >= 500) return "recoverable"
  return "non_recoverable"
}

/**
 * Calculates retry delay using exponential backoff with ±15% jitter.
 */
export function calcRetryDelayMs(
  attempt: number,
  baseDelayMs: number
): number {
  const exponential = baseDelayMs * Math.pow(2, attempt)
  const jitter = exponential * 0.15 * (Math.random() * 2 - 1)
  return Math.max(200, Math.round(exponential + jitter))
}

// ---------------------------------------------------------------------------
// Version stamp for cache invalidation
// ---------------------------------------------------------------------------

/**
 * Increment when schemas, prompt structure, or operation semantics change.
 * This ensures cached results are invalidated when the pipeline changes.
 *
 * Format: "YYYYMMDD-vN" where N is the version for that day.
 */
export const PIPELINE_VERSION = "20260925-v3"
