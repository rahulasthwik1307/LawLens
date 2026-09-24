import type {
  ActionEvidenceItem,
  ActionItem,
  ComparisonDifference,
  DifferenceEvidenceItem,
  FindingCategory,
  FindingEvidence,
  LegalFinding,
  NormalizedDocument,
  QAEvidenceItem,
  RawActionItemInput,
  RawDifferenceEvidence,
  RawDifferenceItem,
  RawFindingInput,
  RawQAEvidence,
} from "./types.ts"

/**
 * Normalizes text for robust substring matching by collapsing multiple spaces,
 * standardizing newlines, and normalizing quotation marks.
 */
function normalizeForMatching(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

/**
 * Strips line number prefixes like `[L12]` or `L12:` that models sometimes echo from prompts.
 */
function cleanEvidenceQuote(quote: string): string {
  return quote
    .replace(/\[L\d+\]\s*/g, "")
    .replace(/^L\d+[:.]\s*/gm, "")
    .trim()
}

/**
 * Locates the 1-indexed line range of a matching substring in the normalized document.
 */
export function findLineRangeForMatch(
  document: NormalizedDocument,
  targetQuote: string
): { startLine: number; endLine: number } | null {
  const cleanTarget = normalizeForMatching(cleanEvidenceQuote(targetQuote))
  if (!cleanTarget || cleanTarget.length < 5) return null

  // 1. Fast check: scan line by line
  for (const line of document.lines) {
    const norm = normalizeForMatching(line.text)
    if (norm.includes(cleanTarget)) {
      return { startLine: line.lineNumber, endLine: line.lineNumber }
    }
  }

  // 2. Concatenate lines while recording line boundary offsets
  let combined = ""
  const lineSpans: Array<{ lineNumber: number; start: number; end: number }> = []

  for (const line of document.lines) {
    const normLine = normalizeForMatching(line.text)
    if (!normLine) continue

    const start = combined.length ? combined.length + 1 : 0
    combined = combined ? `${combined} ${normLine}` : normLine
    const end = combined.length
    lineSpans.push({ lineNumber: line.lineNumber, start, end })
  }

  const matchIndex = combined.indexOf(cleanTarget)
  if (matchIndex !== -1 && lineSpans.length > 0) {
    const matchEnd = matchIndex + cleanTarget.length

    let startLine = lineSpans[0].lineNumber
    for (const span of lineSpans) {
      if (span.end > matchIndex) {
        startLine = span.lineNumber
        break
      }
    }

    let endLine = lineSpans[lineSpans.length - 1].lineNumber
    for (const span of lineSpans) {
      if (span.end >= matchEnd) {
        endLine = span.lineNumber
        break
      }
    }

    return {
      startLine,
      endLine: Math.max(startLine, endLine),
    }
  }

  // 3. Fallback: Prefix matching for longer quotes (first 40 characters)
  if (cleanTarget.length > 40) {
    const prefix = cleanTarget.substring(0, 40)
    const prefixIndex = combined.indexOf(prefix)
    if (prefixIndex !== -1 && lineSpans.length > 0) {
      let startLine = lineSpans[0].lineNumber
      for (const span of lineSpans) {
        if (span.end > prefixIndex) {
          startLine = span.lineNumber
          break
        }
      }
      const estimatedLines = Math.max(1, Math.ceil(cleanTarget.length / 80))
      return {
        startLine,
        endLine: Math.min(document.lineCount, startLine + estimatedLines - 1),
      }
    }
  }

  return null
}

/**
 * Verifies a single finding's evidence quote against the source document.
 * Never presents unverified model quotes as grounded citations.
 */
export function verifyFindingEvidence(
  rawFinding: RawFindingInput,
  category: FindingCategory,
  document: NormalizedDocument,
  index: number
): LegalFinding {
  const quote = rawFinding.evidenceQuote ? cleanEvidenceQuote(rawFinding.evidenceQuote) : ""
  let evidence: FindingEvidence | undefined = undefined
  let confidence = rawFinding.confidence as LegalFinding["confidence"]
  let uncertainty = rawFinding.uncertainty

  if (quote) {
    const matchedRange = findLineRangeForMatch(document, quote)

    if (matchedRange) {
      evidence = {
        sourceText: quote,
        startLine: matchedRange.startLine,
        endLine: matchedRange.endLine,
        verificationStatus: "verified",
      }
    } else {
      // Check if model-supplied lines are valid in the document
      const modelStart = rawFinding.startLine
      const modelEnd = rawFinding.endLine
      const linesValid =
        typeof modelStart === "number" &&
        typeof modelEnd === "number" &&
        modelStart >= 1 &&
        modelEnd >= modelStart &&
        modelEnd <= document.lineCount

      if (linesValid) {
        // Extract actual text from document at those lines
        const actualSnippet = document.lines
          .slice(modelStart - 1, modelEnd)
          .map((l) => l.text)
          .join(" ")
          .trim()

        const normActual = normalizeForMatching(actualSnippet)
        const normQuote = normalizeForMatching(quote)
        const hasOverlap =
          normActual.includes(normQuote) ||
          normQuote.includes(normActual) ||
          (normQuote.length > 20 && normActual.includes(normQuote.substring(0, 20)))

        if (hasOverlap && actualSnippet.length > 10) {
          evidence = {
            sourceText: actualSnippet.substring(0, 300),
            startLine: modelStart,
            endLine: modelEnd,
            verificationStatus: "verified",
          }
        } else {
          evidence = {
            sourceText: quote,
            startLine: modelStart,
            endLine: modelEnd,
            verificationStatus: "unverified",
          }
          if (confidence === "clear_in_document") {
            confidence = "needs_review"
          }
          uncertainty = uncertainty
            ? `${uncertainty} (Quote could not be verbatim matched in document)`
            : "Citation quote could not be verbatim verified in source text."
        }
      } else {
        // Quote was not found and lines are invalid
        evidence = {
          sourceText: quote,
          startLine: 1,
          endLine: 1,
          verificationStatus: "unverified",
        }
        if (confidence === "clear_in_document") {
          confidence = "needs_review"
        }
        uncertainty = uncertainty
          ? `${uncertainty} (Quote unverified in source text)`
          : "Quote not found in original document text."
      }
    }
  } else if (
    typeof rawFinding.startLine === "number" &&
    rawFinding.startLine >= 1 &&
    rawFinding.startLine <= document.lineCount
  ) {
    const endLine = Math.min(
      document.lineCount,
      Math.max(rawFinding.startLine, rawFinding.endLine || rawFinding.startLine)
    )
    const snippet = document.lines
      .slice(rawFinding.startLine - 1, endLine)
      .map((l) => l.text)
      .join(" ")
      .trim()

    evidence = {
      sourceText: snippet.substring(0, 300),
      startLine: rawFinding.startLine,
      endLine,
      verificationStatus: "verified",
    }
  }

  return {
    id: `finding_${category}_${index + 1}_${Math.random().toString(36).substring(2, 6)}`,
    category,
    title: rawFinding.title.trim(),
    explanation: rawFinding.explanation.trim(),
    confidence: confidence || "supported_by_source",
    uncertainty: uncertainty ? uncertainty.trim() : undefined,
    evidence,
  }
}

/**
 * Verifies an array of QA evidence items against the source document.
 * Cites exact line ranges and tags verification status accurately.
 */
export function verifyQAEvidence(
  rawEvidence: RawQAEvidence[],
  document: NormalizedDocument
): QAEvidenceItem[] {
  const verifiedItems: QAEvidenceItem[] = []

  for (const raw of rawEvidence) {
    const quote = raw.quote ? cleanEvidenceQuote(raw.quote) : ""
    if (!quote && !raw.startLine) continue

    if (quote) {
      const matched = findLineRangeForMatch(document, quote)
      if (matched) {
        verifiedItems.push({
          sourceText: quote,
          startLine: matched.startLine,
          endLine: matched.endLine,
          verificationStatus: "verified",
        })
        continue
      }

      // Check if model-supplied lines are valid in the document
      const modelStart = raw.startLine
      const modelEnd = raw.endLine || raw.startLine
      const linesValid =
        typeof modelStart === "number" &&
        typeof modelEnd === "number" &&
        modelStart >= 1 &&
        modelEnd >= modelStart &&
        modelEnd <= document.lineCount

      if (linesValid) {
        const actualSnippet = document.lines
          .slice(modelStart - 1, modelEnd)
          .map((l) => l.text)
          .join(" ")
          .trim()

        const normActual = normalizeForMatching(actualSnippet)
        const normQuote = normalizeForMatching(quote)
        const hasOverlap =
          normActual.includes(normQuote) ||
          normQuote.includes(normActual) ||
          (normQuote.length > 20 && normActual.includes(normQuote.substring(0, 20)))

        if (hasOverlap && actualSnippet.length > 10) {
          verifiedItems.push({
            sourceText: actualSnippet.substring(0, 300),
            startLine: modelStart,
            endLine: modelEnd,
            verificationStatus: "verified",
          })
          continue
        }
      }

      // If quote is not found in document, mark as unverified
      verifiedItems.push({
        sourceText: quote,
        startLine:
          typeof raw.startLine === "number" && raw.startLine >= 1
            ? raw.startLine
            : 1,
        endLine:
          typeof raw.endLine === "number" && raw.endLine >= 1
            ? raw.endLine
            : 1,
        verificationStatus: "unverified",
      })
    } else if (
      typeof raw.startLine === "number" &&
      raw.startLine >= 1 &&
      raw.startLine <= document.lineCount
    ) {
      const endLine = Math.min(
        document.lineCount,
        Math.max(raw.startLine, raw.endLine || raw.startLine)
      )
      const snippet = document.lines
        .slice(raw.startLine - 1, endLine)
        .map((l) => l.text)
        .join(" ")
        .trim()

      verifiedItems.push({
        sourceText: snippet.substring(0, 300),
        startLine: raw.startLine,
        endLine,
        verificationStatus: "verified",
      })
    }
  }

  return verifiedItems
}

/**
 * Validates raw difference evidence items for a specific document (A or B).
 */
export function verifyDifferenceEvidenceList(
  rawList: RawDifferenceEvidence[] | undefined,
  doc: NormalizedDocument,
  docDesignation: "A" | "B"
): DifferenceEvidenceItem[] {
  if (!rawList || rawList.length === 0) return []

  const verified: DifferenceEvidenceItem[] = []

  for (const item of rawList) {
    const quote = item.quote ? cleanEvidenceQuote(item.quote) : ""
    if (!quote && !item.startLine) continue

    if (quote) {
      const matched = findLineRangeForMatch(doc, quote)
      if (matched) {
        verified.push({
          documentId: doc.id,
          documentName: doc.name,
          sourceText: quote,
          startLine: matched.startLine,
          endLine: matched.endLine,
          verificationStatus: "verified",
        })
        continue
      }

      // Check model start/end lines
      const modelStart = item.startLine
      const modelEnd = item.endLine || item.startLine
      const linesValid =
        typeof modelStart === "number" &&
        typeof modelEnd === "number" &&
        modelStart >= 1 &&
        modelEnd >= modelStart &&
        modelEnd <= doc.lineCount

      if (linesValid) {
        const actualSnippet = doc.lines
          .slice(modelStart - 1, modelEnd)
          .map((l) => l.text)
          .join(" ")
          .trim()

        const normActual = normalizeForMatching(actualSnippet)
        const normQuote = normalizeForMatching(quote)
        const hasOverlap =
          normActual.includes(normQuote) ||
          normQuote.includes(normActual) ||
          (normQuote.length > 20 && normActual.includes(normQuote.substring(0, 20)))

        if (hasOverlap && actualSnippet.length > 10) {
          verified.push({
            documentId: doc.id,
            documentName: doc.name,
            sourceText: actualSnippet.substring(0, 300),
            startLine: modelStart,
            endLine: modelEnd,
            verificationStatus: "verified",
          })
          continue
        }
      }

      // Quote was not found in document
      verified.push({
        documentId: doc.id,
        documentName: doc.name,
        sourceText: quote,
        startLine:
          typeof item.startLine === "number" && item.startLine >= 1
            ? item.startLine
            : 1,
        endLine:
          typeof item.endLine === "number" && item.endLine >= 1
            ? item.endLine
            : 1,
        verificationStatus: "unverified",
      })
    } else if (
      typeof item.startLine === "number" &&
      item.startLine >= 1 &&
      item.startLine <= doc.lineCount
    ) {
      const endLine = Math.min(
        doc.lineCount,
        Math.max(item.startLine, item.endLine || item.startLine)
      )
      const snippet = doc.lines
        .slice(item.startLine - 1, endLine)
        .map((l) => l.text)
        .join(" ")
        .trim()

      verified.push({
        documentId: doc.id,
        documentName: doc.name,
        sourceText: snippet.substring(0, 300),
        startLine: item.startLine,
        endLine,
        verificationStatus: "verified",
      })
    }
  }

  return verified
}

/**
 * Verifies and constructs a ComparisonDifference with dual-document evidence validation.
 */
export function verifyComparisonDifference(
  rawDiff: RawDifferenceItem,
  docA: NormalizedDocument,
  docB: NormalizedDocument,
  index: number
): ComparisonDifference {
  const evidenceA = verifyDifferenceEvidenceList(rawDiff.evidenceA, docA, "A")
  const evidenceB = verifyDifferenceEvidenceList(rawDiff.evidenceB, docB, "B")

  return {
    id: `diff_${index + 1}`,
    clauseTitle: rawDiff.clauseTitle,
    clauseNumber: rawDiff.clauseNumber || undefined,
    type: rawDiff.type,
    reviewStatus: rawDiff.reviewStatus,
    summary: rawDiff.summary,
    explanation: rawDiff.explanation,
    evidenceA,
    evidenceB,
    riskOrReviewNote: rawDiff.riskOrReviewNote || undefined,
  }
}

/**
 * Verifies a single quote or line range against a normalized document for an action item.
 */
export function verifyActionEvidence(
  rawQuote: string | undefined,
  doc: NormalizedDocument,
  modelStartLine?: number,
  modelEndLine?: number
): ActionEvidenceItem {
  const quote = rawQuote ? cleanEvidenceQuote(rawQuote) : ""

  if (quote) {
    const matched = findLineRangeForMatch(doc, quote)
    if (matched) {
      return {
        documentId: doc.id,
        documentName: doc.name,
        sourceText: quote,
        startLine: matched.startLine,
        endLine: matched.endLine,
        verificationStatus: "verified",
      }
    }

    // Check if model start/end lines are valid in document
    const start = modelStartLine
    const end = modelEndLine || modelStartLine
    const linesValid =
      typeof start === "number" &&
      typeof end === "number" &&
      start >= 1 &&
      end >= start &&
      end <= doc.lineCount

    if (linesValid) {
      const actualSnippet = doc.lines
        .slice(start - 1, end)
        .map((l) => l.text)
        .join(" ")
        .trim()

      const normActual = normalizeForMatching(actualSnippet)
      const normQuote = normalizeForMatching(quote)
      const hasOverlap =
        normActual.includes(normQuote) ||
        normQuote.includes(normActual) ||
        (normQuote.length > 20 && normActual.includes(normQuote.substring(0, 20)))

      if (hasOverlap && actualSnippet.length > 5) {
        return {
          documentId: doc.id,
          documentName: doc.name,
          sourceText: actualSnippet.substring(0, 300),
          startLine: start,
          endLine: end,
          verificationStatus: "verified",
        }
      }

      return {
        documentId: doc.id,
        documentName: doc.name,
        sourceText: quote,
        startLine: start,
        endLine: end,
        verificationStatus: "unverified",
      }
    }

    // Invalid line numbers or out of bounds
    return {
      documentId: doc.id,
      documentName: doc.name,
      sourceText: quote,
      startLine: 1,
      endLine: 1,
      verificationStatus: "unverified",
    }
  }

  // No quote provided, check if valid line range was specified
  if (
    typeof modelStartLine === "number" &&
    modelStartLine >= 1 &&
    modelStartLine <= doc.lineCount
  ) {
    const endLine = Math.min(
      doc.lineCount,
      Math.max(modelStartLine, modelEndLine || modelStartLine)
    )
    const snippet = doc.lines
      .slice(modelStartLine - 1, endLine)
      .map((l) => l.text)
      .join(" ")
      .trim()

    return {
      documentId: doc.id,
      documentName: doc.name,
      sourceText: snippet.substring(0, 300),
      startLine: modelStartLine,
      endLine,
      verificationStatus: "verified",
    }
  }

  return {
    documentId: doc.id,
    documentName: doc.name,
    sourceText: "No source evidence quote provided",
    startLine: 1,
    endLine: 1,
    verificationStatus: "not_found",
  }
}

/**
 * Verifies and constructs an ActionItem from raw synthesized input.
 * Supports dual-document evidence for comparison-aware actions.
 */
export function verifyActionItem(
  rawAction: RawActionItemInput,
  docA: NormalizedDocument,
  docB?: NormalizedDocument,
  index: number = 0
): ActionItem {
  const isDocB = rawAction.documentDesignation === "B" && docB
  const isBoth = rawAction.documentDesignation === "both" && docB
  const primaryDoc = isDocB ? docB : docA

  const evidenceItems: ActionEvidenceItem[] = []

  if (isBoth && docB) {
    const evA = verifyActionEvidence(rawAction.evidenceQuote, docA, rawAction.startLine, rawAction.endLine)
    const evB = verifyActionEvidence(rawAction.evidenceQuote, docB, rawAction.startLine, rawAction.endLine)
    evidenceItems.push(evA, evB)
  } else {
    const ev = verifyActionEvidence(rawAction.evidenceQuote, primaryDoc, rawAction.startLine, rawAction.endLine)
    evidenceItems.push(ev)
  }

  const hasVerified = evidenceItems.some((e) => e.verificationStatus === "verified")
  let whyItMatters = rawAction.whyItMatters.trim()

  if (!hasVerified) {
    whyItMatters = `${whyItMatters} (Notice: The available document evidence was not sufficient to create a verified source-grounded action.)`
  }

  return {
    id: `action_${rawAction.type}_${index + 1}_${Math.random().toString(36).substring(2, 6)}`,
    type: rawAction.type,
    priority: rawAction.priority,
    title: rawAction.title.trim(),
    description: rawAction.description.trim(),
    whyItMatters,
    suggestedStep: rawAction.suggestedStep?.trim() || undefined,
    sourceEvidence: evidenceItems,
    relatedFindingId: rawAction.relatedFindingId,
    relatedDifferenceId: rawAction.relatedDifferenceId,
    status: "open",
    documentDesignation: rawAction.documentDesignation,
  }
}

