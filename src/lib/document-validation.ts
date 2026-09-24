import { UploadedDocument, ValidationError, ValidationResult } from "@/types/document"

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
  const isTextReadable = extension === ".txt" || extension === ".md"

  try {
    let content = ""
    let lineCount = 0
    let wordCount = 0

    if (isTextReadable) {
      content = await file.text()
      const lines = content.split(/\r\n|\r|\n/)
      lineCount = lines.length
      wordCount = content.trim().split(/\s+/).filter(Boolean).length
    } else {
      // For binary formats (PDF/DOCX) in Phase 2, provide an honest safe structural container
      // Note: Full client-side PDF/DOCX rendering is in subsequent phases; we preserve file integrity
      content = `[Safe Document Container: ${file.name}]\nFormat: ${file.type || extension.toUpperCase()}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nNotice: This is a binary legal file (${extension.toUpperCase()}). File metadata and intake boundaries are verified. Full server-side extraction pipeline is required for this format. To inspect live text analysis immediately, try uploading a .TXT or .MD document, or load one of the authentic Indian sample agreements.`
      lineCount = 6
      wordCount = content.trim().split(/\s+/).length
    }

    const doc: UploadedDocument = {
      id: "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      extension,
      content,
      isTextReadable,
      lineCount,
      wordCount,
      uploadedAt: new Date(),
      jurisdiction,
    }

    return { isValid: true, document: doc }
  } catch (err) {
    return {
      isValid: false,
      error: {
        type: "read_error",
        title: "File Reading Error",
        message: "The document could not be read by your browser.",
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
