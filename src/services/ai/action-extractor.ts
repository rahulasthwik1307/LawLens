import type {
  ActionCandidateInput,
  ActionItem,
  ComparisonDifference,
  LegalFinding,
  NormalizedDocument,
} from "./types.ts"

/**
 * Extracts candidate action triggers deterministically from verified Phase 3 findings.
 * Identifies time-sensitive dates, deposit verifications, documentation requirements,
 * termination conditions, and review points without model hallucination.
 */
export function extractCandidatesFromFindings(
  findings: LegalFinding[],
  document: NormalizedDocument
): ActionCandidateInput[] {
  const candidates: ActionCandidateInput[] = []
  let counter = 1

  for (const finding of findings) {
    const titleLower = finding.title.toLowerCase()
    const explLower = finding.explanation.toLowerCase()
    const quote = finding.evidence?.sourceText || ""
    const startLine = finding.evidence?.startLine || 1
    const endLine = finding.evidence?.endLine || startLine

    // Trigger 1: Termination & Notice Periods -> REVIEW or TRACK
    if (finding.category === "termination") {
      const isDateRelated =
        titleLower.includes("notice") ||
        titleLower.includes("day") ||
        titleLower.includes("month") ||
        explLower.includes("days' notice") ||
        explLower.includes("notice period")

      candidates.push({
        candidateId: `cand_finding_${counter++}`,
        type: isDateRelated ? "track" : "review",
        priority: "attention",
        title: isDateRelated
          ? `Track termination notice requirement`
          : `Review termination conditions`,
        clauseTitle: finding.title,
        factualSummary: finding.explanation,
        whyItMatters: isDateRelated
          ? "Notice requirements must be satisfied strictly according to the contract timeline to avoid unintended extension or forfeiture."
          : "Termination clauses dictate how and under what conditions the agreement can end early.",
        suggestedStep: isDateRelated
          ? "Check whether the stated notice window aligns with your operational expectations."
          : "Consider reviewing these termination conditions with a qualified professional.",
        sourceDocumentId: document.id,
        sourceDocumentName: document.name,
        quote,
        startLine,
        endLine,
        relatedFindingId: finding.id,
      })
      continue
    }

    // Trigger 2: Dates, Deadlines, Escalations -> TRACK
    if (finding.category === "dates") {
      const isShortDeadline =
        titleLower.includes("notice") ||
        titleLower.includes("grace") ||
        explLower.includes("immediate") ||
        explLower.includes("7 days") ||
        explLower.includes("15 days")

      candidates.push({
        candidateId: `cand_finding_${counter++}`,
        type: "track",
        priority: isShortDeadline ? "attention" : "important",
        title: `Track: ${finding.title}`,
        clauseTitle: finding.title,
        factualSummary: finding.explanation,
        whyItMatters: "Missing contractual deadlines or notice milestones can impact rights or incur financial consequences.",
        suggestedStep: "Record this milestone and set an operational reminder in advance.",
        sourceDocumentId: document.id,
        sourceDocumentName: document.name,
        quote,
        startLine,
        endLine,
        relatedFindingId: finding.id,
      })
      continue
    }

    // Trigger 3: Monetary Terms & Deposits -> VERIFY
    if (finding.category === "monetary") {
      const isDeposit =
        titleLower.includes("deposit") ||
        titleLower.includes("security") ||
        explLower.includes("security deposit")

      candidates.push({
        candidateId: `cand_finding_${counter++}`,
        type: "verify",
        priority: isDeposit ? "attention" : "important",
        title: isDeposit
          ? `Verify security deposit amount and refund conditions`
          : `Verify monetary obligation: ${finding.title}`,
        clauseTitle: finding.title,
        factualSummary: finding.explanation,
        whyItMatters: isDeposit
          ? "Security deposit terms govern fund preservation, interest, and the conditions for timely return at expiration."
          : "Monetary covenants must match agreed commercial negotiations and billing terms.",
        suggestedStep: isDeposit
          ? "Verify that the stated deposit matches the term sheet and check the refund timeline."
          : "Confirm that billing frequency and payment deadlines match agreed commercial terms.",
        sourceDocumentId: document.id,
        sourceDocumentName: document.name,
        quote,
        startLine,
        endLine,
        relatedFindingId: finding.id,
      })
      continue
    }

    // Trigger 4: Documentation / Statutory Requirements -> PREPARE
    if (finding.category === "obligations") {
      const isDocumentGathering =
        explLower.includes("insurance") ||
        explLower.includes("certificate") ||
        explLower.includes("license") ||
        explLower.includes("permit") ||
        explLower.includes("noc") ||
        explLower.includes("statutory") ||
        explLower.includes("registration") ||
        titleLower.includes("insurance")

      if (isDocumentGathering) {
        candidates.push({
          candidateId: `cand_finding_${counter++}`,
          type: "prepare",
          priority: "important",
          title: `Prepare referenced documentation: ${finding.title}`,
          clauseTitle: finding.title,
          factualSummary: finding.explanation,
          whyItMatters: "Contracts frequently condition performance or handover on presenting valid licenses or insurance certificates.",
          suggestedStep: "Gather the referenced documentation or certificates before the stipulated deadline.",
          sourceDocumentId: document.id,
          sourceDocumentName: document.name,
          quote,
          startLine,
          endLine,
          relatedFindingId: finding.id,
        })
        continue
      }

      // Operational maintenance or recurring duties -> ASK or REVIEW
      const isMaintenance =
        explLower.includes("maintenance") ||
        explLower.includes("repair") ||
        explLower.includes("hvac") ||
        explLower.includes("electrical")

      if (isMaintenance) {
        candidates.push({
          candidateId: `cand_finding_${counter++}`,
          type: "ask",
          priority: "important",
          title: `Clarify maintenance and upkeep responsibilities`,
          clauseTitle: finding.title,
          factualSummary: finding.explanation,
          whyItMatters: "Maintenance obligations define which party absorbs recurring operational expenses.",
          suggestedStep: "Ask the counterparty to clarify the exact boundary between tenant upkeep and landlord structural repairs.",
          sourceDocumentId: document.id,
          sourceDocumentName: document.name,
          quote,
          startLine,
          endLine,
          relatedFindingId: finding.id,
        })
        continue
      }

      // Standard obligation
      candidates.push({
        candidateId: `cand_finding_${counter++}`,
        type: "review",
        priority: "standard",
        title: `Review obligation: ${finding.title}`,
        clauseTitle: finding.title,
        factualSummary: finding.explanation,
        whyItMatters: "Understanding explicit contractual obligations ensures compliance and prevents breach notices.",
        suggestedStep: "Review whether your operational team is equipped to fulfill this obligation.",
        sourceDocumentId: document.id,
        sourceDocumentName: document.name,
        quote,
        startLine,
        endLine,
        relatedFindingId: finding.id,
      })
      continue
    }

    // Trigger 5: Restrictions -> REVIEW or ASK
    if (finding.category === "restrictions") {
      candidates.push({
        candidateId: `cand_finding_${counter++}`,
        type: "review",
        priority: "important",
        title: `Review restriction: ${finding.title}`,
        clauseTitle: finding.title,
        factualSummary: finding.explanation,
        whyItMatters: "Restrictive covenants limit permitted activities, structural alterations, or assignment rights.",
        suggestedStep: "Check whether this restriction conflicts with planned operations or subletting needs.",
        sourceDocumentId: document.id,
        sourceDocumentName: document.name,
        quote,
        startLine,
        endLine,
        relatedFindingId: finding.id,
      })
      continue
    }

    // Trigger 6: Review Points & Ambiguities -> ASK
    if (finding.category === "review_points") {
      candidates.push({
        candidateId: `cand_finding_${counter++}`,
        type: "ask",
        priority: "attention",
        title: `Clarify: ${finding.title}`,
        clauseTitle: finding.title,
        factualSummary: finding.explanation,
        whyItMatters: "Ambiguous provisions or unilateral clauses present commercial uncertainty and merit discussion.",
        suggestedStep: "Discuss this point with the other party or a qualified legal advisor before signing.",
        sourceDocumentId: document.id,
        sourceDocumentName: document.name,
        quote,
        startLine,
        endLine,
        relatedFindingId: finding.id,
      })
      continue
    }

    // Trigger 7: Dispute Resolution -> VERIFY
    if (finding.category === "dispute_resolution") {
      candidates.push({
        candidateId: `cand_finding_${counter++}`,
        type: "verify",
        priority: "standard",
        title: `Verify dispute resolution forum and jurisdiction`,
        clauseTitle: finding.title,
        factualSummary: finding.explanation,
        whyItMatters: "Governing law and arbitration seats determine the legal venue and cost if a formal dispute arises.",
        suggestedStep: "Check whether the chosen jurisdiction and arbitration rules are acceptable to all parties.",
        sourceDocumentId: document.id,
        sourceDocumentName: document.name,
        quote,
        startLine,
        endLine,
        relatedFindingId: finding.id,
      })
    }
  }

  return candidates
}

