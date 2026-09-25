/**
 * LawLens Document Extraction Service
 *
 * Provides secure, server-side text extraction and normalization for all
 * supported file formats (.txt, .md, .pdf, .docx).
 *
 * Security Principles:
 * - Uploaded documents are treated strictly as untrusted data.
 * - Text extraction is passive; embedded macros, scripts, and canvas execution are disabled.
 * - Control characters and null bytes are sanitized.
 * - Deterministic 1-indexed line generation is preserved for evidence grounding.
 * - Scanned/image-only PDFs lacking extractable text are explicitly detected as OCR_REQUIRED.
 */

export interface DocumentExtractionResult {
  content: string
  lineCount: number
  wordCount: number
  isTextReadable: boolean
  pageCount?: number
  metadata?: {
    format: string
    pageCount?: number
  }
}

export type ExtractionErrorCode =
  | "UNSUPPORTED_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "OCR_REQUIRED"
  | "EMPTY_TEXT"
  | "EXTRACTION_FAILED"
  | "CORRUPTED_FILE"

export class DocumentExtractionError extends Error {
  code: ExtractionErrorCode
  title: string
  suggestion: string
  statusCode: number

  constructor(params: {
    code: ExtractionErrorCode
    title: string
    message: string
    suggestion: string
    statusCode?: number
  }) {
    super(params.message)
    this.name = "DocumentExtractionError"
    this.code = params.code
    this.title = params.title
    this.suggestion = params.suggestion
    this.statusCode = params.statusCode || 400
  }
}

import { normalizeExtractedText } from "../../lib/text-normalization.ts"

export { normalizeExtractedText }


/**
 * Checks whether text contains meaningful readable characters (alphanumeric).
 */
function hasMeaningfulText(text: string): boolean {
  if (!text || !text.trim()) return false
  const matches = text.match(/[\p{L}\p{N}]/gu)
  return !!matches && matches.length >= 3
}

/**
 * Extracts plain text from a supported file buffer.
 *
 * @param buffer Raw file bytes (Buffer or Uint8Array)
 * @param extension Lowercase extension with leading dot (.txt, .md, .pdf, .docx)
 * @param filename Original filename for reporting
 */
