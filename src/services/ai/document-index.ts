/**
 * LawLens — Deterministic Document Context Index (Phase B)
 *
 * Builds a structural index of a normalized document without invoking any LLM.
 * Used for:
 *  - Result cache key generation (contentHash)
 *  - Token preflight estimation (charCount, approxTokens)
 *  - Context selection (section/clause boundaries)
 *  - Evidence validation boundary information
 *
 * IMPORTANT: This module never performs legal interpretation.
 * It is structural only.
 */

import type { NormalizedDocument, NormalizedDocumentLine } from "./types.ts"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocumentSection {
  /** Unique deterministic section id within the document */
  id: string
  /** Clause number if detected (e.g. "3", "3.1") */
  clauseNumber?: string
  /** Detected heading/title text */
  title: string
  /** Normalized title for matching */
  normalizedTitle: string
  /** 1-indexed start line (inclusive) */
  startLine: number
  /** 1-indexed end line (inclusive) */
  endLine: number
  /** Approximate character count for this section */
  charCount: number
  /** Approximate token estimate (chars / 4) */
  approxTokens: number
  /** Raw text lines of the section */
  lines: NormalizedDocumentLine[]
}

export interface DocumentContextIndex {
  /** SHA-256 hex hash of the raw document content (deterministic) */
  contentHash: string
  /** Total lines in the document */
  lineCount: number
  /** Total characters */
  charCount: number
  /** Total word count */
  wordCount: number
  /** Estimated total tokens (chars / 4) */
  approxTotalTokens: number
  /** All detected sections / clauses */
  sections: DocumentSection[]
  /** Lookup: lineNumber → section id */
  lineSectionMap: Map<number, string>
  /** Built at timestamp */
  indexedAt: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Simple deterministic hash of a string.
 * Uses the Web Crypto API (available in Node.js 18+ and browser environments).
 * Falls back to a fast djb2 hash if SubtleCrypto is unavailable.
 */
export async function hashContent(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  } catch {
    // Synchronous djb2 fallback
    return djb2Hash(text)
  }
}

/**
 * Synchronous djb2 hash fallback — fast, deterministic, not cryptographic.
 * Only used when SubtleCrypto is unavailable (test environments without HTTPS).
 */
export function djb2Hash(text: string): string {
  let hash = 5381
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i)
    hash = hash >>> 0 // keep 32-bit unsigned
  }
  return hash.toString(16).padStart(8, "0")
}

/**
 * Synchronous djb2 hash — exported for tests and synchronous contexts.
 */
export function hashContentSync(text: string): string {
  return djb2Hash(text)
}

