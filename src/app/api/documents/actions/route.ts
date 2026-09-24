import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/services/ai/ai-service"
import { AIProviderError } from "@/services/ai/types"
import type { ComparisonDifference, LegalFinding } from "@/services/ai/types"
import type { UploadedDocument } from "@/types/document"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await req.json()
    const document: UploadedDocument | undefined = body?.document
    const documentA: UploadedDocument | undefined = body?.documentA
    const documentB: UploadedDocument | undefined = body?.documentB
    const findings: LegalFinding[] | undefined = body?.findings
    const differences: ComparisonDifference[] | undefined = body?.differences
    const jurisdiction: string | undefined = body?.jurisdiction

    // Case 1: Comparison-derived actions
    if (documentA || documentB || differences) {
      if (!documentA || typeof documentA !== "object" || !documentB || typeof documentB !== "object") {
        return NextResponse.json(
          {
            error: "Both documentA and documentB objects are required for comparison action generation.",
            code: "INVALID_REQUEST",
            retryable: false,
          },
          { status: 400 }
        )
      }

      if (documentA.id === documentB.id) {
        return NextResponse.json(
          {
            error: "Cannot generate comparison actions for the same document.",
            code: "SAME_DOCUMENT_COMPARISON",
            retryable: false,
          },
          { status: 400 }
        )
      }

      if (!documentA.isTextReadable || !documentA.content?.trim()) {
        return NextResponse.json(
          {
            error: `Document "${documentA.name || "A"}" requires readable text before generating actions.`,
            code: "UNREADABLE_DOCUMENT",
            retryable: false,
          },
          { status: 400 }
        )
      }

      if (!documentB.isTextReadable || !documentB.content?.trim()) {
        return NextResponse.json(
          {
            error: `Document "${documentB.name || "B"}" requires readable text before generating actions.`,
            code: "UNREADABLE_DOCUMENT",
            retryable: false,
          },
          { status: 400 }
        )
      }

      const result = await aiService.generateActions({
        documentA,
        documentB,
        differences,
        jurisdiction,
      })

      const durationMs = Date.now() - startTime
      console.info(
        JSON.stringify({
          event: "comparison_actions_generated",
          docAId: documentA.id,
          docBId: documentB.id,
          totalActions: result.stats.totalActions,
          attentionCount: result.stats.attentionCount,
          verifiedEvidenceItems: result.stats.verifiedEvidenceItems,
          durationMs,
        })
      )

      return NextResponse.json({ success: true, result }, { status: 200 })
    }

    // Case 2: Single document actions
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

    if (!document.isTextReadable || !document.content?.trim()) {
      return NextResponse.json(
        {
          error: "This document format requires readable text before generating actions.",
          code: "UNREADABLE_DOCUMENT",
          retryable: false,
        },
        { status: 400 }
      )
    }

    const result = await aiService.generateActions({
      document,
      findings,
      jurisdiction: jurisdiction || document.jurisdiction,
    })

    const durationMs = Date.now() - startTime
    console.info(
      JSON.stringify({
        event: "document_actions_generated",
        docId: document.id,
        totalActions: result.stats.totalActions,
        attentionCount: result.stats.attentionCount,
        verifiedEvidenceItems: result.stats.verifiedEvidenceItems,
        durationMs,
      })
    )

    return NextResponse.json({ success: true, result }, { status: 200 })
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime

    if (error instanceof AIProviderError) {
      console.warn(
        JSON.stringify({
          event: "action_generation_error",
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
        event: "action_generation_unexpected_error",
        error: error instanceof Error ? error.message : String(error),
        durationMs,
      })
    )

    return NextResponse.json(
      {
        error: "An unexpected error occurred while generating actions. Your document remains safe; please try again.",
        code: "INTERNAL_ERROR",
        retryable: true,
      },
      { status: 500 }
    )
  }
}
