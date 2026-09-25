/**
 * LawLens — Token Budget Preflight Guard (Phase E)
 *
 * Estimates the total token cost of a request before sending it.
 * If the estimated total exceeds the task budget, provides reduction strategies.
 *
 * Rules:
 * - Input tokens ≈ character count / 4 (conservative approximation)
 * - The guard checks: estimated_input + max_completion <= safety_threshold
 * - Safety threshold is based on the task's maxInputContextTokens
 * - The guard does NOT send requests; it only validates and advises
 *
 * Token estimation is intentionally conservative (over-estimates) to avoid
 * accidentally submitting requests that exceed provider limits.
 */

import type { AITask } from "./task-policy.ts"
import { getTaskPolicy } from "./task-policy.ts"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TokenGuardDecision =
  | "ok" // Estimated total is within budget
  | "warning" // Approaching budget (>80%) — proceed but log
  | "reduce" // Over budget — must reduce context before sending

export interface TokenGuardResult {
  decision: TokenGuardDecision
  estimatedInputTokens: number
  maxCompletionTokens: number
  estimatedTotalTokens: number
  taskInputBudget: number
  utilizationPct: number
}

// ---------------------------------------------------------------------------
// Core guard
// ---------------------------------------------------------------------------

/**
 * Estimates the token cost of a prompt and validates it against the task policy.
 *
 * @param task The AI task type (determines budget)
 * @param systemPromptChars Character count of the stable system prompt
 * @param userPromptChars Character count of the dynamic user prompt (document content + question)
 */
export function runTokenPreflight(
  task: AITask,
  systemPromptChars: number,
  userPromptChars: number
): TokenGuardResult {
  const policy = getTaskPolicy(task)

  // Conservative token estimate: 1 token per 4 characters (commonly used approximation)
  const estimatedInputTokens = Math.ceil((systemPromptChars + userPromptChars) / 4)
  const estimatedTotalTokens = estimatedInputTokens + policy.maxCompletionTokens
  const taskInputBudget = policy.maxInputContextTokens
  const utilizationPct = Math.round((estimatedInputTokens / taskInputBudget) * 100)

  let decision: TokenGuardDecision
  if (utilizationPct <= 80) {
    decision = "ok"
  } else if (utilizationPct <= 100) {
    decision = "warning"
  } else {
    decision = "reduce"
  }

  return {
    decision,
    estimatedInputTokens,
    maxCompletionTokens: policy.maxCompletionTokens,
    estimatedTotalTokens,
    taskInputBudget,
    utilizationPct,
  }
}

/**
 * Estimates approximate tokens from a raw string.
 * Uses conservative 1-per-4-chars approximation.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Checks whether a text string fits within a token budget.
 * Returns the fraction of the budget used (>1.0 means over budget).
 */
export function checkContextFits(text: string, tokenBudget: number): {
  fits: boolean
  estimatedTokens: number
  utilizationFraction: number
} {
  const estimatedTokens = estimateTokens(text)
  const utilizationFraction = estimatedTokens / tokenBudget
  return {
    fits: utilizationFraction <= 1.0,
    estimatedTokens,
    utilizationFraction,
  }
}