const CLAUSE_HEADER_REGEX =
  /^\s*(?:(?:SECTION|ARTICLE|CLAUSE)\s+)?(\d{1,2}(?:\.\d{1,2})*)\.?\s+([A-Z][A-Za-z0-9\s,\/&'\(\)-]{3,80})$/

const MAJOR_HEADER_REGEX = /^\s*([A-Z][A-Z0-9\s,\/&'\(\)-]{3,50}):\s*$/

function normalizeTitle(title: string): string {
  return title
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

// ---------------------------------------------------------------------------
// Core indexer — synchronous, no LLM
// ---------------------------------------------------------------------------

/**
 * Builds a deterministic structural index of a normalized document.
 * This is the single most important preprocessing step.
 *
 * @param document The normalized document to index.
 * @param contentHash Optional pre-computed hash (pass to avoid double computation).
 */
export function buildDocumentIndex(
  document: NormalizedDocument,
  contentHash?: string
): Omit<DocumentContextIndex, "contentHash"> & { contentHash: string } {
  const sections: DocumentSection[] = []
  const lineSectionMap = new Map<number, string>()

  let currentSection: Partial<DocumentSection> | null = null
  let currentLines: NormalizedDocumentLine[] = []
  let sectionCounter = 0

  const commitSection = () => {
    if (!currentSection || currentLines.length === 0) return

    const startLine = currentLines[0].lineNumber
    const endLine = currentLines[currentLines.length - 1].lineNumber
    const text = currentLines.map((l) => l.text).join("\n")
    const charCount = text.length
    const approxTokens = Math.ceil(charCount / 4)

    const section: DocumentSection = {
      id: currentSection.id || `section_${sectionCounter}`,
      clauseNumber: currentSection.clauseNumber,
      title: currentSection.title || `Section ${sectionCounter}`,
      normalizedTitle: currentSection.normalizedTitle || "",
      startLine,
      endLine,
      charCount,
      approxTokens,
      lines: [...currentLines],
    }

    sections.push(section)
    for (const line of currentLines) {
      lineSectionMap.set(line.lineNumber, section.id)
    }

    currentSection = null
    currentLines = []
  }

  for (const line of document.lines) {
    const trimmed = line.text.trim()

    // Skip separator-only lines
    if (/^[=\-_]{3,}$/.test(trimmed)) {
      if (currentSection) currentLines.push(line)
      continue
    }

    const numMatch = trimmed.match(CLAUSE_HEADER_REGEX)
    const majorMatch = trimmed.match(MAJOR_HEADER_REGEX)

    if (numMatch) {
      commitSection()
      sectionCounter++
      const clauseNum = numMatch[1]
      const title = numMatch[2].trim()
      currentSection = {
        id: `clause_${clauseNum}`,
        clauseNumber: clauseNum,
        title: `${clauseNum}. ${title}`,
        normalizedTitle: normalizeTitle(title),
      }
      currentLines.push(line)
    } else if (majorMatch && !trimmed.toLowerCase().includes("http")) {
      commitSection()
      sectionCounter++
      const title = majorMatch[1].trim()
      currentSection = {
        id: `header_${title.toLowerCase().replace(/\s+/g, "_")}`,
        title,
        normalizedTitle: normalizeTitle(title),
      }
      currentLines.push(line)
    } else if (currentSection) {
      currentLines.push(line)
    } else {
      // Preamble
      if (!currentSection) {
        sectionCounter++
        currentSection = {
          id: "preamble",
          title: "Preamble & Parties",
          normalizedTitle: "preamble parties",
        }
      }
      currentLines.push(line)
    }
  }

  commitSection()

  // Fallback: chunk by 30 lines if no sections detected
  if (sections.length === 0 && document.lines.length > 0) {
    const chunkSize = 30
    for (let i = 0; i < document.lines.length; i += chunkSize) {
      const chunkLines = document.lines.slice(i, i + chunkSize)
      const startLine = chunkLines[0].lineNumber
      const endLine = chunkLines[chunkLines.length - 1].lineNumber
      const text = chunkLines.map((l) => l.text).join("\n")
      const charCount = text.length
      const idx = i / chunkSize + 1
      const section: DocumentSection = {
        id: `section_${idx}`,
        title: `Document Section (L${startLine}-L${endLine})`,
        normalizedTitle: `section ${idx}`,
        startLine,
        endLine,
        charCount,
        approxTokens: Math.ceil(charCount / 4),
        lines: chunkLines,
      }
      sections.push(section)
      for (const l of chunkLines) lineSectionMap.set(l.lineNumber, section.id)
    }
  }

  const totalCharCount = document.sourceText.length
  const approxTotalTokens = Math.ceil(totalCharCount / 4)

  return {
    contentHash: contentHash ?? hashContentSync(document.sourceText),
    lineCount: document.lineCount,
    charCount: totalCharCount,
    wordCount: document.wordCount,
    approxTotalTokens,
    sections,
    lineSectionMap,
    indexedAt: new Date().toISOString(),
  }
}

/**
 * Finds sections most relevant to a set of keywords (for context retrieval).
 * Returns sections ordered by relevance score (descending).
 */
export function findRelevantSections(
  index: Omit<DocumentContextIndex, "contentHash"> & { contentHash: string },
  keywords: string[],
  maxSections: number = 5,
  maxApproxTokens: number = 2000
): DocumentSection[] {
  if (keywords.length === 0) {
    // Return early sections up to budget
    const result: DocumentSection[] = []
    let tokenBudget = maxApproxTokens
    for (const section of index.sections) {
      if (tokenBudget <= 0) break
      result.push(section)
      tokenBudget -= section.approxTokens
    }
    return result
  }

  // Score each section
  const scored = index.sections.map((section) => {
    const lowerText = section.lines
      .map((l) => l.text)
      .join(" ")
      .toLowerCase()
    let score = 0
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase()
      if (section.normalizedTitle.includes(kwLower)) score += 5 // heading match
      const occurrences = (lowerText.match(new RegExp(kwLower, "g")) || []).length
      score += occurrences
    }
    return { section, score }
  })

  // Sort by score descending, then take top N within token budget
  scored.sort((a, b) => b.score - a.score)

  const result: DocumentSection[] = []
  let tokenBudget = maxApproxTokens
  let count = 0

  for (const { section, score } of scored) {
    if (count >= maxSections) break
    if (score === 0 && result.length > 0) break // don't add zero-score sections after hits
    if (tokenBudget <= 0) break
    result.push(section)
    tokenBudget -= section.approxTokens
    count++
  }

  // Sort result back into document order
  result.sort((a, b) => a.startLine - b.startLine)
  return result
}
