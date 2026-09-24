import type { UploadedDocument } from "../../types/document.ts"
import type {
  ActionItem,
  DocumentAnalysisResult,
  DocumentComparisonResult,
  DocumentQAResult,
  PackComparisonItem,
  PackEvidenceAppendixItem,
  PackKeyTermItem,
  PackQAItem,
  PackQuestionItem,
  PackReviewItem,
  ProfessionalPreparationPack,
} from "./types.ts"

export interface PackComposerParams {
  document: UploadedDocument
  analysisResult?: DocumentAnalysisResult | null
  actions?: ActionItem[]
  comparisonResult?: DocumentComparisonResult | null
  comparisonDocB?: UploadedDocument | null
  qaHistory?: DocumentQAResult[]
  customSummary?: string
}

export function composePreparationPack(params: {
  document: UploadedDocument
  analysisResult?: DocumentAnalysisResult | null
  actions?: ActionItem[]
  comparisonResult?: DocumentComparisonResult | null
  comparisonDocB?: UploadedDocument | null
  qaHistory?: DocumentQAResult[]
  customSummary?: string
}): ProfessionalPreparationPack {
  const {
    document,
    analysisResult,
    actions = [],
    comparisonResult,
    comparisonDocB,
    qaHistory = [],
    customSummary,
  } = params

  const packId = `pack_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const createdAt = new Date().toISOString()

  // 1. Overview
  const parties = analysisResult?.categories?.parties?.map((p) => ({
    name: p.title,
    role: p.explanation || undefined,
  })) || []

  const overview = {
    documentName: document.name,
    documentType: analysisResult?.documentType || (document.name.toLowerCase().includes("lease") ? "Commercial Lease Agreement" : "Legal Document"),
    jurisdiction: document.jurisdiction || "India",
    parties,
    lineCount: document.lineCount,
    wordCount: document.wordCount,
    comparisonDocumentName: comparisonDocB?.name || undefined,
    modelUsed: analysisResult?.metadata?.modelName || "LawLens Evidence Engine",
  }

  // 2. Executive Summary
  let executiveSummary = ""
  if (customSummary && customSummary.trim().length > 0) {
    executiveSummary = customSummary.trim()
  } else if (analysisResult?.summary) {
    executiveSummary = analysisResult.summary
    if (comparisonResult?.executiveSummary) {
      executiveSummary += `\n\nComparative Analysis: ${comparisonResult.executiveSummary}`
    }
  } else if (actions.length > 0) {
    const attentionActions = actions.filter((a) => a.priority === "attention")
    executiveSummary = `This preparation briefing consolidates ${actions.length} verified review points and operational action items extracted from ${document.name}.`
    if (attentionActions.length > 0) {
      executiveSummary += ` Note that ${attentionActions.length} item(s) require specific attention prior to consultation.`
    }
    if (comparisonResult) {
      executiveSummary += ` A dual-document comparison against ${comparisonDocB?.name || "Document B"} identified ${comparisonResult.differences.length} structural differences.`
    }
  } else {
    executiveSummary = `Preparation pack for ${document.name} (${document.lineCount} lines, jurisdiction: ${document.jurisdiction || "India"}). Document structure and text have been processed. Review the sections below for evidence-grounded findings.`
  }

  // 3. Items to Review (from Actions and Findings)
  const reviewItems: PackReviewItem[] = []

  if (actions.length > 0) {
    const candidateActions = actions.filter(
      (a) => a.type === "review" || a.type === "verify" || a.type === "prepare" || a.priority === "attention"
    )

    for (const act of candidateActions) {
      reviewItems.push({
        id: `rev_${act.id}`,
        title: act.title,
        whyItMatters: act.whyItMatters,
        suggestedAction: act.suggestedStep,
        priority: act.priority,
        actionType: act.type,
        status: act.status,
        sourceEvidence: act.sourceEvidence,
      })
    }
  }

  // Fallback to Phase 3 findings if actions were not generated
  if (reviewItems.length === 0 && analysisResult?.categories) {
    const findingSources = [
      ...(analysisResult.categories.review_points || []),
      ...(analysisResult.categories.termination || []),
      ...(analysisResult.categories.restrictions || []),
    ]

    for (let idx = 0; idx < findingSources.length; idx++) {
      const f = findingSources[idx]
      reviewItems.push({
        id: `rev_finding_${idx}`,
        title: f.title,
        whyItMatters: f.explanation,
        priority: f.confidence === "needs_review" ? "attention" : "important",
        actionType: "review",
        status: "open",
        sourceEvidence: f.evidence
          ? [
              {
                documentId: document.id,
                documentName: document.name,
                sourceText: f.evidence.sourceText,
                startLine: f.evidence.startLine,
                endLine: f.evidence.endLine,
                verificationStatus: f.evidence.verificationStatus,
              },
            ]
          : [],
      })
    }
  }

  // 4. Questions to Discuss (from Ask Actions and Review Clarifications)
  const questionsToDiscuss: PackQuestionItem[] = []

  if (actions.length > 0) {
    const askActions = actions.filter((a) => a.type === "ask")
    for (const act of askActions) {
      questionsToDiscuss.push({
        id: `q_${act.id}`,
        question: act.title,
        whyThisQuestion: act.whyItMatters,
        sourceEvidence: act.sourceEvidence,
        category: "Contract Clarification",
      })
    }
  }

  // If no ask actions found, convert any ambiguous or unverified review points into questions
  if (questionsToDiscuss.length === 0 && analysisResult?.categories?.review_points) {
    const ambiguousPoints = analysisResult.categories.review_points.filter(
      (rp) => rp.confidence === "needs_review" || rp.confidence === "unclear_from_document"
    )

    for (let idx = 0; idx < ambiguousPoints.length; idx++) {
      const pt = ambiguousPoints[idx]
      questionsToDiscuss.push({
        id: `q_finding_${idx}`,
        question: `Clarification on ${pt.title}`,
        whyThisQuestion: pt.explanation,
        category: "Clause Inquiry",
        sourceEvidence: pt.evidence
          ? [
              {
                documentId: document.id,
                documentName: document.name,
                sourceText: pt.evidence.sourceText,
                startLine: pt.evidence.startLine,
                endLine: pt.evidence.endLine,
                verificationStatus: pt.evidence.verificationStatus,
              },
            ]
          : [],
      })
    }
  }

  // 5. Key Terms (Amounts, Dates, Obligations, Notice/Termination)
  const keyTerms: PackKeyTermItem[] = []

  if (analysisResult?.categories) {
    // Monetary Items
    const monetary = analysisResult.categories.monetary || []
    for (let i = 0; i < monetary.length; i++) {
      const m = monetary[i]
      keyTerms.push({
        id: `kt_mon_${i}`,
        category: "amount",
        label: "Payment / Monetary Obligation",
        value: m.title,
        details: m.explanation,
        sourceEvidence: m.evidence
          ? [
              {
                documentId: document.id,
                documentName: document.name,
                sourceText: m.evidence.sourceText,
                startLine: m.evidence.startLine,
                endLine: m.evidence.endLine,
                verificationStatus: m.evidence.verificationStatus,
              },
            ]
          : [],
      })
    }

    // Dates & Deadlines
    const dates = analysisResult.categories.dates || []
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i]
      keyTerms.push({
        id: `kt_date_${i}`,
        category: "date",
        label: "Key Date / Timeline",
        value: d.title,
        details: d.explanation,
        sourceEvidence: d.evidence
          ? [
              {
                documentId: document.id,
                documentName: document.name,
                sourceText: d.evidence.sourceText,
                startLine: d.evidence.startLine,
                endLine: d.evidence.endLine,
                verificationStatus: d.evidence.verificationStatus,
              },
            ]
          : [],
      })
    }

    // Key Obligations (limit to top 4)
    const obligations = analysisResult.categories.obligations || []
    for (let i = 0; i < Math.min(4, obligations.length); i++) {
      const o = obligations[i]
      keyTerms.push({
        id: `kt_ob_${i}`,
        category: "obligation",
        label: "Covenant / Duty",
        value: o.title,
        details: o.explanation,
        sourceEvidence: o.evidence
          ? [
              {
                documentId: document.id,
                documentName: document.name,
                sourceText: o.evidence.sourceText,
                startLine: o.evidence.startLine,
                endLine: o.evidence.endLine,
                verificationStatus: o.evidence.verificationStatus,
              },
            ]
          : [],
      })
    }

    // Key Restrictions
    const restrictions = analysisResult.categories.restrictions || []
    for (let i = 0; i < Math.min(3, restrictions.length); i++) {
      const r = restrictions[i]
      keyTerms.push({
        id: `kt_res_${i}`,
        category: "restriction",
        label: "Prohibition / Restrictive Clause",
        value: r.title,
        details: r.explanation,
        sourceEvidence: r.evidence
          ? [
              {
                documentId: document.id,
                documentName: document.name,
                sourceText: r.evidence.sourceText,
                startLine: r.evidence.startLine,
                endLine: r.evidence.endLine,
                verificationStatus: r.evidence.verificationStatus,
              },
            ]
          : [],
      })
    }
  } else if (actions.length > 0) {
    // If findings are not directly provided, extract from track actions
    const trackActions = actions.filter((a) => a.type === "track")
    for (let i = 0; i < trackActions.length; i++) {
      const t = trackActions[i]
      keyTerms.push({
        id: `kt_track_${i}`,
        category: "date",
        label: "Tracked Obligation / Notice",
        value: t.title,
        details: t.whyItMatters,
        sourceEvidence: t.sourceEvidence,
      })
    }
  }

  // 6. Comparison Changes (if Phase 5 comparison exists)
  let comparisonChanges: PackComparisonItem[] | undefined = undefined

  if (comparisonResult && comparisonResult.differences.length > 0) {
    comparisonChanges = comparisonResult.differences.map((d) => ({
      id: d.id,
      clauseTitle: d.clauseTitle,
      clauseNumber: d.clauseNumber,
      changeType: d.type,
      summary: d.summary,
      evidenceA: d.evidenceA,
      evidenceB: d.evidenceB,
    }))
  }

  // 7. Selected Q&A (only evidence-grounded queries)
  let selectedQA: PackQAItem[] | undefined = undefined

  if (qaHistory && qaHistory.length > 0) {
    const groundedQA = qaHistory.filter(
      (q) =>
        q.evidence &&
        q.evidence.some((e) => e.verificationStatus === "verified") &&
        (q.confidence === "clear_in_document" || q.confidence === "supported_by_source")
    )

    if (groundedQA.length > 0) {
      selectedQA = groundedQA.map((q, idx) => ({
        id: `qa_item_${idx}`,
        question: q.question,
        answer: q.answer,
        confidence: q.confidence,
        evidence: q.evidence,
      }))
    }
  }

  // 8. Evidence Appendix (deduplicate and collect verified citations)
  const evidenceAppendix: PackEvidenceAppendixItem[] = []
  const seenCitations = new Set<string>()

  function addEvidenceItem(
    item: {
      documentId: string
      documentName?: string
      sourceText: string
      startLine: number
      endLine: number
      verificationStatus: "verified" | "unverified" | "not_found"
    },
    referencedBy: string
  ) {
    if (!item.sourceText || !item.startLine || !item.endLine) return
    const docName = item.documentName || document.name
    const key = `${item.documentId}:${item.startLine}-${item.endLine}:${item.sourceText.trim()}`
    if (seenCitations.has(key)) return
    seenCitations.add(key)

    evidenceAppendix.push({
      id: `ev_${evidenceAppendix.length + 1}`,
      documentId: item.documentId,
      documentName: docName,
      quote: item.sourceText.trim(),
      startLine: item.startLine,
      endLine: item.endLine,
      verificationStatus: item.verificationStatus,
      referencedBy,
    })
  }

  // Collect from Review Items
  for (const rev of reviewItems) {
    for (const ev of rev.sourceEvidence) {
      addEvidenceItem(ev, `Review Item: ${rev.title}`)
    }
  }

  // Collect from Questions
  for (const q of questionsToDiscuss) {
    for (const ev of q.sourceEvidence) {
      addEvidenceItem(ev, `Question: ${q.question}`)
    }
  }

  // Collect from Key Terms
  for (const kt of keyTerms) {
    for (const ev of kt.sourceEvidence) {
      addEvidenceItem(ev, `Key Term: ${kt.label} (${kt.value})`)
    }
  }

  // Collect from Comparison Changes
  if (comparisonChanges) {
    for (const comp of comparisonChanges) {
      if (comp.evidenceA) {
        for (const ev of comp.evidenceA) {
          addEvidenceItem(
            ev,
            `Comparison (Doc A): ${comp.clauseTitle}`
          )
        }
      }
      if (comp.evidenceB) {
        for (const ev of comp.evidenceB) {
          addEvidenceItem(
            ev,
            `Comparison (Doc B): ${comp.clauseTitle}`
          )
        }
      }
    }
  }

  // Collect from Q&A
  if (selectedQA) {
    for (const qa of selectedQA) {
      for (const ev of qa.evidence) {
        addEvidenceItem(
          {
            documentId: document.id,
            documentName: document.name,
            sourceText: ev.sourceText,
            startLine: ev.startLine,
            endLine: ev.endLine,
            verificationStatus: ev.verificationStatus,
          },
          `Q&A: ${qa.question}`
        )
      }
    }
  }

  // Sort evidence appendix sequentially by line number
  evidenceAppendix.sort((a, b) => {
    if (a.documentId !== b.documentId) {
      return a.documentId.localeCompare(b.documentId)
    }
    return a.startLine - b.startLine
  })

  // 9. Stats
  const stats = {
    totalReviewItems: reviewItems.length,
    totalQuestions: questionsToDiscuss.length,
    totalKeyTerms: keyTerms.length,
    totalComparisonChanges: comparisonChanges?.length || 0,
    totalEvidenceCitations: evidenceAppendix.length,
    verifiedCitationsCount: evidenceAppendix.filter((e) => e.verificationStatus === "verified").length,
  }

  // 10. Legal Notice
  const legalNotice =
    "This preparation pack is an information and organization aid compiled by LawLens from verified document evidence. It does not constitute legal advice, a legal opinion, or an attorney-client relationship. LawLens does not represent any party or guarantee legal outcomes. Consult a licensed legal professional, advocate, or qualified advisor for legal advice."

  return {
    id: packId,
    createdAt,
    overview,
    executiveSummary,
    reviewItems,
    questionsToDiscuss,
    keyTerms,
    comparisonChanges,
    selectedQA,
    evidenceAppendix,
    stats,
    legalNotice,
  }
}
