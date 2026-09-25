import { z } from "zod"
import type { FindingConfidence, RawQAOutput } from "./types.ts"

export const RawQAEvidenceSchema = z.object({
  quote: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? ""),
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

export const QAOutputSchema = z.object({
  answer: z.string().min(1, "Answer is required"),
  confidence: z
    .string()
    .nullable()
    .optional()
    .transform((val): FindingConfidence => {
      if (!val) return "supported_by_source"
      const lower = val.toLowerCase().replace(/[\s-]/g, "_")
      if (lower.includes("unclear") || lower.includes("missing") || lower.includes("insufficient")) {
        return "unclear_from_document"
      }
      if (lower.includes("clear") || lower.includes("explicit") || lower.includes("direct")) {
        return "clear_in_document"
      }
      if (lower.includes("review") || lower.includes("uncertain") || lower.includes("ambiguous")) {
        return "needs_review"
      }
      return "supported_by_source"
    }),
  uncertainty: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  evidence: z.array(RawQAEvidenceSchema).default([]),
})

export type ValidatedQAOutput = z.infer<typeof QAOutputSchema>

/**
 * Validates raw model output for Q&A requests against the schema.
 * Rejects malformed JSON or invalid schema structures safely.
 */
export function validateQASchema(raw: unknown): {
  success: boolean
  data?: ValidatedQAOutput
  error?: string
} {
  const parseResult = QAOutputSchema.safeParse(raw)
  if (parseResult.success) {
    return { success: true, data: parseResult.data }
  }

  const issueMsg = parseResult.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ")

  return {
    success: false,
    error: `QA schema validation failed: ${issueMsg}`,
  }
}
