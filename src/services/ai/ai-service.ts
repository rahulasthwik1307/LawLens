import type { UploadedDocument } from "../../types/document.ts"
import { AIProviderError } from "./types.ts"
import type {
  ActionCandidateInput,
  ActionGenerationRequest,
  ActionGenerationResult,
  ActionItem,
  ComparisonDifference,
  DocumentAnalysisResult,
  DocumentComparisonResult,
  DocumentQAResult,
  FindingCategory,
  LegalAnalysisProvider,
  LegalFinding,
  NormalizedDocument,
} from "./types.ts"
import { normalizeDocument } from "./document-normalizer.ts"
import { validateAnalysisSchema } from "./analysis-schema.ts"
import { validateQASchema } from "./qa-schema.ts"
import { validateComparisonSchema } from "./comparison-schema.ts"
import { validateActionSchema } from "./action-schema.ts"
import { retrieveTargetedContext } from "./context-retriever.ts"
import {
  verifyActionItem,
  verifyComparisonDifference,
  verifyFindingEvidence,
  verifyQAEvidence,
} from "./evidence-validator.ts"
import { buildAlignedComparisonContext } from "./clause-aligner.ts"
import {
  extractCandidatesFromDifferences,
  extractCandidatesFromFindings,
  synthesizeActionsDeterministically,
} from "./action-extractor.ts"
import { GeminiLegalAnalysisProvider } from "./providers/gemini-provider.ts"

export class LawLensAIService {
  private readonly provider: LegalAnalysisProvider

  constructor(provider?: LegalAnalysisProvider) {
    this.provider = provider || new GeminiLegalAnalysisProvider()
  }

  get providerId(): string {
    return this.provider.id
  }

  get providerName(): string {
    return this.provider.name
  }

  async analyzeDocument(
    uploadedDoc: UploadedDocument,
    jurisdiction?: string
  ): Promise<DocumentAnalysisResult> {
    // 1. Normalize document
    const normalizedDoc = normalizeDocument(uploadedDoc)

    // 2. Call provider through provider-agnostic interface
    const rawOutput = await this.provider.analyzeDocument({
      document: normalizedDoc,
      jurisdiction: jurisdiction || normalizedDoc.jurisdiction,
    })

    // 3. Schema validation via Zod
    const schemaValidation = validateAnalysisSchema(rawOutput)
    if (!schemaValidation.success || !schemaValidation.data) {
      throw new AIProviderError(
        "MALFORMED_OUTPUT",
        schemaValidation.error || "Analysis output failed schema validation",
        "We couldn't reliably structure the document analysis. Your document is still available.",
        422,
        false
      )
    }

    const validatedData = schemaValidation.data

    // 4. Grounding & Evidence validation for every category
    const categories: Record<FindingCategory, LegalFinding[]> = {
      parties: [],
      dates: [],
      monetary: [],
      rights: [],
      obligations: [],
      restrictions: [],
      termination: [],
      dispute_resolution: [],
      review_points: [],
    }

    const categoryMappings: Array<{
      category: FindingCategory
      items: typeof validatedData.parties
    }> = [
      { category: "parties", items: validatedData.parties },
      { category: "dates", items: validatedData.dates },
      { category: "monetary", items: validatedData.monetaryItems },
      { category: "rights", items: validatedData.rights },
      { category: "obligations", items: validatedData.obligations },
      { category: "restrictions", items: validatedData.restrictions },
      { category: "termination", items: validatedData.termination },
      { category: "dispute_resolution", items: validatedData.disputeResolution },
      { category: "review_points", items: validatedData.reviewPoints },
    ]

    const allFindings: LegalFinding[] = []

    for (const mapping of categoryMappings) {
      const verifiedList = mapping.items.map((rawFinding, idx) =>
        verifyFindingEvidence(rawFinding, mapping.category, normalizedDoc, idx)
      )
      categories[mapping.category] = verifiedList
      allFindings.push(...verifiedList)
    }

    // 5. Calculate evidence statistics
    const totalFindings = allFindings.length
    const verifiedFindingsCount = allFindings.filter(
      (f) => f.evidence?.verificationStatus === "verified"
    ).length
    const unverifiedFindingsCount = totalFindings - verifiedFindingsCount
    const verificationRate =
      totalFindings > 0
        ? Math.round((verifiedFindingsCount / totalFindings) * 100)
        : 100

    return {
      documentId: normalizedDoc.id,
      documentName: normalizedDoc.name,
      documentType: validatedData.documentType,
      jurisdiction: normalizedDoc.jurisdiction,
      summary: validatedData.summary,
      findings: allFindings,
      categories,
      stats: {
        totalFindings,
        verifiedFindingsCount,
        unverifiedFindingsCount,
        verificationRate,
      },
      metadata: {
        providerId: this.provider.id,
        modelName: this.provider.modelName || this.provider.name,
        analyzedAt: new Date().toISOString(),
      },
    }
  }

