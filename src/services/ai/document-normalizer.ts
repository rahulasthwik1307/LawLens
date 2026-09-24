import type { UploadedDocument } from "../../types/document.ts"
import type { NormalizedDocument, NormalizedDocumentLine } from "./types.ts"
import { AIProviderError } from "./types.ts"

/**
 * Normalizes an uploaded document into a structured internal representation
 * with 1-indexed lines and character boundaries for accurate evidence grounding.
 */
export function normalizeDocument(doc: UploadedDocument): NormalizedDocument {
  if (!doc.isTextReadable || !doc.content || !doc.content.trim()) {
    throw new AIProviderError(
      "UNREADABLE_DOCUMENT",
      `Document "${doc.name}" does not contain readable plain text.`,
      "This document format requires server-side extraction before analysis.",
      400,
      false
    )
  }

  const rawLines = doc.content.split(/\r\n|\r|\n/)
  const lines: NormalizedDocumentLine[] = rawLines.map((text, idx) => ({
    lineNumber: idx + 1,
    text,
  }))

  const wordCount = doc.content.trim().split(/\s+/).filter(Boolean).length

  return {
    id: doc.id,
    name: doc.name,
    jurisdiction: doc.jurisdiction || "India",
    sourceText: doc.content,
    lines,
    lineCount: lines.length,
    wordCount,
    metadata: {
      size: doc.size,
      mimeType: doc.type,
      uploadedAt: doc.uploadedAt instanceof Date ? doc.uploadedAt : new Date(doc.uploadedAt),
    },
  }
}

/**
 * Formats a normalized document into a line-annotated text stream.
 * Prefixes each line with [L{number}] to provide unambiguous line grounding
 * for model quote and line identification while isolating content.
 */
export function formatAnnotatedDocumentStream(doc: NormalizedDocument): string {
  return doc.lines
    .map((line) => `[L${line.lineNumber}] ${line.text}`)
    .join("\n")
}
