/**
 * LawLens AI Service Types
 * Defines provider-independent types for document understanding,
 * evidence grounding, and structured legal findings.
 */

import type { UploadedDocument } from "../../types/document.ts"

export type FindingCategory =
  | "parties"
  | "dates"
  | "monetary"
  | "rights"
  | "obligations"
  | "restrictions"
  | "termination"
  | "dispute_resolution"
  | "review_points"

export type FindingConfidence =
  | "clear_in_document"
  | "supported_by_source"
  | "needs_review"
  | "unclear_from_document"

export type EvidenceVerificationStatus =
  | "verified"
  | "unverified"
  | "not_found"

export interface FindingEvidence {
  sourceText: string
  startLine: number
  endLine: number
  verificationStatus: EvidenceVerificationStatus
}

export interface LegalFinding {
  id: string
  category: FindingCategory
  title: string
  explanation: string
  confidence: FindingConfidence
  uncertainty?: string
  evidence?: FindingEvidence
}

export interface NormalizedDocumentLine {
  lineNumber: number
  text: string
}

export interface NormalizedDocument {
  id: string
  name: string
  jurisdiction: string
  sourceText: string
  lines: NormalizedDocumentLine[]
  lineCount: number
  wordCount: number
  metadata: {
    size: number
    mimeType: string
    uploadedAt: Date
  }
}

export interface LegalAnalysisRequest {
  document: NormalizedDocument
  jurisdiction?: string
}

export interface RawFindingInput {
  title: string
  explanation: string
  confidence?: string
  uncertainty?: string
  evidenceQuote?: string
  startLine?: number
  endLine?: number
}

export interface RawAnalysisOutput {
  documentType: string
  summary: string
  parties: RawFindingInput[]
  dates: RawFindingInput[]
  monetaryItems: RawFindingInput[]
  rights: RawFindingInput[]
  obligations: RawFindingInput[]
  restrictions: RawFindingInput[]
  termination: RawFindingInput[]
  disputeResolution: RawFindingInput[]
  reviewPoints: RawFindingInput[]
}

export interface DocumentAnalysisResult {
  documentId: string
  documentName: string
  documentType: string
  jurisdiction: string
  summary: string
  findings: LegalFinding[]
  categories: {
    parties: LegalFinding[]
    dates: LegalFinding[]
    monetary: LegalFinding[]
    rights: LegalFinding[]
    obligations: LegalFinding[]
    restrictions: LegalFinding[]
    termination: LegalFinding[]
    dispute_resolution: LegalFinding[]
    review_points: LegalFinding[]
  }
  stats: {
    totalFindings: number
    verifiedFindingsCount: number
    unverifiedFindingsCount: number
    verificationRate: number
  }
  metadata: {
    providerId: string
    modelName: string
    analyzedAt: string
  }
}

export interface DocumentQARequest {
  document: NormalizedDocument
  question: string
  jurisdiction?: string
  targetedLines?: NormalizedDocumentLine[]
}

export interface RawQAEvidence {
  quote: string
  startLine?: number
  endLine?: number
}

export interface RawQAOutput {
  answer: string
  confidence?: string
  uncertainty?: string
  evidence: RawQAEvidence[]
}

export interface QAEvidenceItem {
  sourceText: string
  startLine: number
  endLine: number
  verificationStatus: EvidenceVerificationStatus
}

export interface DocumentQAResult {
  question: string
  answer: string
  confidence: FindingConfidence
  uncertainty?: string
  evidence: QAEvidenceItem[]
  stats: {
    totalEvidenceCount: number
    verifiedCount: number
    unverifiedCount: number
  }
  metadata: {
    providerId: string
    modelName: string
    retrievalMethod: string
    targetedLineCount: number
    answeredAt: string
  }
}

export type ComparisonDifferenceType =
  | "added"
  | "removed"
  | "modified"
  | "value_changed"
  | "unchanged"

export type ComparisonReviewStatus =
  | "review_recommended"
  | "standard_modification"
  | "neutral"

export interface DocumentComparisonRequest {
  documentA: NormalizedDocument
  documentB: NormalizedDocument
  jurisdiction?: string
  alignedContext?: string
}

export interface RawDifferenceEvidence {
  document: "A" | "B"
  quote: string
  startLine?: number
  endLine?: number
}