  async askQuestion(
    uploadedDoc: UploadedDocument,
    question: string,
    jurisdiction?: string
  ): Promise<DocumentQAResult> {
    if (!this.provider.answerQuestion) {
      throw new AIProviderError(
        "PROVIDER_UNAVAILABLE",
        "Configured AI provider does not support document Q&A.",
        "Q&A is not supported by the current AI provider configuration.",
        500,
        false
      )
    }

    // 1. Normalize document
    const normalizedDoc = normalizeDocument(uploadedDoc)

    // 2. Targeted context retrieval preserving line numbering
    const targetedContext = retrieveTargetedContext(normalizedDoc, question)

    // 3. Dispatch to provider
    const rawQAOutput = await this.provider.answerQuestion({
      document: normalizedDoc,
      question,
      jurisdiction: jurisdiction || normalizedDoc.jurisdiction,
      targetedLines: targetedContext.lines,
    })

    // 4. Schema validation
    const schemaValidation = validateQASchema(rawQAOutput)
    if (!schemaValidation.success || !schemaValidation.data) {
      throw new AIProviderError(
        "MALFORMED_OUTPUT",
        schemaValidation.error || "QA output failed schema validation",
        "We couldn't reliably format the answer. Please try again.",
        422,
        false
      )
    }

    const validatedData = schemaValidation.data

    // 5. Evidence verification against full original document
    const validatedEvidence = verifyQAEvidence(
      validatedData.evidence,
      normalizedDoc
    )

    const totalEvidenceCount = validatedEvidence.length
    const verifiedCount = validatedEvidence.filter(
      (e) => e.verificationStatus === "verified"
    ).length
    const unverifiedCount = totalEvidenceCount - verifiedCount

    // 6. Calibrate confidence based on evidence and answer phrasing
    let confidence = validatedData.confidence
    const answerLower = validatedData.answer.toLowerCase()
    const expressesMissing =
      answerLower.includes("does not specify") ||
      answerLower.includes("not specified") ||
      answerLower.includes("not contain") ||
      answerLower.includes("does not state") ||
      answerLower.includes("no provision") ||
      answerLower.includes("no mention")

    if (expressesMissing) {
      confidence = "unclear_from_document"
    } else if (
      totalEvidenceCount > 0 &&
      verifiedCount === 0 &&
      confidence === "clear_in_document"
    ) {
      confidence = "needs_review"
    }

    return {
      question: question.trim(),
      answer: validatedData.answer.trim(),
      confidence,
      uncertainty: validatedData.uncertainty?.trim() || undefined,
      evidence: validatedEvidence,
      stats: {
        totalEvidenceCount,
        verifiedCount,
        unverifiedCount,
      },
      metadata: {
        providerId: this.provider.id,
        modelName: this.provider.modelName || this.provider.name,
        retrievalMethod: targetedContext.retrievalMethod,
        targetedLineCount: targetedContext.lines.length,
        answeredAt: new Date().toISOString(),
      },
    }
  }

