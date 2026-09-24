import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/services/ai/ai-service"
import { AIProviderError } from "@/services/ai/types"
import { UploadedDocument } from "@/types/document"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await req.json()
    const document: UploadedDocument = body?.document
    const question: unknown = body?.question
    const jurisdiction: string | undefined = body?.jurisdiction

    if (!document || typeof document !== "object") {
      return NextResponse.json(
        {
          error: "Invalid request payload. Document object is required.",
          code: "INVALID_REQUEST",
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Verify text readability
    if (!document.isTextReadable || !document.content || !document.content.trim()) {
      return NextResponse.json(
        {
          error: "This document format requires text extraction before asking questions.",
          code: "UNREADABLE_DOCUMENT",
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Validate question string
    if (typeof question !== "string") {
      return NextResponse.json(
        {
          error: "Question must be a string.",
          code: "INVALID_REQUEST",
          retryable: false,
        },
        { status: 400 }
      )
    }

    const trimmedQuestion = question.trim()
    if (trimmedQuestion.length < 3) {
      return NextResponse.json(
        {
          error: "Please enter a question with at least 3 characters.",
          code: "INVALID_REQUEST",
          retryable: false,
        },
        { status: 400 }
      )
    }

    if (trimmedQuestion.length > 500) {
      return NextResponse.json(
        {
          error: "Question exceeds maximum allowed length of 500 characters.",
          code: "INVALID_REQUEST",
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Execute evidence-grounded Q&A pipeline
    const result = await aiService.askQuestion(document, trimmedQuestion, jurisdiction)

    // Privacy-safe operational telemetry (never log document contents, question text, or keys)
    const durationMs = Date.now() - startTime
    console.info(
      `[AI_QA_SUCCESS] docId=${document.id} qLen=${trimmedQuestion.length} evidence=${result.stats.totalEvidenceCount} verified=${result.stats.verifiedCount} durationMs=${durationMs}`
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime

    if (error instanceof AIProviderError) {
      console.warn(
        `[AI_QA_FAIL] code=${error.code} status=${error.statusCode} durationMs=${durationMs}`
      )
      return NextResponse.json(
        {
          error: error.userMessage,
          code: error.code,
          retryable: error.retryable,
        },
        { status: error.statusCode }
      )
    }

    console.error(
      `[AI_QA_ERROR] unexpected error durationMs=${durationMs}:`,
      error instanceof Error ? error.message : "Unknown error"
    )

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while processing your question. Your document remains safe; please try again.",
        code: "INTERNAL_ERROR",
        retryable: true,
      },
      { status: 500 }
    )
  }
}