export interface RawDifferenceItem {
  clauseTitle: string
  clauseNumber?: string
  type: ComparisonDifferenceType
  reviewStatus: ComparisonReviewStatus
  summary: string
  explanation: string
  evidenceA?: RawDifferenceEvidence[]
  evidenceB?: RawDifferenceEvidence[]
  riskOrReviewNote?: string
}

export interface RawComparisonOutput {
  executiveSummary: string
  unchangedProvisionsSummary: string
  differences: RawDifferenceItem[]
}

export interface DifferenceEvidenceItem {
  documentId: string
  documentName: string
  sourceText: string
  startLine: number
  endLine: number
  verificationStatus: EvidenceVerificationStatus
}

export interface ComparisonDifference {
  id: string
  clauseTitle: string
  clauseNumber?: string
  type: ComparisonDifferenceType
  reviewStatus: ComparisonReviewStatus
  summary: string
  explanation: string
  evidenceA: DifferenceEvidenceItem[]
  evidenceB: DifferenceEvidenceItem[]
  riskOrReviewNote?: string
}

export interface DocumentComparisonResult {
  documentA: {
    id: string
    name: string
    lineCount: number
    wordCount?: number
  }
  documentB: {
    id: string
    name: string
    lineCount: number
    wordCount?: number
  }
  executiveSummary: string
  unchangedProvisionsSummary: string
  differences: ComparisonDifference[]
  stats: {
    totalDifferences: number
    addedCount: number
    removedCount: number
    modifiedCount: number
    valueChangedCount: number
    unchangedCount: number
    reviewRecommendedCount: number
    totalEvidenceItems: number
    verifiedEvidenceItems: number
    unverifiedEvidenceItems: number
  }
  metadata: {
    providerId: string
    modelName: string
    comparedAt: string
  }
}

export type ActionType = "review" | "verify" | "prepare" | "ask" | "track"

export type ActionPriority = "attention" | "important" | "standard"

export type ActionStatus = "open" | "reviewed" | "completed"

export interface ActionEvidenceItem {
  documentId: string
  documentName?: string
  sourceText: string
  startLine: number
  endLine: number
  verificationStatus: EvidenceVerificationStatus
}

export interface ActionItem {
  id: string
  type: ActionType
  title: string
  description: string
  whyItMatters: string
  suggestedStep?: string
  sourceEvidence: ActionEvidenceItem[]
  relatedFindingId?: string
  relatedDifferenceId?: string
  priority: ActionPriority
  status: ActionStatus
  documentDesignation?: "A" | "B" | "both"
}

export interface ActionCandidateInput {
  candidateId: string
  type: ActionType
  priority: ActionPriority
  title: string
  clauseTitle?: string
  factualSummary: string
  whyItMatters?: string
  suggestedStep?: string
  sourceDocumentId: string
  sourceDocumentName?: string
  documentDesignation?: "A" | "B" | "both"
  quote: string
  startLine: number
  endLine: number
  relatedFindingId?: string
  relatedDifferenceId?: string
}

export interface ActionGenerationRequest {
  document?: NormalizedDocument
  documentA?: NormalizedDocument
  documentB?: NormalizedDocument
  candidates: ActionCandidateInput[]
  jurisdiction?: string
  contextSummary?: string
}

export interface RawActionItemInput {
  candidateId?: string
  type: ActionType
  priority: ActionPriority
  title: string
  description: string
  whyItMatters: string
  suggestedStep?: string
  evidenceQuote?: string
  startLine?: number
  endLine?: number
  documentDesignation?: "A" | "B" | "both"
  relatedFindingId?: string
  relatedDifferenceId?: string
}

export interface RawActionGenerationOutput {
  actions: RawActionItemInput[]
}

export interface ActionGenerationResult {
  documentId?: string
  documentName?: string
  actions: ActionItem[]
  stats: {
    totalActions: number
    attentionCount: number
    importantCount: number
    standardCount: number
    byType: {
      review: number
      verify: number
      prepare: number
      ask: number
      track: number
    }
    totalEvidenceItems: number
    verifiedEvidenceItems: number
    unverifiedEvidenceItems: number
  }
  metadata: {
    providerId: string
    modelName: string
    generatedAt: string
  }
}

