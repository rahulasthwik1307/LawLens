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

    // Honest check: verify text extraction availability
    if (!document.isTextReadable || !document.content || !document.content.trim()) {
      return NextResponse.json(
        {
          error:
            "This document format requires server-side extraction before analysis.",
          code: "UNREADABLE_DOCUMENT",
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Execute provider-agnostic document analysis pipeline
    const result = await aiService.analyzeDocument(document, jurisdiction)

    // Privacy-safe operational telemetry (never log document contents or keys)
    const durationMs = Date.now() - startTime
    console.info(
      `[AI_ANALYZE_SUCCESS] docId=${document.id} findings=${result.stats.totalFindings} verified=${result.stats.verifiedFindingsCount} durationMs=${durationMs}`
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime

    if (error instanceof AIProviderError) {
      console.warn(
        `[AI_ANALYZE_FAIL] code=${error.code} status=${error.statusCode} durationMs=${durationMs}`
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
      `[AI_ANALYZE_ERROR] unexpected error durationMs=${durationMs}:`,
      error instanceof Error ? error.message : "Unknown error"
    )

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred during document analysis. Your document remains safe; please try again.",
        code: "PROVIDER_UNAVAILABLE",
        retryable: true,
      },
      { status: 500 }
    )
  }
}
