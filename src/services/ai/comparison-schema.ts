import { z } from "zod"
import type {
  ComparisonDifferenceType,
  ComparisonReviewStatus,
} from "./types.ts"

export const RawDifferenceEvidenceSchema = z.object({
  document: z.enum(["A", "B"]),
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

export const RawDifferenceItemSchema = z.object({
  clauseTitle: z.string().min(1, "Clause title is required"),
  clauseNumber: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val || undefined),
  type: z
    .string()
    .optional()
    .transform((val): ComparisonDifferenceType => {
      if (!val) return "modified"
      const lower = val.toLowerCase().replace(/[\s-]/g, "_")
      if (lower.includes("add")) return "added"
      if (lower.includes("remov") || lower.includes("delet")) return "removed"
      if (lower.includes("val") || lower.includes("amount") || lower.includes("number")) return "value_changed"
      if (lower.includes("unchang") || lower.includes("same")) return "unchanged"
      return "modified"
    }),
  reviewStatus: z
    .string()
    .optional()
    .transform((val): ComparisonReviewStatus => {
      if (!val) return "standard_modification"
      const lower = val.toLowerCase().replace(/[\s-]/g, "_")
      if (lower.includes("review") || lower.includes("flag") || lower.includes("critical") || lower.includes("high")) {
        return "review_recommended"
      }
      if (lower.includes("neutral") || lower.includes("unchanged") || lower.includes("minor")) {
        return "neutral"
      }
      return "standard_modification"
    }),
  summary: z.string().min(1, "Summary is required"),
  explanation: z.string().min(1, "Explanation is required"),
  evidenceA: z.array(RawDifferenceEvidenceSchema).default([]),
  evidenceB: z.array(RawDifferenceEvidenceSchema).default([]),
  riskOrReviewNote: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val || undefined),
})

export const ComparisonOutputSchema = z.object({
  executiveSummary: z.string().min(1, "Executive summary is required"),
  unchangedProvisionsSummary: z
    .string()
    .default("Foundational provisions and boilerplate remain consistent between Document A and Document B."),
  differences: z.array(RawDifferenceItemSchema).default([]),
})

export type ValidatedComparisonOutput = z.infer<typeof ComparisonOutputSchema>

/**
 * Validates raw model output for document comparison against the schema.
 * Rejects malformed JSON or invalid schema structures safely.
 */
export function validateComparisonSchema(raw: unknown): {
  success: boolean
  data?: ValidatedComparisonOutput
  error?: string
} {
  const parseResult = ComparisonOutputSchema.safeParse(raw)
  if (parseResult.success) {
    return { success: true, data: parseResult.data }
  }

  const issueMsg = parseResult.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ")

  return {
    success: false,
    error: `Model comparison output failed schema validation: ${issueMsg}`,
  }
}
