import { NextRequest, NextResponse } from "next/server"
import {
  extractDocumentText,
  DocumentExtractionError,
} from "@/services/documents/document-extractor"
import {
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_EXTENSIONS,
} from "@/lib/document-validation"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        {
          success: false,
          code: "EMPTY_FILE",
          title: "Missing File",
          error: "No file was provided in the upload request.",
          suggestion: "Please attach a supported legal document.",
        },
        { status: 400 }
      )
    }

    const filename = "name" in file ? (file as File).name : "uploaded_document"
    const extension = "." + (filename.split(".").pop()?.toLowerCase() || "")

    // Pre-validate file extension
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        {
          success: false,
          code: "UNSUPPORTED_TYPE",
          title: "Unsupported File Format",
          error: `Files with extension "${extension}" are not supported.`,
          suggestion: `LawLens currently accepts ${SUPPORTED_EXTENSIONS.join(", ").toUpperCase()} legal files.`,
        },
        { status: 400 }
      )
    }

    // Pre-validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      return NextResponse.json(
        {
          success: false,
          code: "FILE_TOO_LARGE",
          title: "File Exceeds Size Limit",
          error: `The uploaded file is ${sizeMb} MB, which exceeds the limit of 5.0 MB.`,
          suggestion: "Please upload a document smaller than 5 MB.",
        },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          code: "EMPTY_FILE",
          title: "Empty File Detected",
          error: `The file "${filename}" is 0 bytes and contains no document data.`,
          suggestion: "Please select a valid legal document with content.",
        },
        { status: 400 }
      )
    }

    // Convert file to Node buffer for extraction
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Run secure server-side extraction
    const result = await extractDocumentText(buffer, extension, filename)

    const durationMs = Date.now() - startTime
    console.info(
      `[DOC_EXTRACT_SUCCESS] file="${filename}" format=${extension} lines=${result.lineCount} words=${result.wordCount} durationMs=${durationMs}`
    )

    return NextResponse.json(
      {
        success: true,
        content: result.content,
        lineCount: result.lineCount,
        wordCount: result.wordCount,
        isTextReadable: result.isTextReadable,
        pageCount: result.pageCount,
        metadata: result.metadata,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime

    if (error instanceof DocumentExtractionError) {
      console.warn(
        `[DOC_EXTRACT_FAIL] code=${error.code} status=${error.statusCode} durationMs=${durationMs}`
      )
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          title: error.title,
          error: error.message,
          suggestion: error.suggestion,
        },
        { status: error.statusCode }
      )
    }

    console.error(
      `[DOC_EXTRACT_UNEXPECTED] error="${error instanceof Error ? error.message : String(error)}" durationMs=${durationMs}`
    )
    return NextResponse.json(
      {
        success: false,
        code: "EXTRACTION_FAILED",
        title: "Document Extraction Error",
        error: "An unexpected error occurred while parsing the document.",
        suggestion: "Please ensure the document is not corrupted or try another format.",
      },
      { status: 500 }
    )
  }
}