/**
 * Extracts candidate action triggers deterministically from Phase 5 comparison differences.
 * Emphasizes changed amounts, added obligations, removed protections, and altered notice timelines.
 */
export function extractCandidatesFromDifferences(
  differences: ComparisonDifference[],
  docA: NormalizedDocument,
  docB: NormalizedDocument
): ActionCandidateInput[] {
  const candidates: ActionCandidateInput[] = []
  let counter = 1

  for (const diff of differences) {
    if (diff.type === "unchanged") continue

    const evA = diff.evidenceA[0]
    const evB = diff.evidenceB[0]
    const primaryQuote = evB?.sourceText || evA?.sourceText || ""
    const primaryStart = evB?.startLine || evA?.startLine || 1
    const primaryEnd = evB?.endLine || evA?.endLine || primaryStart
    const docId = evB ? docB.id : docA.id
    const docName = evB ? docB.name : docA.name
    const isHighReview = diff.reviewStatus === "review_recommended"

    // Difference Type 1: value_changed -> VERIFY
    if (diff.type === "value_changed") {
      candidates.push({
        candidateId: `cand_diff_${counter++}`,
        type: "verify",
        priority: "attention",
        title: `Verify revised ${diff.clauseTitle}`,
        clauseTitle: diff.clauseTitle,
        factualSummary: diff.explanation,
        whyItMatters: diff.riskOrReviewNote || "Numerical changes directly alter financial commitments, security amounts, or timelines.",
        suggestedStep: "Verify whether this revised figure matches the agreed business negotiations.",
        sourceDocumentId: docId,
        sourceDocumentName: docName,
        documentDesignation: evA && evB ? "both" : evB ? "B" : "A",
        quote: primaryQuote,
        startLine: primaryStart,
        endLine: primaryEnd,
        relatedDifferenceId: diff.id,
      })
      continue
    }

    // Difference Type 2: added -> ASK or REVIEW
    if (diff.type === "added") {
      candidates.push({
        candidateId: `cand_diff_${counter++}`,
        type: "ask",
        priority: isHighReview ? "attention" : "important",
        title: `Ask why revised draft introduces ${diff.clauseTitle}`,
        clauseTitle: diff.clauseTitle,
        factualSummary: diff.explanation,
        whyItMatters: diff.riskOrReviewNote || "New clauses introduce covenants or liability not present in the earlier draft.",
        suggestedStep: "Ask the other party for the rationale behind introducing this new provision.",
        sourceDocumentId: docB.id,
        sourceDocumentName: docB.name,
        documentDesignation: "B",
        quote: evB?.sourceText || "",
        startLine: evB?.startLine || 1,
        endLine: evB?.endLine || 1,
        relatedDifferenceId: diff.id,
      })
      continue
    }

    // Difference Type 3: removed -> REVIEW
    if (diff.type === "removed") {
      candidates.push({
        candidateId: `cand_diff_${counter++}`,
        type: "review",
        priority: "attention",
        title: `Review removal of ${diff.clauseTitle}`,
        clauseTitle: diff.clauseTitle,
        factualSummary: diff.explanation,
        whyItMatters: diff.riskOrReviewNote || "The omission of this provision removes rights or protections present in the original draft.",
        suggestedStep: "Confirm whether the deletion was intentional or whether reinstatement should be requested.",
        sourceDocumentId: docA.id,
        sourceDocumentName: docA.name,
        documentDesignation: "A",
        quote: evA?.sourceText || "",
        startLine: evA?.startLine || 1,
        endLine: evA?.endLine || 1,
        relatedDifferenceId: diff.id,
      })
      continue
    }

    // Difference Type 4: modified -> REVIEW
    if (diff.type === "modified") {
      candidates.push({
        candidateId: `cand_diff_${counter++}`,
        type: "review",
        priority: isHighReview ? "attention" : "standard",
        title: `Review modifications to ${diff.clauseTitle}`,
        clauseTitle: diff.clauseTitle,
        factualSummary: diff.explanation,
        whyItMatters: diff.riskOrReviewNote || "Language modifications may reallocate risk or adjust procedural obligations between parties.",
        suggestedStep: "Compare the specific wording changes and discuss their impact with the counterparty.",
        sourceDocumentId: docId,
        sourceDocumentName: docName,
        documentDesignation: evA && evB ? "both" : evB ? "B" : "A",
        quote: primaryQuote,
        startLine: primaryStart,
        endLine: primaryEnd,
        relatedDifferenceId: diff.id,
      })
    }
  }

  return candidates
}

