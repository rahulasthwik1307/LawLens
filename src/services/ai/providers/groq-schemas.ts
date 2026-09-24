/**
 * LawLens Groq Strict JSON Schema Definitions
 * 
 * Defines strict JSON Schema specifications for Groq model structured outputs.
 * Compatible with OpenAI/Groq structured output constraints:
 * - additionalProperties: false on all object levels
 * - all defined properties must be listed in required
 * - optional fields are represented as nullable types (e.g. type: ["string", "null"])
 */

export interface GroqJsonSchemaContract {
  name: string
  strict: boolean
  schema: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// 1. Legal Document Analysis Schema
// ---------------------------------------------------------------------------

const findingItemSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    explanation: { type: "string" },
    confidence: {
      type: "string",
      enum: ["clear_in_document", "supported_by_source", "needs_review", "unclear_from_document"],
    },
    uncertainty: { type: ["string", "null"] },
    evidenceQuote: { type: ["string", "null"] },
    startLine: { type: ["number", "null"] },
    endLine: { type: ["number", "null"] },
  },
  required: [
    "title",
    "explanation",
    "confidence",
    "uncertainty",
    "evidenceQuote",
    "startLine",
    "endLine",
  ],
  additionalProperties: false,
}

export const ANALYSIS_JSON_SCHEMA: GroqJsonSchemaContract = {
  name: "legal_document_analysis",
  strict: true,
  schema: {
    type: "object",
    properties: {
      documentType: { type: "string" },
      summary: { type: "string" },
      parties: { type: "array", items: findingItemSchema },
      dates: { type: "array", items: findingItemSchema },
      monetaryItems: { type: "array", items: findingItemSchema },
      rights: { type: "array", items: findingItemSchema },
      obligations: { type: "array", items: findingItemSchema },
      restrictions: { type: "array", items: findingItemSchema },
      termination: { type: "array", items: findingItemSchema },
      disputeResolution: { type: "array", items: findingItemSchema },
      reviewPoints: { type: "array", items: findingItemSchema },
    },
    required: [
      "documentType",
      "summary",
      "parties",
      "dates",
      "monetaryItems",
      "rights",
      "obligations",
      "restrictions",
      "termination",
      "disputeResolution",
      "reviewPoints",
    ],
    additionalProperties: false,
  },
}

// ---------------------------------------------------------------------------
// 2. Document Q&A Schema
// ---------------------------------------------------------------------------

const qaEvidenceItemSchema = {
  type: "object",
  properties: {
    quote: { type: "string" },
    startLine: { type: ["number", "null"] },
    endLine: { type: ["number", "null"] },
  },
  required: ["quote", "startLine", "endLine"],
  additionalProperties: false,
}

export const QA_JSON_SCHEMA: GroqJsonSchemaContract = {
  name: "legal_document_qa",
  strict: true,
  schema: {
    type: "object",
    properties: {
      answer: { type: "string" },
      confidence: {
        type: "string",
        enum: ["clear_in_document", "supported_by_source", "needs_review", "unclear_from_document"],
      },
      uncertainty: { type: ["string", "null"] },
      evidence: {
        type: "array",
        items: qaEvidenceItemSchema,
      },
    },
    required: ["answer", "confidence", "uncertainty", "evidence"],
    additionalProperties: false,
  },
}

// ---------------------------------------------------------------------------
// 3. Document Comparison Schema
// ---------------------------------------------------------------------------

const differenceEvidenceSchema = {
  type: "object",
  properties: {
    document: { type: "string", enum: ["A", "B"] },
    quote: { type: "string" },
    startLine: { type: ["number", "null"] },
    endLine: { type: ["number", "null"] },
  },
  required: ["document", "quote", "startLine", "endLine"],
  additionalProperties: false,
}

const differenceItemSchema = {
  type: "object",
  properties: {
    clauseTitle: { type: "string" },
    clauseNumber: { type: ["string", "null"] },
    type: {
      type: "string",
      enum: ["added", "removed", "modified", "value_changed", "unchanged"],
    },
    reviewStatus: {
      type: "string",
      enum: ["review_recommended", "standard_modification", "neutral"],
    },
    summary: { type: "string" },
    explanation: { type: "string" },
    evidenceA: { type: "array", items: differenceEvidenceSchema },
    evidenceB: { type: "array", items: differenceEvidenceSchema },
    riskOrReviewNote: { type: ["string", "null"] },
  },
  required: [
    "clauseTitle",
    "clauseNumber",
    "type",
    "reviewStatus",
    "summary",
    "explanation",
    "evidenceA",
    "evidenceB",
    "riskOrReviewNote",
  ],
  additionalProperties: false,
}

export const COMPARISON_JSON_SCHEMA: GroqJsonSchemaContract = {
  name: "legal_document_comparison",
  strict: true,
  schema: {
    type: "object",
    properties: {
      executiveSummary: { type: "string" },
      unchangedProvisionsSummary: { type: "string" },
      differences: { type: "array", items: differenceItemSchema },
    },
    required: ["executiveSummary", "unchangedProvisionsSummary", "differences"],
    additionalProperties: false,
  },
}

// ---------------------------------------------------------------------------
// 4. Action Synthesis Schema
// ---------------------------------------------------------------------------

const actionItemSchema = {
  type: "object",
  properties: {
    candidateId: { type: ["string", "null"] },
    type: {
      type: "string",
      enum: ["review", "verify", "prepare", "ask", "track"],
    },
    priority: {
      type: "string",
      enum: ["attention", "important", "standard"],
    },
    title: { type: "string" },
    description: { type: "string" },
    whyItMatters: { type: "string" },
    suggestedStep: { type: ["string", "null"] },
    evidenceQuote: { type: ["string", "null"] },
    startLine: { type: ["number", "null"] },
    endLine: { type: ["number", "null"] },
    documentDesignation: {
      type: ["string", "null"],
      enum: ["A", "B", "both", null],
    },
    relatedFindingId: { type: ["string", "null"] },
    relatedDifferenceId: { type: ["string", "null"] },
  },
  required: [
    "candidateId",
    "type",
    "priority",
    "title",
    "description",
    "whyItMatters",
    "suggestedStep",
    "evidenceQuote",
    "startLine",
    "endLine",
    "documentDesignation",
    "relatedFindingId",
    "relatedDifferenceId",
  ],
  additionalProperties: false,
}

export const ACTION_JSON_SCHEMA: GroqJsonSchemaContract = {
  name: "legal_document_actions",
  strict: true,
  schema: {
    type: "object",
    properties: {
      actions: { type: "array", items: actionItemSchema },
    },
    required: ["actions"],
    additionalProperties: false,
  },
}