  async compareDocuments(
    docA: UploadedDocument,
    docB: UploadedDocument,
    jurisdiction?: string
  ): Promise<DocumentComparisonResult> {
    if (docA.id === docB.id) {
      throw new AIProviderError(
        "INVALID_COMPARISON",
        "Cannot compare a document against itself.",
        "Please select two distinct documents to compare.",
        400,
        false
      )
    }

    if (!this.provider.compareDocuments) {
      throw new AIProviderError(
        "FEATURE_UNSUPPORTED",
        `Provider ${this.provider.name} does not support document comparison.`,
        "The configured AI provider does not support document comparison.",
        501,
        false
      )
    }

    // 1. Normalize both documents
    const normalizedA = normalizeDocument(docA)
    const normalizedB = normalizeDocument(docB)

    // 2. Stage 1: Deterministic Clause Alignment
    const alignment = buildAlignedComparisonContext(normalizedA, normalizedB)

    // 3. Stage 2: Provider comparison call
    const rawOutput = await this.provider.compareDocuments({
      documentA: normalizedA,
      documentB: normalizedB,
      jurisdiction: jurisdiction || normalizedA.jurisdiction || "India",
      alignedContext: alignment.formattedContext,
    })

    // 4. Schema validation
    const schemaValidation = validateComparisonSchema(rawOutput)
    if (!schemaValidation.success || !schemaValidation.data) {
      throw new AIProviderError(
        "MALFORMED_OUTPUT",
        schemaValidation.error || "Comparison output failed schema validation",
        "We couldn't reliably structure the document comparison. Please try again.",
        422,
        false
      )
    }

    const validatedData = schemaValidation.data

    // 5. Dual Evidence Verification (Doc A & Doc B verified independently)
    const verifiedDifferences: ComparisonDifference[] = validatedData.differences.map(
      (rawDiff, idx) => verifyComparisonDifference(rawDiff, normalizedA, normalizedB, idx)
    )

    // Calculate metrics & stats
    let totalEvidenceItems = 0
    let verifiedEvidenceItems = 0
    let unverifiedEvidenceItems = 0
    let addedCount = 0
    let removedCount = 0
    let modifiedCount = 0
    let valueChangedCount = 0
    let unchangedCount = 0
    let reviewRecommendedCount = 0

    for (const diff of verifiedDifferences) {
      if (diff.type === "added") addedCount++
      else if (diff.type === "removed") removedCount++
      else if (diff.type === "modified") modifiedCount++
      else if (diff.type === "value_changed") valueChangedCount++
      else if (diff.type === "unchanged") unchangedCount++

      if (diff.reviewStatus === "review_recommended") reviewRecommendedCount++

      for (const ev of [...diff.evidenceA, ...diff.evidenceB]) {
        totalEvidenceItems++
        if (ev.verificationStatus === "verified") verifiedEvidenceItems++
        else unverifiedEvidenceItems++
      }
    }

    return {
      documentA: {
        id: normalizedA.id,
        name: normalizedA.name,
        lineCount: normalizedA.lineCount,
      },
      documentB: {
        id: normalizedB.id,
        name: normalizedB.name,
        lineCount: normalizedB.lineCount,
      },
      executiveSummary: validatedData.executiveSummary,
      unchangedProvisionsSummary: validatedData.unchangedProvisionsSummary,
      differences: verifiedDifferences,
      stats: {
        totalDifferences: verifiedDifferences.length,
        addedCount,
        removedCount,
        modifiedCount,
        valueChangedCount,
        unchangedCount,
        reviewRecommendedCount,
        totalEvidenceItems,
        verifiedEvidenceItems,
        unverifiedEvidenceItems,
      },
      metadata: {
        providerId: this.provider.id,
        modelName: this.provider.modelName || this.provider.name,
        comparedAt: new Date().toISOString(),
      },
    }
  }

