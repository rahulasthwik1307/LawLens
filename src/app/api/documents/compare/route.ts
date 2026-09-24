import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/services/ai/ai-service"
import { AIProviderError } from "@/services/ai/types"
import { UploadedDocument } from "@/types/document"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await req.json()
    const documentA: UploadedDocument = body?.documentA
    const documentB: UploadedDocument = body?.documentB
    const jurisdiction: string | undefined = body?.jurisdiction

    if (!documentA || typeof documentA !== "object" || !documentB || typeof documentB !== "object") {
      return NextResponse.json(
        {
          error: "Invalid request payload. Both documentA and documentB objects are required.",
          code: "INVALID_REQUEST",
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Verify distinct documents
    if (documentA.id === documentB.id) {
      return NextResponse.json(
        {
          error: "Cannot compare a document against itself. Please select two distinct documents.",
          code: "SAME_DOCUMENT_COMPARISON",
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Verify text readability for document A
    if (!documentA.isTextReadable || !documentA.content || !documentA.content.trim()) {
      return NextResponse.json(
        {
          error: `Document "${documentA.name || "A"}" requires readable text before comparison.`,
          code: "UNREADABLE_DOCUMENT",
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Verify text readability for document B
    if (!documentB.isTextReadable || !documentB.content || !documentB.content.trim()) {
      return NextResponse.json(
        {
          error: `Document "${documentB.name || "B"}" requires readable text before comparison.`,
          code: "UNREADABLE_DOCUMENT",
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Execute comparison pipeline
    const result = await aiService.compareDocuments(documentA, documentB, jurisdiction)

    // Privacy-safe operational telemetry
    const durationMs = Date.now() - startTime
    console.info(
      JSON.stringify({
        event: "document_comparison_completed",
        docAId: documentA.id,
        docBId: documentB.id,
        totalDifferences: result.stats.totalDifferences,
        addedCount: result.stats.addedCount,
        removedCount: result.stats.removedCount,
        modifiedCount: result.stats.modifiedCount,
        valueChangedCount: result.stats.valueChangedCount,
        reviewRecommendedCount: result.stats.reviewRecommendedCount,
        verifiedEvidenceItems: result.stats.verifiedEvidenceItems,
        durationMs,
        provider: result.metadata.providerId,
      })
    )

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime

    if (error instanceof AIProviderError) {
      console.warn(
        JSON.stringify({
          event: "document_comparison_error",
          code: error.code,
          statusCode: error.statusCode,
          retryable: error.retryable,
          durationMs,
        })
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
      JSON.stringify({
        event: "document_comparison_unexpected_error",
        error: error instanceof Error ? error.message : String(error),
        durationMs,
      })
    )

    return NextResponse.json(
      {
        error: "An unexpected error occurred while comparing the documents. Please try again.",
        code: "INTERNAL_ERROR",
        retryable: true,
      },
      { status: 500 }
    )
  }
}
