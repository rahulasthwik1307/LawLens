import { z } from "zod"
import type { LegalResource } from "./resource-registry"

export const LegalResourceSchema = z.object({
  id: z.string().min(1, "Resource ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["official", "legal_aid", "professional"]),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  organization: z.string().min(1, "Organization is required"),
  url: z.string().url("Must be a valid URL").refine((val) => {
    return val.startsWith("https://")
  }, "Only secure HTTPS URLs are permitted"),
  sourceType: z.enum([
    "statutory_portal",
    "court_portal",
    "legal_aid_authority",
    "regulatory_body",
    "professional_guidance",
  ]),
  lastVerified: z.string().min(1, "Verification date is required"),
  relevanceHint: z.string().optional(),
})

export function validateResourceSchema(data: unknown): {
  success: boolean
  data?: LegalResource
  error?: string
} {
  const result = LegalResourceSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data as LegalResource }
  }
  const formattedErrors = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ")
  return { success: false, error: formattedErrors }
}
