import { z } from "zod"
import type {
  ActionPriority,
  ActionType,
  RawActionGenerationOutput,
  RawActionItemInput,
} from "./types.ts"

export const RawActionItemInputSchema = z.object({
  candidateId: z.string().optional(),
  type: z
    .string()
    .optional()
    .transform((val): ActionType => {
      if (!val) return "review"
      const lower = val.toLowerCase().replace(/[\s-]/g, "_")
      if (lower.includes("verify") || lower.includes("check")) return "verify"
      if (lower.includes("prep")) return "prepare"
      if (lower.includes("ask") || lower.includes("clarif") || lower.includes("question")) return "ask"
      if (lower.includes("track") || lower.includes("date") || lower.includes("deadlin")) return "track"
      return "review"
    }),
  priority: z
    .string()
    .optional()
    .transform((val): ActionPriority => {
      if (!val) return "standard"
      const lower = val.toLowerCase().replace(/[\s-]/g, "_")
      if (
        lower.includes("attention") ||
        lower.includes("urgent") ||
        lower.includes("high") ||
        lower.includes("critical")
      ) {
        return "attention"
      }
      if (lower.includes("import") || lower.includes("medium")) {
        return "important"
      }
      return "standard"
    }),
  title: z.string().min(1, "Action title is required"),
  description: z.string().min(1, "Action description is required"),
  whyItMatters: z.string().min(1, "Why it matters explanation is required"),
  suggestedStep: z.string().optional(),
  evidenceQuote: z.string().optional().default(""),
  startLine: z
    .coerce
    .number()
    .int()
    .optional()
    .transform((val) => (typeof val === "number" && val > 0 ? val : undefined)),
  endLine: z
    .coerce
    .number()
    .int()
    .optional()
    .transform((val) => (typeof val === "number" && val > 0 ? val : undefined)),
  documentDesignation: z
    .enum(["A", "B", "both"])
    .optional(),
  relatedFindingId: z.string().optional(),
  relatedDifferenceId: z.string().optional(),
})

export const ActionOutputSchema = z.object({
  actions: z.array(RawActionItemInputSchema).default([]),
})

export type ValidatedActionOutput = z.infer<typeof ActionOutputSchema>

/**
 * Validates raw model output for action synthesis against the Zod schema.
 * Rejects malformed JSON or invalid schema structures safely.
 */
export function validateActionSchema(raw: unknown): {
  success: boolean
  data?: ValidatedActionOutput
  error?: string
} {
  const parseResult = ActionOutputSchema.safeParse(raw)
  if (parseResult.success) {
    return { success: true, data: parseResult.data }
  }

  const issueMsg = parseResult.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ")

  return {
    success: false,
    error: `Model action synthesis output failed schema validation: ${issueMsg}`,
  }
}
