import { z } from "zod"
import type {
  ProfessionalPreparationPack,
} from "./types.ts"

export const PackReviewItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  whyItMatters: z.string().min(1, "Why it matters is required"),
  suggestedAction: z.string().optional(),
  priority: z.enum(["attention", "important", "standard"]),
  actionType: z.enum(["review", "verify", "prepare", "ask", "track"]).optional(),
  status: z.enum(["open", "reviewed", "completed"]).optional(),
  sourceEvidence: z.array(
    z.object({
      documentId: z.string(),
      documentName: z.string(),
      sourceText: z.string(),
      startLine: z.number().int().positive(),
      endLine: z.number().int().positive(),
      verificationStatus: z.enum(["verified", "unverified", "not_found"]),
      documentDesignation: z.enum(["A", "B", "both"]).optional(),
    })
  ).default([]),
})

export const PackQuestionItemSchema = z.object({
  id: z.string(),
  question: z.string().min(1, "Question is required"),
  whyThisQuestion: z.string().min(1, "Rationale is required"),
  category: z.string().optional(),
  sourceEvidence: z.array(
    z.object({
      documentId: z.string(),
      documentName: z.string(),
      sourceText: z.string(),
      startLine: z.number().int().positive(),
      endLine: z.number().int().positive(),
      verificationStatus: z.enum(["verified", "unverified", "not_found"]),
      documentDesignation: z.enum(["A", "B", "both"]).optional(),
    })
  ).default([]),
})

export const PackKeyTermItemSchema = z.object({
  id: z.string(),
  category: z.enum(["date", "amount", "obligation", "notice", "restriction", "general"]),
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
  details: z.string().optional(),
  sourceEvidence: z.array(
    z.object({
      documentId: z.string(),
      documentName: z.string(),
      sourceText: z.string(),
      startLine: z.number().int().positive(),
      endLine: z.number().int().positive(),
      verificationStatus: z.enum(["verified", "unverified", "not_found"]),
      documentDesignation: z.enum(["A", "B", "both"]).optional(),
    })
  ).default([]),
})

export const PackComparisonItemSchema = z.object({
  id: z.string(),
  clauseTitle: z.string().min(1),
  clauseNumber: z.string().optional(),
  changeType: z.string(),
  summary: z.string().min(1),
  docAValue: z.string().optional(),
  docBValue: z.string().optional(),
  evidenceA: z.array(
    z.object({
      documentId: z.string(),
      documentName: z.string(),
      sourceText: z.string(),
      startLine: z.number().int().positive(),
      endLine: z.number().int().positive(),
      verificationStatus: z.enum(["verified", "unverified", "not_found"]),
    })
  ).optional(),
  evidenceB: z.array(
    z.object({
      documentId: z.string(),
      documentName: z.string(),
      sourceText: z.string(),
      startLine: z.number().int().positive(),
      endLine: z.number().int().positive(),
      verificationStatus: z.enum(["verified", "unverified", "not_found"]),
    })
  ).optional(),
})

export const PackQAItemSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  answer: z.string().min(1),
  confidence: z.enum(["clear_in_document", "supported_by_source", "needs_review", "unclear_from_document"]),
  evidence: z.array(
    z.object({
      sourceText: z.string(),
      startLine: z.number().int().positive(),
      endLine: z.number().int().positive(),
      verificationStatus: z.enum(["verified", "unverified", "not_found"]),
    })
  ).default([]),
})

export const PackEvidenceAppendixItemSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  documentName: z.string(),
  quote: z.string().min(1),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  verificationStatus: z.enum(["verified", "unverified", "not_found"]),
  referencedBy: z.string(),
})

export const ProfessionalPreparationPackSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  overview: z.object({
    documentName: z.string().min(1),
    documentType: z.string().optional(),
    jurisdiction: z.string().min(1),
    parties: z.array(z.object({ name: z.string(), role: z.string().optional() })).optional(),
    lineCount: z.number().int().nonnegative(),
    wordCount: z.number().int().nonnegative(),
    comparisonDocumentName: z.string().optional(),
    modelUsed: z.string().optional(),
  }),
  executiveSummary: z.string().min(1, "Executive summary is required"),
  reviewItems: z.array(PackReviewItemSchema),
  questionsToDiscuss: z.array(PackQuestionItemSchema),
  keyTerms: z.array(PackKeyTermItemSchema),
  comparisonChanges: z.array(PackComparisonItemSchema).optional(),
  selectedQA: z.array(PackQAItemSchema).optional(),
  evidenceAppendix: z.array(PackEvidenceAppendixItemSchema),
  stats: z.object({
    totalReviewItems: z.number().int().nonnegative(),
    totalQuestions: z.number().int().nonnegative(),
    totalKeyTerms: z.number().int().nonnegative(),
    totalComparisonChanges: z.number().int().nonnegative(),
    totalEvidenceCitations: z.number().int().nonnegative(),
    verifiedCitationsCount: z.number().int().nonnegative(),
  }),
  legalNotice: z.string().min(1),
})

export function validatePreparationPackSchema(data: unknown): {
  success: boolean
  data?: ProfessionalPreparationPack
  error?: string
} {
  const result = ProfessionalPreparationPackSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data as ProfessionalPreparationPack }
  }
  const formattedErrors = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ")
  return { success: false, error: formattedErrors }
}