  async generateActions(params: {
    document?: UploadedDocument
    documentA?: UploadedDocument
    documentB?: UploadedDocument
    findings?: LegalFinding[]
    differences?: ComparisonDifference[]
    jurisdiction?: string
  }): Promise<ActionGenerationResult> {
    let normalizedDoc: NormalizedDocument | undefined
    let normalizedA: NormalizedDocument | undefined
    let normalizedB: NormalizedDocument | undefined
    let candidates: ActionCandidateInput[] = []
    let contextSummary: string | undefined

    if (params.differences && params.documentA && params.documentB) {
      normalizedA = normalizeDocument(params.documentA)
      normalizedB = normalizeDocument(params.documentB)
      candidates = extractCandidatesFromDifferences(params.differences, normalizedA, normalizedB)
      contextSummary = `Comparison between ${normalizedA.name} and ${normalizedB.name}`
    } else if (params.findings && params.document) {
      normalizedDoc = normalizeDocument(params.document)
      candidates = extractCandidatesFromFindings(params.findings, normalizedDoc)
      contextSummary = `Document analysis of ${normalizedDoc.name}`
    } else if (params.document) {
      normalizedDoc = normalizeDocument(params.document)
      const analysis = await this.analyzeDocument(params.document, params.jurisdiction)
      candidates = extractCandidatesFromFindings(analysis.findings, normalizedDoc)
      contextSummary = `Document analysis of ${normalizedDoc.name}`
    } else if (params.documentA && params.documentB) {
      normalizedA = normalizeDocument(params.documentA)
      normalizedB = normalizeDocument(params.documentB)
      const comparison = await this.compareDocuments(params.documentA, params.documentB, params.jurisdiction)
      candidates = extractCandidatesFromDifferences(comparison.differences, normalizedA, normalizedB)
      contextSummary = `Comparison between ${normalizedA.name} and ${normalizedB.name}`
    } else {
      throw new AIProviderError(
        "INVALID_REQUEST",
        "Invalid request payload. Document and findings or differences are required.",
        "Unable to generate actions without valid document context.",
        400,
        false
      )
    }

    if (candidates.length === 0) {
      return {
        documentId: normalizedDoc?.id || normalizedA?.id,
        documentName: normalizedDoc?.name || normalizedA?.name,
        actions: [],
        stats: {
          totalActions: 0,
          attentionCount: 0,
          importantCount: 0,
          standardCount: 0,
          byType: {
            review: 0,
            verify: 0,
            prepare: 0,
            ask: 0,
            track: 0,
          },
          totalEvidenceItems: 0,
          verifiedEvidenceItems: 0,
          unverifiedEvidenceItems: 0,
        },
        metadata: {
          providerId: this.provider.id,
          modelName: this.provider.modelName || this.provider.name,
          generatedAt: new Date().toISOString(),
        },
      }
    }

    let actions: ActionItem[] = []

    if (this.provider.generateActions) {
      try {
        const rawOutput = await this.provider.generateActions({
          document: normalizedDoc,
          documentA: normalizedA,
          documentB: normalizedB,
          candidates,
          jurisdiction: params.jurisdiction || normalizedDoc?.jurisdiction || normalizedA?.jurisdiction || "India",
          contextSummary,
        })

        const validation = validateActionSchema(rawOutput)
        if (validation.success && validation.data && validation.data.actions.length > 0) {
          actions = validation.data.actions.map((raw, idx) =>
            verifyActionItem(raw, normalizedDoc || normalizedA!, normalizedB, idx)
          )
        } else {
          actions = synthesizeActionsDeterministically(candidates, normalizedDoc || normalizedA!, normalizedB)
        }
      } catch (err: unknown) {
        if (err instanceof AIProviderError && err.code === "MISSING_API_KEY") {
          throw err
        }
        actions = synthesizeActionsDeterministically(candidates, normalizedDoc || normalizedA!, normalizedB)
      }
    } else {
      actions = synthesizeActionsDeterministically(candidates, normalizedDoc || normalizedA!, normalizedB)
    }

    let attentionCount = 0
    let importantCount = 0
    let standardCount = 0
    const byType = {
      review: 0,
      verify: 0,
      prepare: 0,
      ask: 0,
      track: 0,
    }
    let totalEvidenceItems = 0
    let verifiedEvidenceItems = 0
    let unverifiedEvidenceItems = 0

    for (const act of actions) {
      if (act.priority === "attention") attentionCount++
      else if (act.priority === "important") importantCount++
      else standardCount++

      if (act.type in byType) {
        byType[act.type]++
      }

      for (const ev of act.sourceEvidence) {
        totalEvidenceItems++
        if (ev.verificationStatus === "verified") verifiedEvidenceItems++
        else unverifiedEvidenceItems++
      }
    }

    return {
      documentId: normalizedDoc?.id || normalizedA?.id,
      documentName: normalizedDoc?.name || normalizedA?.name,
      actions,
      stats: {
        totalActions: actions.length,
        attentionCount,
        importantCount,
        standardCount,
        byType,
        totalEvidenceItems,
        verifiedEvidenceItems,
        unverifiedEvidenceItems,
      },
      metadata: {
        providerId: this.provider.id,
        modelName: this.provider.modelName || this.provider.name,
        generatedAt: new Date().toISOString(),
      },
    }
  }
}

// Default singleton instance
export const aiService = new LawLensAIService()
