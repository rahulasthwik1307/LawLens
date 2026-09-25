/**
 * LawLens — Text Normalization Utility
 *
 * Provides deterministic text normalization for line indexing,
 * character sanitization, and evidence grounding across both client
 * validation and server document extraction.
 */

/**
 * Normalizes extracted text for deterministic line indexing and evidence grounding.
 * 1. Standardizes CRLF and CR to LF.
 * 2. Strips null bytes and control characters (preserving tab and newline).
 * 3. Trims trailing whitespace per line.
 * 4. Collapses excessive consecutive blank lines (maximum 2 consecutive empty lines).
 */
export function normalizeExtractedText(rawText: string): string {
  if (!rawText) return ""

  // 1. Standardize newline characters
  let text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  // 2. Strip null bytes and non-printable control characters (keep \t=0x09, \n=0x0A)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")

  // 3. Trim trailing whitespace per line
  const lines = text.split("\n").map((line) => line.trimEnd())

  // 4. Collapse excessive consecutive blank lines
  const normalizedLines: string[] = []
  let consecutiveBlank = 0

  for (const line of lines) {
    if (line.trim() === "") {
      consecutiveBlank++
      if (consecutiveBlank <= 2) {
        normalizedLines.push("")
      }
    } else {
      consecutiveBlank = 0
      normalizedLines.push(line)
    }
  }

  return normalizedLines.join("\n").trim()
}
