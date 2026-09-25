import { z } from "zod"
import type { FindingConfidence } from "./types.ts"

const ConfidenceEnum = z.enum([
  "clear_in_document",
  "supported_by_source",
  "needs_review",
  "unclear_from_document",
])

export const RawFindingSchema = z.object({
  title: z.string().min(1, "Finding title is required"),
  explanation: z.string().min(1, "Finding explanation is required"),
  confidence: z
    .string()
    .nullable()
    .optional()
    .transform((val): FindingConfidence => {
      if (!val) return "supported_by_source"
      const lower = val.toLowerCase().replace(/[\s-]/g, "_")
      if (lower.includes("unclear") || lower.includes("missing")) return "unclear_from_document"
      if (lower.includes("clear") || lower.includes("explicit")) return "clear_in_document"
      if (lower.includes("review") || lower.includes("uncertain")) return "needs_review"
      return "supported_by_source"
    }),
  uncertainty: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  evidenceQuote: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  startLine: z
    .coerce
    .number()
    .int()
    .nullable()
    .optional()
    .transform((val) => (typeof val === "number" && val > 0 ? val : undefined)),
  endLine: z
    .coerce
    .number()
    .int()
    .nullable()
    .optional()
    .transform((val) => (typeof val === "number" && val > 0 ? val : undefined)),
})

export const AnalysisOutputSchema = z.object({
  documentType: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? "Legal Agreement"),
  summary: z.string().min(1, "Document summary is required"),
  parties: z.array(RawFindingSchema).default([]),
  dates: z.array(RawFindingSchema).default([]),
  monetaryItems: z.array(RawFindingSchema).default([]),
  rights: z.array(RawFindingSchema).default([]),
  obligations: z.array(RawFindingSchema).default([]),
  restrictions: z.array(RawFindingSchema).default([]),
  termination: z.array(RawFindingSchema).default([]),
  disputeResolution: z.array(RawFindingSchema).default([]),
  reviewPoints: z.array(RawFindingSchema).default([]),
})

export type ValidatedAnalysisOutput = z.infer<typeof AnalysisOutputSchema>

/**
 * Validates raw model output against the analysis schema.
 * Rejects malformed JSON or invalid schema structures safely.
 */
export function validateAnalysisSchema(raw: unknown): {
  success: boolean
  data?: ValidatedAnalysisOutput
  error?: string
} {
  const parseResult = AnalysisOutputSchema.safeParse(raw)
  if (parseResult.success) {
    return { success: true, data: parseResult.data }
  }

  const issueMsg = parseResult.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ")

  return {
    success: false,
    error: `Schema validation failed: ${issueMsg}`,
  }
}
