import type { UploadedDocument, ValidationError, ValidationResult } from "../types/document.ts"
import { normalizeExtractedText } from "./text-normalization.ts"

export { normalizeExtractedText }

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".pdf", ".docx"]

export function validateFileMetadata(file: File): ValidationError | null {
  // Check empty file
  if (file.size === 0) {
    return {
      type: "empty_file",
      title: "Empty File Detected",
      message: `The selected file "${file.name}" has a size of 0 bytes and contains no document data.`,
      suggestion: "Please select a valid legal document with content.",
    }
  }

  // Check file size limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1)
    return {
      type: "file_too_large",
      title: "File Exceeds Maximum Size",
      message: `The selected file is ${sizeInMb} MB, which exceeds the current limit of 5.0 MB.`,
      suggestion: "Please upload a document smaller than 5 MB or extract the relevant agreement sections.",
    }
  }

  // Check file extension
  const extension = "." + (file.name.split(".").pop()?.toLowerCase() || "")
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return {
      type: "unsupported_type",
      title: "Unsupported File Format",
      message: `Files with the extension "${extension}" are not supported.`,
      suggestion: `LawLens currently accepts ${SUPPORTED_EXTENSIONS.join(", ").toUpperCase()} legal files.`,
    }
  }

  return null
}


export async function processLocalFile(
  file: File,
  jurisdiction: string = "India"
): Promise<ValidationResult> {
  const metaError = validateFileMetadata(file)
  if (metaError) {
    return { isValid: false, error: metaError }
  }

  const extension = "." + (file.name.split(".").pop()?.toLowerCase() || "")
  const isTextFormat = extension === ".txt" || extension === ".md"

  try {
    let content = ""
    let lineCount = 0
    let wordCount = 0
    let pageCount: number | undefined

    if (isTextFormat) {
      // Local client-side text reading for instant speed
      const rawText = await file.text()
      const normalized = normalizeExtractedText(rawText)

      const matches = normalized.match(/[\p{L}\p{N}]/gu)
      if (!normalized || !matches || matches.length < 3) {
        return {
          isValid: false,
          error: {
            type: "empty_file",
            title: "Empty Document Content",
            message: `The text file "${file.name}" contains no readable words or clauses.`,
            suggestion: "Please upload a document with valid agreement text.",
          },
        }
      }

      content = normalized
      const lines = content.split("\n")
      lineCount = lines.length
      wordCount = content.split(/\s+/).filter(Boolean).length
    } else {
      // Binary formats (.pdf, .docx): perform server-side extraction
      if (typeof window !== "undefined") {
        // Browser environment: call /api/documents/extract
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/documents/extract", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          return {
            isValid: false,
            error: {
              type: data.code === "OCR_REQUIRED" ? "ocr_required" : "read_error",
              title: data.title || "Extraction Failed",
              message:
                data.error ||
                `The ${extension.toUpperCase()} document could not be extracted.`,
              suggestion:
                data.suggestion ||
                "Please verify the document format or try a text (.TXT) version.",
            },
          }
        }

        content = data.content
        lineCount = data.lineCount
        wordCount = data.wordCount
        pageCount = data.pageCount
      } else {
        // Node.js runtime (e.g. unit tests): invoke server extractor directly
        const { extractDocumentText } = await import(
          "../services/documents/document-extractor.ts"
        )
        const arrayBuf = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuf)
        const result = await extractDocumentText(buffer, extension, file.name)

        content = result.content
        lineCount = result.lineCount
        wordCount = result.wordCount
        pageCount = result.pageCount
      }
    }

    const doc: UploadedDocument = {
      id: "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      extension,
      content,
      isTextReadable: true,
      lineCount,
      wordCount,
      pageCount,
      uploadedAt: new Date(),
      jurisdiction,
    }

    return { isValid: true, document: doc }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      const extErr = err as {
        code: string
        title: string
        message: string
        suggestion: string
      }
      return {
        isValid: false,
        error: {
          type: extErr.code === "OCR_REQUIRED" ? "ocr_required" : "read_error",
          title: extErr.title,
          message: extErr.message,
          suggestion: extErr.suggestion,
        },
      }
    }

    return {
      isValid: false,
      error: {
        type: "read_error",
        title: "File Reading Error",
        message: "The document could not be read or extracted.",
        suggestion: "Ensure the file is not locked by another application and try again.",
      },
    }
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}