export async function extractDocumentText(
  buffer: Buffer | Uint8Array,
  extension: string,
  filename: string = "document"
): Promise<DocumentExtractionResult> {
  const ext = extension.toLowerCase().startsWith(".")
    ? extension.toLowerCase()
    : `.${extension.toLowerCase()}`

  if (buffer.length === 0) {
    throw new DocumentExtractionError({
      code: "EMPTY_FILE",
      title: "Empty File Detected",
      message: `The file "${filename}" contains 0 bytes.`,
      suggestion: "Please upload a valid document containing legal terms or agreement clauses.",
      statusCode: 400,
    })
  }

  switch (ext) {
    case ".txt":
    case ".md": {
      const nodeBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
      const rawText = nodeBuf.toString("utf-8")
      const normalized = normalizeExtractedText(rawText)

      if (!hasMeaningfulText(normalized)) {
        throw new DocumentExtractionError({
          code: "EMPTY_TEXT",
          title: "Empty Document Content",
          message: `The text file "${filename}" contains no readable words or clauses.`,
          suggestion: "Please select a document with readable contractual text.",
          statusCode: 422,
        })
      }

      const lines = normalized.split("\n")
      const wordCount = normalized.split(/\s+/).filter(Boolean).length

      return {
        content: normalized,
        lineCount: lines.length,
        wordCount,
        isTextReadable: true,
        metadata: {
          format: ext === ".md" ? "Markdown" : "Plain Text",
        },
      }
    }

    case ".pdf": {
      try {
        const { extractText } = await import("unpdf")
        // Create a standalone Uint8Array (isolated ArrayBuffer) to satisfy unpdf
        // and avoid underlying ArrayBuffer detachment if reused.
        const uint8 = new Uint8Array(buffer)

        const pdfResult = await extractText(uint8)

        const pageTexts = Array.isArray(pdfResult.text)
          ? pdfResult.text
          : [pdfResult.text]

        const combinedText = pageTexts.filter(Boolean).join("\n\n")
        const normalized = normalizeExtractedText(combinedText)

        // Scanned PDF detection: if no alphanumeric characters could be extracted,
        // it indicates an image-based scanned PDF requiring OCR.
        if (!hasMeaningfulText(normalized)) {
          throw new DocumentExtractionError({
            code: "OCR_REQUIRED",
            title: "Scanned PDF (OCR Required)",
            message:
              "This PDF appears to be a scanned image or contains non-extractable raster text without embedded character streams.",
            suggestion:
              "LawLens currently analyzes digital, text-based documents. Please upload a searchable PDF or a plain text (.TXT) version.",
            statusCode: 422,
          })
        }

        const lines = normalized.split("\n")
        const wordCount = normalized.split(/\s+/).filter(Boolean).length
        const totalPages = pdfResult.totalPages || pageTexts.length

        return {
          content: normalized,
          lineCount: lines.length,
          wordCount,
          isTextReadable: true,
          pageCount: totalPages,
          metadata: {
            format: "PDF",
            pageCount: totalPages,
          },
        }
      } catch (err: unknown) {
        if (
          err instanceof DocumentExtractionError ||
          (err && typeof err === "object" && (err as { name?: string }).name === "DocumentExtractionError")
        ) {
          throw err
        }

        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes("password") || msg.includes("encrypted")) {
          throw new DocumentExtractionError({
            code: "EXTRACTION_FAILED",
            title: "Encrypted PDF",
            message: "The uploaded PDF is password-protected or encrypted.",
            suggestion: "Please remove password protection and re-upload the document.",
            statusCode: 422,
          })
        }

        throw new DocumentExtractionError({
          code: "EXTRACTION_FAILED",
          title: "PDF Extraction Error",
          message: `Unable to extract readable text from PDF: ${filename}.`,
          suggestion: "Ensure the PDF is valid, not corrupt, and contains selectable text.",
          statusCode: 422,
        })
      }
    }

    case ".docx": {
      try {
        const nodeBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)

        // Check if file starts with standard ZIP magic number PK\x03\x04
        // Legacy .doc files start with \xD0\xCF\x11\xE0 (Compound File Binary)
        if (nodeBuf.length >= 4) {
          const isZip =
            nodeBuf[0] === 0x50 &&
            nodeBuf[1] === 0x4b &&
            nodeBuf[2] === 0x03 &&
            nodeBuf[3] === 0x04

          const isLegacyDoc =
            nodeBuf[0] === 0xd0 &&
            nodeBuf[1] === 0xcf &&
            nodeBuf[2] === 0x11 &&
            nodeBuf[3] === 0xe0

          if (isLegacyDoc) {
            throw new DocumentExtractionError({
              code: "CORRUPTED_FILE",
              title: "Legacy Word (.DOC) Detected",
              message:
                "This file appears to be a legacy Word 97-2004 (.DOC) document renamed to .DOCX.",
              suggestion:
                "Please save the document as a modern Word Document (.docx) or export it as .TXT or .PDF.",
              statusCode: 422,
            })
          }

          if (!isZip) {
            throw new DocumentExtractionError({
              code: "CORRUPTED_FILE",
              title: "Invalid DOCX Structure",
              message: "The uploaded file is not a valid OpenXML Word document (.docx).",
              suggestion: "Please verify the document is not corrupted and re-upload.",
              statusCode: 422,
            })
          }
        }

        const mammoth = await import("mammoth")
        const result = await mammoth.default.extractRawText({ buffer: nodeBuf })
        const normalized = normalizeExtractedText(result.value)

        if (!hasMeaningfulText(normalized)) {
          throw new DocumentExtractionError({
            code: "EMPTY_TEXT",
            title: "Empty Word Document",
            message: `The Word document "${filename}" contains no readable text or clauses.`,
            suggestion: "Please upload a document with valid text content.",
            statusCode: 422,
          })
        }

        const lines = normalized.split("\n")
        const wordCount = normalized.split(/\s+/).filter(Boolean).length

        return {
          content: normalized,
          lineCount: lines.length,
          wordCount,
          isTextReadable: true,
          metadata: {
            format: "DOCX",
          },
        }
      } catch (err: unknown) {
        if (
          err instanceof DocumentExtractionError ||
          (err && typeof err === "object" && (err as { name?: string }).name === "DocumentExtractionError")
        ) {
          throw err
        }

        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes("central directory") || msg.includes("zip")) {
          throw new DocumentExtractionError({
            code: "CORRUPTED_FILE",
            title: "Corrupted DOCX File",
            message:
              "The uploaded Word document could not be uncompressed. It may be corrupted or an unsupported format.",
            suggestion: "Please open the file in Microsoft Word or Google Docs and save as .docx or .pdf.",
            statusCode: 422,
          })
        }

        throw new DocumentExtractionError({
          code: "EXTRACTION_FAILED",
          title: "DOCX Extraction Error",
          message: `Unable to extract text from Word document: ${filename}.`,
          suggestion: "Ensure the document is a valid .docx file and not password-protected.",
          statusCode: 422,
        })
      }
    }

    default:
      throw new DocumentExtractionError({
        code: "UNSUPPORTED_TYPE",
        title: "Unsupported Format",
        message: `Files with extension "${ext}" are not supported for extraction.`,
        suggestion: "LawLens currently supports .TXT, .MD, .PDF, and .DOCX legal files.",
        statusCode: 400,
      })
  }
}
