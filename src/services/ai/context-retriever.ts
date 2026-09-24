import type { NormalizedDocument, NormalizedDocumentLine } from "./types.ts"

const COMMON_STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
  "but", "by", "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does",
  "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had",
  "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "her", "here", "hers", "herself",
  "him", "himself", "his", "how", "i", "if", "in", "into", "is", "isn't", "it", "it's", "its",
  "itself", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off",
  "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "shan't", "she", "should", "shouldn't", "so", "some", "such", "than", "that", "the",
  "their", "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those",
  "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "were", "weren't",
  "what", "when", "where", "which", "while", "who", "whom", "why", "with", "won't", "would",
  "wouldn't", "you", "your", "yours", "yourself", "yourselves",
])

// Legal synonym expansion mappings to improve recall for common legal queries
const LEGAL_SYNONYMS: Record<string, string[]> = {
  payment: ["rent", "rental", "fee", "deposit", "inr", "rupees", "payable", "escalation", "amount"],
  pay: ["rent", "rental", "deposit", "amount", "payable", "advance", "due"],
  rent: ["lease", "monthly", "rental", "escalation", "inr", "rupees"],
  deposit: ["security", "refundable", "interest-free", "deduction", "refund"],
  terminate: ["termination", "expiry", "notice", "cancel", "vacate", "determine"],
  termination: ["terminate", "expiry", "notice", "clause", "vacate"],
  notice: ["written", "days", "prior", "intimation"],
  maintenance: ["repair", "wear", "tear", "damage", "clean", "utilities"],
  repair: ["maintenance", "damages", "fair", "wear", "tear"],
  dispute: ["arbitration", "jurisdiction", "court", "governing", "law", "settlement"],
  parties: ["lessor", "lessee", "employer", "employee", "company", "party", "between"],
  who: ["lessor", "lessee", "employer", "employee", "company", "party"],
  duration: ["term", "commencing", "expiring", "period", "years", "months"],
  term: ["commencing", "expiring", "period", "duration", "years"],
  restrictions: ["prohibited", "shall not", "restricted", "sublet", "assign"],
}

export interface TargetedContextResult {
  lines: NormalizedDocumentLine[]
  retrievalMethod: "targeted_window" | "bounded_fallback"
  matchedLineCount: number
  totalDocumentLines: number
  formattedStream: string
}

/**
 * Extracts normalized query tokens and expansions from the user's question.
 */
export function extractQueryTokens(question: string): string[] {
  const words = question
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !COMMON_STOPWORDS.has(w))

  const tokenSet = new Set<string>(words)

  for (const word of words) {
    const synonyms = LEGAL_SYNONYMS[word]
    if (synonyms) {
      for (const syn of synonyms) {
        tokenSet.add(syn)
      }
    }
  }

  return Array.from(tokenSet)
}

/**
 * Retrieves targeted context lines around the most relevant parts of the document
 * for a specific user question, preserving exact 1-indexed original line numbers.
 *
 * Falls back safely to bounded document context if the document is short or
 * if no targeted matches meet the relevance threshold.
 */
export function retrieveTargetedContext(
  document: NormalizedDocument,
  question: string,
  options?: {
    windowPadding?: number
    maxLines?: number
    fallbackThreshold?: number
  }
): TargetedContextResult {
  const windowPadding = options?.windowPadding ?? 2
  const maxLines = options?.maxLines ?? 60
  const fallbackThreshold = options?.fallbackThreshold ?? 70

  const totalLines = document.lines.length

  // If document is small enough, the entire document fits comfortably within token bounds
  if (totalLines <= fallbackThreshold) {
    const formatted = document.lines
      .map((line) => `[L${line.lineNumber}] ${line.text}`)
      .join("\n")

    return {
      lines: document.lines,
      retrievalMethod: "bounded_fallback",
      matchedLineCount: totalLines,
      totalDocumentLines: totalLines,
      formattedStream: formatted,
    }
  }

  const queryTokens = extractQueryTokens(question)

  if (queryTokens.length === 0) {
    const sliced = document.lines.slice(0, maxLines)
    const formatted = sliced
      .map((line) => `[L${line.lineNumber}] ${line.text}`)
      .join("\n")

    return {
      lines: sliced,
      retrievalMethod: "bounded_fallback",
      matchedLineCount: sliced.length,
      totalDocumentLines: totalLines,
      formattedStream: formatted,
    }
  }

  // Score each line
  const scoredLines: Array<{ lineNumber: number; score: number }> = []

  for (const line of document.lines) {
    const lowerLine = line.text.toLowerCase()
    let lineScore = 0

    for (const token of queryTokens) {
      if (lowerLine.includes(token)) {
        // Boost scores if token matches a heading or clause start
        const isHeading = /^\s*(\d+\.|\bclause\b|\barticle\b|[A-Z\s]{4,}:)/i.test(line.text)
        lineScore += isHeading ? 3 : 1
      }
    }

    if (lineScore > 0) {
      scoredLines.push({ lineNumber: line.lineNumber, score: lineScore })
    }
  }

  // If no lines matched keywords, return the opening portion bounded
  if (scoredLines.length === 0) {
    const sliced = document.lines.slice(0, maxLines)
    const formatted = sliced
      .map((line) => `[L${line.lineNumber}] ${line.text}`)
      .join("\n")

    return {
      lines: sliced,
      retrievalMethod: "bounded_fallback",
      matchedLineCount: 0,
      totalDocumentLines: totalLines,
      formattedStream: formatted,
    }
  }

  // Sort descending by score
  scoredLines.sort((a, b) => b.score - a.score)

  // Pick top focal line centers
  const focalLines = scoredLines.slice(0, 5).map((sl) => sl.lineNumber)

  // Build windows around focal lines
  const selectedLineNumbers = new Set<number>()

  for (const focal of focalLines) {
    const start = Math.max(1, focal - windowPadding)
    const end = Math.min(totalLines, focal + windowPadding)
    for (let l = start; l <= end; l++) {
      selectedLineNumbers.add(l)
    }
  }

  // If total selected lines exceeds maxLines, prune lowest-score extremities
  const sortedLineNumbers = Array.from(selectedLineNumbers).sort((a, b) => a - b)
  const finalLineNumbers = sortedLineNumbers.slice(0, maxLines)

  const selectedLineSet = new Set(finalLineNumbers)
  const targetedLines = document.lines.filter((line) =>
    selectedLineSet.has(line.lineNumber)
  )

  const formattedStream = targetedLines
    .map((line) => `[L${line.lineNumber}] ${line.text}`)
    .join("\n")

  return {
    lines: targetedLines,
    retrievalMethod: "targeted_window",
    matchedLineCount: focalLines.length,
    totalDocumentLines: totalLines,
    formattedStream,
  }
}
