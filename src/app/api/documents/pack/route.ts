import { NextRequest, NextResponse } from "next/server"
import { composePreparationPack } from "@/services/ai/pack-composer"
import { validatePreparationPackSchema } from "@/services/ai/pack-schema"
import type { UploadedDocument } from "@/types/document"
import type {
  ActionItem,
  DocumentAnalysisResult,
  DocumentComparisonResult,
  DocumentQAResult,
} from "@/services/ai/types"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await req.json()
    const document: UploadedDocument | undefined = body?.document
    const analysisResult: DocumentAnalysisResult | undefined = body?.analysisResult
    const actions: ActionItem[] | undefined = body?.actions
    const comparisonResult: DocumentComparisonResult | undefined = body?.comparisonResult
    const comparisonDocB: UploadedDocument | undefined = body?.comparisonDocB
    const qaHistory: DocumentQAResult[] | undefined = body?.qaHistory
    const customSummary: string | undefined = body?.customSummary

    if (!document || typeof document !== "object") {
      return NextResponse.json(
        {
          error: "Document object is required to generate a preparation pack.",
          code: "INVALID_REQUEST",
          retryable: false,
        },
        { status: 400 }
      )
    }

    if (!document.isTextReadable || !document.content?.trim()) {
      return NextResponse.json(
        {
          error: `Document "${document.name || "Untitled"}" requires readable text before generating a preparation pack.`,
          code: "UNREADABLE_DOCUMENT",
          retryable: false,
        },
        { status: 400 }
      )
    }

    // 1. Compose Preparation Pack deterministically from verified sources
    const pack = composePreparationPack({
      document,
      analysisResult,
      actions,
      comparisonResult,
      comparisonDocB,
      qaHistory,
      customSummary,
    })

    // 2. Schema validation
    const validation = validatePreparationPackSchema(pack)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: `Pack validation failed: ${validation.error}`,
          code: "MALFORMED_OUTPUT",
          retryable: false,
        },
        { status: 500 }
      )
    }

    const elapsedMs = Date.now() - startTime
    const response = NextResponse.json(
      {
        success: true,
        pack: validation.data,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    )

    response.headers.set("X-Response-Time-Ms", elapsedMs.toString())
    response.headers.set("X-Total-Review-Items", pack.stats.totalReviewItems.toString())
    response.headers.set("X-Total-Questions", pack.stats.totalQuestions.toString())
    response.headers.set("X-Total-Key-Terms", pack.stats.totalKeyTerms.toString())
    response.headers.set("X-Total-Evidence-Citations", pack.stats.totalEvidenceCitations.toString())

    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json(
      {
        error: message,
        code: "INTERNAL_ERROR",
        retryable: false,
      },
      { status: 500 }
    )
  }
}
