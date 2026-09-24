import type { NormalizedDocument, NormalizedDocumentLine } from "./types.ts"

export interface ParsedClause {
  id: string
  clauseNumber?: string
  title: string
  normalizedTitle: string
  startLine: number
  endLine: number
  text: string
  lines: NormalizedDocumentLine[]
}

export interface AlignedClausePair {
  clauseKey: string
  title: string
  clauseA?: ParsedClause
  clauseB?: ParsedClause
  status: "both_present" | "added_in_b" | "removed_in_b"
}

export interface AlignedComparisonContext {
  docAName: string
  docBName: string
  pairs: AlignedClausePair[]
  formattedContext: string
}

function normalizeTitle(title: string): string {
  return title
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

/**
 * Parses a normalized document into identifiable clauses and sections.
 * Detects numbered clauses (e.g., "1. GRANT OF LEASE", "14. TERMINATION")
 * and standard legal headings (e.g., "RECITALS", "TERMS AND CONDITIONS").
 * Falls back to paragraph grouping if no numbered clauses are found.
 */
export function parseDocumentClauses(doc: NormalizedDocument): ParsedClause[] {
  const clauses: ParsedClause[] = []
  const clauseHeaderRegex = /^\s*(?:(?:SECTION|ARTICLE|CLAUSE)\s+)?(\d{1,2}(?:\.\d{1,2})*)\.?\s+([A-Z][A-Za-z0-9\s,\/&'\(\)-]{3,80})$/
  const majorHeaderRegex = /^\s*([A-Z][A-Z0-9\s,\/&'\(\)-]{3,50}):\s*$/

  let currentClause: Partial<ParsedClause> | null = null
  let currentLines: NormalizedDocumentLine[] = []

  const commitCurrent = () => {
    if (currentClause && currentLines.length > 0) {
      const startLine = currentLines[0].lineNumber
      const endLine = currentLines[currentLines.length - 1].lineNumber
      const text = currentLines.map((l) => l.text).join("\n")

      clauses.push({
        id: currentClause.id || `clause_${clauses.length + 1}`,
        clauseNumber: currentClause.clauseNumber,
        title: currentClause.title || `Section ${clauses.length + 1}`,
        normalizedTitle: currentClause.normalizedTitle || normalizeTitle(currentClause.title || ""),
        startLine,
        endLine,
        text,
        lines: [...currentLines],
      })
    }
    currentClause = null
    currentLines = []
  }

  for (let i = 0; i < doc.lines.length; i++) {
    const line = doc.lines[i]
    const trimmed = line.text.trim()

    // Skip separator lines like ======= or -------
    if (/^[=\-_]{3,}$/.test(trimmed)) {
      if (currentClause) {
        currentLines.push(line)
      }
      continue
    }

    const numMatch = trimmed.match(clauseHeaderRegex)
    const majorMatch = trimmed.match(majorHeaderRegex)

    if (numMatch) {
      commitCurrent()
      const clauseNum = numMatch[1]
      const title = numMatch[2].trim()
      currentClause = {
        id: `clause_${clauseNum}`,
        clauseNumber: clauseNum,
        title: `${clauseNum}. ${title}`,
        normalizedTitle: normalizeTitle(title),
      }
      currentLines.push(line)
    } else if (majorMatch && !trimmed.toLowerCase().includes("http")) {
      commitCurrent()
      const title = majorMatch[1].trim()
      currentClause = {
        id: `header_${title.toLowerCase().replace(/\s+/g, "_")}`,
        title: title,
        normalizedTitle: normalizeTitle(title),
      }
      currentLines.push(line)
    } else if (currentClause) {
      currentLines.push(line)
    } else {
      // Preamble or recitals before first numbered clause
      if (!currentClause) {
        currentClause = {
          id: "preamble",
          title: "Preamble & Parties",
          normalizedTitle: "preamble parties",
        }
      }
      currentLines.push(line)
    }
  }

  commitCurrent()

  // Fallback: If no clauses identified, chunk by 30 lines
  if (clauses.length === 0 && doc.lines.length > 0) {
    const chunkSize = 30
    for (let i = 0; i < doc.lines.length; i += chunkSize) {
      const chunkLines = doc.lines.slice(i, i + chunkSize)
      const startLine = chunkLines[0].lineNumber
      const endLine = chunkLines[chunkLines.length - 1].lineNumber
      clauses.push({
        id: `section_${i / chunkSize + 1}`,
        title: `Document Section (L${startLine}-L${endLine})`,
        normalizedTitle: `section ${i / chunkSize + 1}`,
        startLine,
        endLine,
        text: chunkLines.map((l) => l.text).join("\n"),
        lines: chunkLines,
      })
    }
  }

  return clauses
}

/**
 * Aligns clauses between Document A and Document B.
 * Matches on clause number first, then normalized title similarity.
 */
export function alignClauses(
  clausesA: ParsedClause[],
  clausesB: ParsedClause[]
): AlignedClausePair[] {
  const pairs: AlignedClausePair[] = []
  const matchedB = new Set<string>()

  // Step 1: For each clause in A, find best match in B
  for (const a of clausesA) {
    let matchB: ParsedClause | undefined

    // 1. Exact clause number match (e.g. "3" or "3.1")
    if (a.clauseNumber) {
      matchB = clausesB.find(
        (b) => !matchedB.has(b.id) && b.clauseNumber === a.clauseNumber
      )
    }

    // 2. Normalized title match
    if (!matchB && a.normalizedTitle) {
      matchB = clausesB.find(
        (b) =>
          !matchedB.has(b.id) &&
          (b.normalizedTitle === a.normalizedTitle ||
            (a.normalizedTitle.length > 4 && b.normalizedTitle.includes(a.normalizedTitle)) ||
            (b.normalizedTitle.length > 4 && a.normalizedTitle.includes(b.normalizedTitle)))
      )
    }

    if (matchB) {
      matchedB.add(matchB.id)
      pairs.push({
        clauseKey: a.clauseNumber ? `clause_${a.clauseNumber}` : a.id,
        title: a.title,
        clauseA: a,
        clauseB: matchB,
        status: "both_present",
      })
    } else {
      pairs.push({
        clauseKey: a.clauseNumber ? `clause_${a.clauseNumber}` : a.id,
        title: a.title,
        clauseA: a,
        clauseB: undefined,
        status: "removed_in_b",
      })
    }
  }

  // Step 2: Any clause in B that was not matched with A is marked "added_in_b"
  for (const b of clausesB) {
    if (!matchedB.has(b.id)) {
      pairs.push({
        clauseKey: b.clauseNumber ? `clause_${b.clauseNumber}` : b.id,
        title: b.title,
        clauseA: undefined,
        clauseB: b,
        status: "added_in_b",
      })
    }
  }

  return pairs
}

/**
 * Builds a structured, token-efficient aligned prompt context from two normalized documents.
 */
export function buildAlignedComparisonContext(
  docA: NormalizedDocument,
  docB: NormalizedDocument
): AlignedComparisonContext {
  const clausesA = parseDocumentClauses(docA)
  const clausesB = parseDocumentClauses(docB)
  const pairs = alignClauses(clausesA, clausesB)

  const formattedSections: string[] = []

  for (const pair of pairs) {
    if (pair.status === "both_present" && pair.clauseA && pair.clauseB) {
      const linesA = pair.clauseA.lines
        .map((l) => `[DocA:L${l.lineNumber}] ${l.text}`)
        .join("\n")
      const linesB = pair.clauseB.lines
        .map((l) => `[DocB:L${l.lineNumber}] ${l.text}`)
        .join("\n")

      formattedSections.push(
        `### SECTION: ${pair.title}\n` +
          `--- DOCUMENT A [${docA.name}] (L${pair.clauseA.startLine}-L${pair.clauseA.endLine}) ---\n${linesA}\n\n` +
          `--- DOCUMENT B [${docB.name}] (L${pair.clauseB.startLine}-L${pair.clauseB.endLine}) ---\n${linesB}\n`
      )
    } else if (pair.status === "removed_in_b" && pair.clauseA) {
      const linesA = pair.clauseA.lines
        .map((l) => `[DocA:L${l.lineNumber}] ${l.text}`)
        .join("\n")

      formattedSections.push(
        `### SECTION ONLY IN DOCUMENT A (ABSENT IN DOCUMENT B): ${pair.title}\n` +
          `--- DOCUMENT A [${docA.name}] (L${pair.clauseA.startLine}-L${pair.clauseA.endLine}) ---\n${linesA}\n`
      )
    } else if (pair.status === "added_in_b" && pair.clauseB) {
      const linesB = pair.clauseB.lines
        .map((l) => `[DocB:L${l.lineNumber}] ${l.text}`)
        .join("\n")

      formattedSections.push(
        `### SECTION ONLY IN DOCUMENT B (NEW / ADDED IN B): ${pair.title}\n` +
          `--- DOCUMENT B [${docB.name}] (L${pair.clauseB.startLine}-L${pair.clauseB.endLine}) ---\n${linesB}\n`
      )
    }
  }

  return {
    docAName: docA.name,
    docBName: docB.name,
    pairs,
    formattedContext: formattedSections.join("\n\n"),
  }
}