/**
 * Deterministically synthesizes candidate items into ActionItem objects.
 * Used as a zero-hallucination baseline or when model synthesis is bypassed.
 */
export function synthesizeActionsDeterministically(
  candidates: ActionCandidateInput[],
  docA: NormalizedDocument,
  docB?: NormalizedDocument
): ActionItem[] {
  return candidates.map((cand, index) => {
    const isDocB = cand.documentDesignation === "B" && docB
    const targetDoc = isDocB ? docB : docA

    return {
      id: `action_${cand.type}_${index + 1}_${Math.random().toString(36).substring(2, 6)}`,
      type: cand.type,
      priority: cand.priority,
      title: cand.title,
      description: cand.factualSummary,
      whyItMatters: cand.whyItMatters || "This provision may impact contractual obligations or risk allocation.",
      suggestedStep: cand.suggestedStep || "Consider reviewing this clause with a qualified professional.",
      status: "open",
      relatedFindingId: cand.relatedFindingId,
      relatedDifferenceId: cand.relatedDifferenceId,
      documentDesignation: cand.documentDesignation,
      sourceEvidence: [
        {
          documentId: targetDoc.id,
          documentName: targetDoc.name,
          sourceText: cand.quote,
          startLine: cand.startLine,
          endLine: cand.endLine,
          verificationStatus: cand.quote.trim().length > 0 ? "verified" : "unverified",
        },
      ],
    }
  })
}