/**
 * Provider-agnostic interface for AI legal document analysis, Q&A, comparison, and action generation.
 * Future providers (e.g. Claude, OpenAI, custom models) can be swapped
 * without modifying workspace UI or feature logic.
 */
export interface LegalAnalysisProvider {
  readonly id: string
  readonly name: string
  readonly modelName?: string
  analyzeDocument(request: LegalAnalysisRequest): Promise<RawAnalysisOutput>
  answerQuestion?(request: DocumentQARequest): Promise<RawQAOutput>
  compareDocuments?(request: DocumentComparisonRequest): Promise<RawComparisonOutput>
  generateActions?(request: ActionGenerationRequest): Promise<RawActionGenerationOutput>
}

export type AIErrorCode =
  | "MISSING_API_KEY"
  | "RATE_LIMIT"
  | "PROVIDER_UNAVAILABLE"
  | "MALFORMED_OUTPUT"
  | "TIMEOUT"
  | "INVALID_REQUEST"
  | "UNREADABLE_DOCUMENT"
  | "INVALID_COMPARISON"
  | "FEATURE_UNSUPPORTED"

export class AIProviderError extends Error {
  readonly code: AIErrorCode
  readonly statusCode: number
  readonly retryable: boolean
  readonly userMessage: string

  constructor(
    code: AIErrorCode,
    message: string,
    userMessage: string,
    statusCode: number = 500,
    retryable: boolean = false
  ) {
    super(message)
    this.name = "AIProviderError"
    this.code = code
    this.userMessage = userMessage
    this.statusCode = statusCode
    this.retryable = retryable
  }
}

// ---------------------------------------------------------------------------
// Phase 7: Professional Preparation Pack Types
// ---------------------------------------------------------------------------

export interface PackReviewItem {
  id: string
  title: string
  whyItMatters: string
  suggestedAction?: string
  priority: ActionPriority
  actionType?: ActionType
  status?: ActionStatus
  sourceEvidence: ActionEvidenceItem[]
}

export interface PackQuestionItem {
  id: string
  question: string
  whyThisQuestion: string
  category?: string
  sourceEvidence: ActionEvidenceItem[]
}

export interface PackKeyTermItem {
  id: string
  category: "date" | "amount" | "obligation" | "notice" | "restriction" | "general"
  label: string
  value: string
  details?: string
  sourceEvidence: ActionEvidenceItem[]
}

export interface PackComparisonItem {
  id: string
  clauseTitle: string
  clauseNumber?: string
  changeType: string
  summary: string
  docAValue?: string
  docBValue?: string
  evidenceA?: DifferenceEvidenceItem[]
  evidenceB?: DifferenceEvidenceItem[]
}

export interface PackQAItem {
  id: string
  question: string
  answer: string
  confidence: FindingConfidence
  evidence: QAEvidenceItem[]
}

export interface PackEvidenceAppendixItem {
  id: string
  documentId: string
  documentName: string
  quote: string
  startLine: number
  endLine: number
  verificationStatus: EvidenceVerificationStatus
  referencedBy: string
}

export interface ProfessionalPreparationPack {
  id: string
  createdAt: string
  overview: {
    documentName: string
    documentType?: string
    jurisdiction: string
    parties?: Array<{ name: string; role?: string }>
    lineCount: number
    wordCount: number
    comparisonDocumentName?: string
    modelUsed?: string
  }
  executiveSummary: string
  reviewItems: PackReviewItem[]
  questionsToDiscuss: PackQuestionItem[]
  keyTerms: PackKeyTermItem[]
  comparisonChanges?: PackComparisonItem[]
  selectedQA?: PackQAItem[]
  evidenceAppendix: PackEvidenceAppendixItem[]
  stats: {
    totalReviewItems: number
    totalQuestions: number
    totalKeyTerms: number
    totalComparisonChanges: number
    totalEvidenceCitations: number
    verifiedCitationsCount: number
  }
  legalNotice: string
}

export interface PackGenerationRequest {
  document: UploadedDocument
  analysisResult?: DocumentAnalysisResult | null
  actions?: ActionItem[]
  comparisonResult?: DocumentComparisonResult | null
  comparisonDocB?: UploadedDocument | null
  qaHistory?: DocumentQAResult[]
  enhanceSummary?: boolean
}

export interface PackGenerationResult {
  pack: ProfessionalPreparationPack
  generatedAt: string
}

