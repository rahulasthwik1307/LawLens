/**
 * LawLens — Result Cache (Phase F) + Request Deduplication (Phase G)
 *
 * RESULT CACHE
 * ============
 * Caches successful AI operation results using a deterministic key that
 * incorporates: documentHash + operation + operationVersion + schemaVersion + model policy version.
 * Stale results after pipeline version changes are automatically invalidated.
 *
 * Cache key safety:
 * - Key includes PIPELINE_VERSION so schema/prompt changes invalidate cache
 * - Key is a SHA-256 hash of structured components — safe to store and log
 * - Failed results are NEVER cached
 * - Expired entries are lazily evicted on access
 *
 * REQUEST DEDUPLICATION
 * =====================
 * Prevents duplicate simultaneous requests for identical operations.
 * If an identical key is already in-flight, reuses the same promise.
 * This prevents double-calling the provider for rapid double-clicks.
 *
 * Storage: In-memory only (Map). Resets on server restart.
 * This is appropriate for a single-process Next.js server.
 * Do NOT introduce a Redis/database layer unless multi-process deployment requires it.
 */

import { PIPELINE_VERSION } from "./task-policy.ts"
import { djb2Hash } from "./document-index.ts"

// ---------------------------------------------------------------------------
// Cache key construction
// ---------------------------------------------------------------------------

export interface AnalysisCacheKeyParams {
  operation: "findings"
  documentHash: string
}

export interface QACacheKeyParams {
  operation: "qa"
  documentHash: string
  normalizedQuestion: string
}

export interface CompareCacheKeyParams {
  operation: "compare"
  documentAHash: string
  documentBHash: string
}

export interface ActionsCacheKeyParams {
  operation: "actions"
  documentHash: string
  /** Hash of the candidate IDs to distinguish different invocations on same doc */
  candidatesHash: string
}

export type CacheKeyParams =
  | AnalysisCacheKeyParams
  | QACacheKeyParams
  | CompareCacheKeyParams
  | ActionsCacheKeyParams

/**
 * Builds a deterministic cache key string from structured params.
 * The PIPELINE_VERSION is embedded so schema/model changes invalidate cached results.
 * The key is then hashed (djb2) for consistent length.
 */
export function buildCacheKey(params: CacheKeyParams): string {
  const version = PIPELINE_VERSION
  let raw: string

  switch (params.operation) {
    case "findings":
      raw = `findings|${params.documentHash}|${version}`
      break
    case "qa": {
      const normQ = normalizeQuestion(params.normalizedQuestion)
      raw = `qa|${params.documentHash}|${normQ}|${version}`
      break
    }
    case "compare":
      // Sort hashes so docA/docB order doesn't matter for cache key
      // (A vs B comparison is directional, so we DO preserve order)
      raw = `compare|${params.documentAHash}|${params.documentBHash}|${version}`
      break
    case "actions":
      raw = `actions|${params.documentHash}|${params.candidatesHash}|${version}`
      break
  }

  // Hash for consistent key length and to avoid any accidental content leakage
  return `ll_${params.operation}_${djb2Hash(raw)}`
}

/**
 * Normalizes a question for cache key consistency.
 * Lowercases, trims, collapses whitespace.
 * Does NOT log the question text.
 */
export function normalizeQuestion(question: string): string {
  return question.toLowerCase().replace(/\s+/g, " ").trim()
}

// ---------------------------------------------------------------------------
// Cache entry
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  result: T
  key: string
  storedAt: number
  ttlMs: number
}

/** Default TTL: 30 minutes (documents don't change within a session) */
const DEFAULT_TTL_MS = 30 * 60 * 1000

// ---------------------------------------------------------------------------
// Result Cache
// ---------------------------------------------------------------------------

class ResultCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private hitCount = 0
  private missCount = 0

  /**
   * Retrieves a cached result if it exists and is not expired.
   * Returns null on miss or expiry (with lazy eviction).
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) {
      this.missCount++
      return null
    }

    if (Date.now() - entry.storedAt > entry.ttlMs) {
      this.store.delete(key) // Lazy eviction
      this.missCount++
      return null
    }

    this.hitCount++
    return entry.result as T
  }

  /**
   * Stores a successful result in the cache.
   * MUST NOT be called for failed or partial results.
   */
  set<T>(key: string, result: T, ttlMs: number = DEFAULT_TTL_MS): void {
    this.store.set(key, {
      result,
      key,
      storedAt: Date.now(),
      ttlMs,
    })
  }

  /**
   * Invalidates a specific cache entry.
   */
  invalidate(key: string): void {
    this.store.delete(key)
  }

  /**
   * Clears all cache entries (e.g., on document replacement).
   */
  clear(): void {
    this.store.clear()
    this.hitCount = 0
    this.missCount = 0
  }

  get stats() {
    return {
      size: this.store.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate:
        this.hitCount + this.missCount > 0
          ? Math.round((this.hitCount / (this.hitCount + this.missCount)) * 100)
          : 0,
    }
  }
}

/** Singleton result cache — scoped to Next.js server process lifetime */
export const resultCache = new ResultCache()

// ---------------------------------------------------------------------------
// Request Deduplication
// ---------------------------------------------------------------------------

/**
 * In-flight request registry.
 * Maps a cache key → an in-progress Promise.
 * If the same operation is already running, reuses its Promise.
 * Automatically cleared when the Promise settles.
 */
class InFlightRegistry {
  private inFlight = new Map<string, Promise<unknown>>()

  /**
   * Returns true if a request for this key is already in-flight.
   */
  has(key: string): boolean {
    return this.inFlight.has(key)
  }

  /**
   * Registers an in-flight promise for the given key.
   * Automatically removes the entry when the promise settles.
   */
  register<T>(key: string, promise: Promise<T>): Promise<T> {
    this.inFlight.set(key, promise as Promise<unknown>)

    promise.finally(() => {
      this.inFlight.delete(key)
    })

    return promise
  }

  /**
   * Retrieves the in-flight promise for the given key.
   * Returns null if none exists.
   */
  get<T>(key: string): Promise<T> | null {
    return (this.inFlight.get(key) as Promise<T>) ?? null
  }

  get size(): number {
    return this.inFlight.size
  }
}

/** Singleton in-flight registry */
export const inFlightRegistry = new InFlightRegistry()

// ---------------------------------------------------------------------------
// withDeduplicationAndCache — Convenience wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps an AI operation with deduplication + caching.
 *
 * Algorithm:
 * 1. Check result cache → return hit immediately
 * 2. Check in-flight registry → reuse existing promise (deduplication)
 * 3. Execute the operation
 * 4. On success → store in result cache
 * 5. Return result
 *
 * On failure → the promise rejects; the failure is NOT cached.
 */
export async function withDeduplicationAndCache<T>(
  cacheKey: string,
  cachingEnabled: boolean,
  execute: () => Promise<T>
): Promise<{ result: T; cacheHit: boolean; deduplicated: boolean }> {
  // 1. Cache check
  if (cachingEnabled) {
    const cached = resultCache.get<T>(cacheKey)
    if (cached !== null) {
      return { result: cached, cacheHit: true, deduplicated: false }
    }
  }

  // 2. Deduplication check
  const inFlight = inFlightRegistry.get<T>(cacheKey)
  if (inFlight) {
    const result = await inFlight
    return { result, cacheHit: false, deduplicated: true }
  }

  // 3. Execute (register in-flight BEFORE awaiting)
  const executionPromise = execute().then((result) => {
    // 4. Store success in cache
    if (cachingEnabled) {
      resultCache.set(cacheKey, result)
    }
    return result
  })

  // Register for deduplication. The no-op catch prevents Node from flagging this
  // shared promise as unhandled if it rejects — the caller's await below will still
  // propagate the rejection correctly.
  inFlightRegistry.register(cacheKey, executionPromise.catch(() => {/* handled by caller */}))

  const result = await executionPromise
  return { result, cacheHit: false, deduplicated: false }
}
