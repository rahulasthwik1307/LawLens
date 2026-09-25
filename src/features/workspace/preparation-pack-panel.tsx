"use client"

import * as React from "react"
import {
  Printer,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  ExternalLink,
  ShieldCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  Clock,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  Scale,
  GitCompare,
  ArrowRight,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UploadedDocument } from "@/types/document"
import type {
  ActionItem,
  DocumentAnalysisResult,
  DocumentComparisonResult,
  DocumentQAResult,
  ProfessionalPreparationPack,
} from "@/services/ai/types"
import { composePreparationPack } from "@/services/ai/pack-composer"

interface PreparationPackPanelProps {
  currentDocument: UploadedDocument
  analysisResult?: DocumentAnalysisResult | null
  actions?: ActionItem[]
  comparisonResult?: DocumentComparisonResult | null
  comparisonDocB?: UploadedDocument | null
  qaHistory?: DocumentQAResult[]
  onSelectEvidence: (params: {
    document?: UploadedDocument
    startLine: number
    endLine: number
    sourceText: string
  }) => void
  onActiveViewerDocChange?: (doc: UploadedDocument) => void
  onNavigateToMode?: (mode: "findings" | "qa" | "compare" | "actions" | "connect") => void
}

export function PreparationPackPanel({
  currentDocument,
  analysisResult,
  actions = [],
  comparisonResult,
  comparisonDocB,
  qaHistory = [],
  onSelectEvidence,
  onActiveViewerDocChange,
  onNavigateToMode,
}: PreparationPackPanelProps) {
  const [pack, setPack] = React.useState<ProfessionalPreparationPack | null>(() => {
    try {
      return composePreparationPack({
        document: currentDocument,
        analysisResult,
        actions,
        comparisonResult,
        comparisonDocB,
        qaHistory,
      })
    } catch {
      return null
    }
  })
  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState<"all" | "review" | "questions" | "terms" | "changes" | "evidence">("all")
  const [expandedAppendix, setExpandedAppendix] = React.useState(false)

  // Re-compose pack whenever inputs change
  React.useEffect(() => {
    try {
      const composed = composePreparationPack({
        document: currentDocument,
        analysisResult,
        actions,
        comparisonResult,
        comparisonDocB,
        qaHistory,
      })
      if (composed) {
        setPack((prev) => (JSON.stringify(prev?.stats) !== JSON.stringify(composed.stats) ? composed : prev))
      }
    } catch {
      // Fallback
    }
  }, [currentDocument, analysisResult, actions, comparisonResult, comparisonDocB, qaHistory])

  const handlePrint = () => {
    window.print()
  }

  const handleCopyBriefing = async () => {
    if (!pack) return
    let text = `# LawLens Professional Preparation Pack\n`
    text += `Document: ${pack.overview.documentName}\n`
    text += `Jurisdiction: ${pack.overview.jurisdiction}\n`
    text += `Generated: ${new Date(pack.createdAt).toLocaleDateString()}\n\n`
    text += `## Executive Summary\n${pack.executiveSummary}\n\n`

    if (pack.reviewItems.length > 0) {
      text += `## Items to Review (${pack.reviewItems.length})\n`
      pack.reviewItems.forEach((item, idx) => {
        text += `${idx + 1}. [${item.priority.toUpperCase()}] ${item.title}\n`
        text += `   Why it matters: ${item.whyItMatters}\n`
        if (item.suggestedAction) text += `   Suggested step: ${item.suggestedAction}\n`
        if (item.sourceEvidence.length > 0) {
          const ev = item.sourceEvidence[0]
          text += `   Source: ${ev.documentName}, Lines ${ev.startLine}–${ev.endLine} ("${ev.sourceText}")\n`
        }
        text += `\n`
      })
    }

    if (pack.questionsToDiscuss.length > 0) {
      text += `## Questions to Ask (${pack.questionsToDiscuss.length})\n`
      pack.questionsToDiscuss.forEach((q, idx) => {
        text += `${idx + 1}. ${q.question}\n`
        text += `   Rationale: ${q.whyThisQuestion}\n`
        if (q.sourceEvidence.length > 0) {
          const ev = q.sourceEvidence[0]
          text += `   Source: ${ev.documentName}, Lines ${ev.startLine}–${ev.endLine}\n`
        }
        text += `\n`
      })
    }

    if (pack.keyTerms.length > 0) {
      text += `## Key Terms & Obligations\n`
      pack.keyTerms.forEach((kt) => {
        text += `- ${kt.label}: ${kt.value}`
        if (kt.details) text += ` — ${kt.details}`
        text += `\n`
      })
      text += `\n`
    }

    if (pack.comparisonChanges && pack.comparisonChanges.length > 0) {
      text += `## Document Comparison (${pack.comparisonChanges.length} Differences)\n`
      pack.comparisonChanges.forEach((ch, idx) => {
        text += `${idx + 1}. ${ch.clauseTitle}: ${ch.summary}\n`
        if (ch.docAValue) text += `   Document A: ${ch.docAValue}\n`
        if (ch.docBValue) text += `   Document B: ${ch.docBValue}\n`
        text += `\n`
      })
    }

    text += `## Legal Boundary Notice\n${pack.legalNotice}\n`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleRecompose = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/documents/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: currentDocument,
          analysisResult,
          actions,
          comparisonResult,
          comparisonDocB,
          qaHistory,
        }),
      })
      const data = await res.json()
      if (data.success && data.pack) {
        setPack(data.pack)
      } else {
        const composed = composePreparationPack({
          document: currentDocument,
          analysisResult,
          actions,
          comparisonResult,
          comparisonDocB,
          qaHistory,
        })
        setPack(composed)
      }
    } catch {
      const composed = composePreparationPack({
        document: currentDocument,
        analysisResult,
        actions,
        comparisonResult,
        comparisonDocB,
        qaHistory,
      })
      setPack(composed)
    } finally {
      setLoading(false)
    }
  }

  if (!pack) {
    return (
      <div className="rounded-xl border border-border/80 bg-card p-6 md:p-8 space-y-5 shadow-2xs">
        <div className="flex items-center gap-2 text-ink-primary font-bold text-base">
          <BookOpen className="size-5 text-primary" />
          <span>Professional Preparation Pack</span>
        </div>
        <p className="text-xs md:text-sm text-ink-secondary leading-relaxed">
          The Preparation Pack consolidates your verified findings, action items, key terms, and comparative differences into an evidence-grounded briefing document for consultation.
        </p>
        <Button onClick={handleRecompose} disabled={loading} className="w-full gap-2 text-xs font-semibold">
          <Sparkles className="size-4" />
          <span>Compile Preparation Pack</span>
        </Button>
      </div>
    )
  }

  const hasFindings = !!analysisResult
  const hasActions = actions.length > 0

  return (
    <div className="space-y-5 pb-8 min-w-0 w-full print-container">
      {/* Editorial Pack Header Card with guaranteed containment */}
      <div className="rounded-xl border border-border/80 bg-card p-4 md:p-6 shadow-2xs space-y-4 min-w-0 print:border-none print:shadow-none print:p-0">
        {/* Title and Action Buttons Row */}
        <div className="space-y-3 border-b border-border/60 pb-4 print:border-b-2 print:border-gray-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20 print:border-gray-400 print:text-black">
              LawLens Preparation Pack
            </span>
            <span className="font-mono text-[11px] text-ink-muted">
              {new Date(pack.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="font-serif text-lg md:text-xl font-bold text-ink-primary tracking-tight print:text-2xl">
              Professional Consultation Briefing
            </h2>
            <p className="text-xs text-ink-secondary leading-relaxed wrap-break-word">
              Consolidated from verified legal findings, contractual obligations, and action items in{" "}
              <strong className="text-ink-primary font-medium">{pack.overview.documentName}</strong>.
            </p>
          </div>

          {/* Action buttons cleanly wrapped inside container */}
          <div className="flex flex-wrap items-center gap-2 pt-1 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyBriefing}
              className="gap-1.5 text-xs text-ink-secondary hover:text-ink-primary h-8"
              id="btn-copy-briefing"
            >
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy Briefing"}</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-semibold h-8 shadow-xs"
              id="btn-print-pack"
            >
              <Printer className="size-3.5" />
              <span>Print / Save PDF</span>
            </Button>
          </div>
        </div>

        {/* Document Overview Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div className="rounded-lg bg-paper-contrast/40 p-2.5 border border-border/50 min-w-0">
            <span className="font-mono uppercase tracking-wider text-[10px] text-ink-muted block truncate">Document Type</span>
            <span className="font-medium text-ink-primary truncate block mt-0.5">{pack.overview.documentType || "Agreement"}</span>
          </div>
          <div className="rounded-lg bg-paper-contrast/40 p-2.5 border border-border/50 min-w-0">
            <span className="font-mono uppercase tracking-wider text-[10px] text-ink-muted block truncate">Jurisdiction</span>
            <span className="font-medium text-ink-primary block mt-0.5 truncate">{pack.overview.jurisdiction}</span>
          </div>
          <div className="rounded-lg bg-paper-contrast/40 p-2.5 border border-border/50 min-w-0">
            <span className="font-mono uppercase tracking-wider text-[10px] text-ink-muted block truncate">Scope</span>
            <span className="font-mono text-ink-primary block mt-0.5 truncate">
              {pack.overview.lineCount} lines · {pack.overview.wordCount}w
            </span>
          </div>
          <div className="rounded-lg bg-paper-contrast/40 p-2.5 border border-border/50 min-w-0">
            <span className="font-mono uppercase tracking-wider text-[10px] text-ink-muted block truncate">Verified Citations</span>
            <span className="font-mono text-primary font-semibold block mt-0.5 truncate">
              {pack.stats.verifiedCitationsCount} of {pack.stats.totalEvidenceCitations}
            </span>
          </div>
        </div>

        {/* Section Navigation Pills (Wrapping cleanly without horizontal scrollbar) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50 print:hidden">
          <button
            type="button"
            onClick={() => setActiveSection("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border ${
              activeSection === "all"
                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                : "bg-paper text-ink-secondary hover:text-ink-primary border-border/70 hover:bg-paper-contrast"
            }`}
          >
            All Sections
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("review")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border ${
              activeSection === "review"
                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                : "bg-paper text-ink-secondary hover:text-ink-primary border-border/70 hover:bg-paper-contrast"
            }`}
          >
            Items to Review ({pack.reviewItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("questions")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border ${
              activeSection === "questions"
                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                : "bg-paper text-ink-secondary hover:text-ink-primary border-border/70 hover:bg-paper-contrast"
            }`}
          >
            Questions to Ask ({pack.questionsToDiscuss.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("terms")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border ${
              activeSection === "terms"
                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                : "bg-paper text-ink-secondary hover:text-ink-primary border-border/70 hover:bg-paper-contrast"
            }`}
          >
            Key Terms ({pack.keyTerms.length})
          </button>
          {pack.comparisonChanges && pack.comparisonChanges.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveSection("changes")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border ${
                activeSection === "changes"
                  ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                  : "bg-paper text-ink-secondary hover:text-ink-primary border-border/70 hover:bg-paper-contrast"
              }`}
            >
              Changes ({pack.comparisonChanges.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveSection("evidence")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border ${
              activeSection === "evidence"
                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                : "bg-paper text-ink-secondary hover:text-ink-primary border-border/70 hover:bg-paper-contrast"
            }`}
          >
            Evidence Appendix ({pack.evidenceAppendix.length})
          </button>
        </div>
      </div>

      {/* Legal Boundary Notice Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5 min-w-0 print:border-gray-400 print:text-black print:p-3">
        <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 print:hidden" />
        <div className="space-y-0.5 min-w-0">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-800 dark:text-amber-300 print:text-black">
            Legal Information Boundary & Purpose
          </span>
          <p className="leading-relaxed text-[11px] text-ink-secondary print:text-xs wrap-break-word">
            {pack.legalNotice}
          </p>
        </div>
      </div>

      {/* Suggestion Prompt if Analysis or Actions not yet run */}
      {(!hasFindings || !hasActions) && (
        <div className="rounded-xl border border-border/70 bg-paper-contrast/40 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 print:hidden">
          <div className="space-y-0.5 min-w-0">
            <span className="font-semibold text-ink-primary text-xs">Enrich Your Preparation Pack</span>
            <p className="text-[11px] text-ink-muted wrap-break-word">
              {!hasFindings
                ? "Run Document Analysis in the Findings tab to extract parties, dates, covenants, and monetary items."
                : "Generate the Action Map in the Actions tab to produce tailored review and inquiry questions."}
            </p>
          </div>
          {onNavigateToMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToMode(!hasFindings ? "findings" : "actions")}
              className="gap-1.5 text-xs shrink-0 self-start sm:self-auto"
            >
              <span>{!hasFindings ? "Go to Findings" : "Go to Actions"}</span>
              <ArrowRight className="size-3" />
            </Button>
          )}
        </div>
      )}

      {/* SECTION 01: Executive Summary */}
      {(activeSection === "all" || activeSection === "review") && (
        <div className="rounded-xl border border-border/80 bg-card p-4 md:p-6 shadow-2xs space-y-3 min-w-0 print:border print:border-gray-300 print:p-4 print-break-inside-avoid">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              Section 01
            </span>
            <h3 className="font-serif font-bold text-sm md:text-base text-ink-primary">
              Executive Briefing & Document Summary
            </h3>
          </div>
          <p className="text-xs md:text-sm text-ink-secondary leading-relaxed whitespace-pre-line wrap-break-word font-normal">
            {pack.executiveSummary}
          </p>
        </div>
      )}

      {/* SECTION 02: Items to Review */}
      {(activeSection === "all" || activeSection === "review") && (
        <div className="rounded-xl border border-border/80 bg-card p-4 md:p-6 shadow-2xs space-y-3.5 min-w-0 print:border print:border-gray-300 print:p-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                Section 02
              </span>
              <h3 className="font-serif font-bold text-sm md:text-base text-ink-primary">
                Items for Human Review & Attention
              </h3>
            </div>
            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
              {pack.reviewItems.length} items
            </Badge>
          </div>

          {pack.reviewItems.length === 0 ? (
            <p className="text-xs text-ink-muted italic py-2">
              No specific review points flagged from the current document evidence.
            </p>
          ) : (
            <div className="space-y-3">
              {pack.reviewItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/60 bg-paper/50 p-3.5 md:p-4 space-y-2 hover:border-border transition-colors min-w-0 print:border-gray-300 print:p-3 print-break-inside-avoid"
                >
                  <div className="flex items-start justify-between gap-2.5 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-primary shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h4 className="font-semibold text-xs md:text-sm text-ink-primary wrap-break-word">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.priority === "attention" && (
                        <span className="font-mono uppercase tracking-wider text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/20">
                          Needs Attention
                        </span>
                      )}
                      {item.status && (
                        <span className="font-mono text-[10px] text-ink-muted px-2 py-0.5 rounded bg-paper-contrast border border-border/60">
                          {item.status === "completed" ? "Completed" : item.status === "reviewed" ? "Reviewed" : "Open"}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-ink-secondary leading-relaxed wrap-break-word">
                    <strong className="text-ink-primary font-medium">Why it matters:</strong> {item.whyItMatters}
                  </p>

                  {item.suggestedAction && (
                    <p className="text-xs text-ink-secondary leading-relaxed wrap-break-word">
                      <strong className="text-ink-primary font-medium">Suggested Step:</strong> {item.suggestedAction}
                    </p>
                  )}

                  {/* Evidence citation */}
                  {item.sourceEvidence.length > 0 && (
                    <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-[11px] min-w-0">
                      <div className="flex items-center gap-2 text-ink-muted min-w-0">
                        <span className="font-mono font-medium text-ink-primary shrink-0">
                          Lines {item.sourceEvidence[0].startLine}–{item.sourceEvidence[0].endLine}
                        </span>
                        <span className="italic truncate max-w-xs sm:max-w-md">
                          &ldquo;{item.sourceEvidence[0].sourceText}&rdquo;
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onSelectEvidence({
                            document: currentDocument,
                            startLine: item.sourceEvidence[0].startLine,
                            endLine: item.sourceEvidence[0].endLine,
                            sourceText: item.sourceEvidence[0].sourceText,
                          })
                        }
                        className="h-6 px-2 text-[10px] font-semibold gap-1 text-primary hover:text-primary print:hidden shrink-0"
                      >
                        <ExternalLink className="size-3" />
                        <span>View Source</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 03: Questions to Ask */}
      {(activeSection === "all" || activeSection === "questions") && (
        <div className="rounded-xl border border-border/80 bg-card p-4 md:p-6 shadow-2xs space-y-3.5 min-w-0 print:border print:border-gray-300 print:p-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                Section 03
              </span>
              <h3 className="font-serif font-bold text-sm md:text-base text-ink-primary">
                Inquiries & Questions to Raise
              </h3>
            </div>
            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
              {pack.questionsToDiscuss.length} questions
            </Badge>
          </div>

          {pack.questionsToDiscuss.length === 0 ? (
            <p className="text-xs text-ink-muted italic py-2">
              No specific questions compiled. Run the Action Map to extract inquiry points.
            </p>
          ) : (
            <div className="space-y-3">
              {pack.questionsToDiscuss.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3.5 md:p-4 space-y-2 min-w-0 print:border-gray-300 print:p-3 print-break-inside-avoid"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 shrink-0">
                      Q{String(idx + 1).padStart(2, "0")}
                    </span>
                    <h4 className="font-semibold text-xs md:text-sm text-ink-primary wrap-break-word">
                      {q.question}
                    </h4>
                  </div>

                  <p className="text-xs text-ink-secondary pl-6 leading-relaxed wrap-break-word">
                    <strong className="text-ink-primary font-medium">Context / Rationale:</strong> {q.whyThisQuestion}
                  </p>

                  {q.sourceEvidence.length > 0 && (
                    <div className="pt-2 pl-6 border-t border-purple-500/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted min-w-0">
                      <span className="truncate max-w-xs sm:max-w-md">
                        Source: Lines {q.sourceEvidence[0].startLine}–{q.sourceEvidence[0].endLine}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onSelectEvidence({
                            document: currentDocument,
                            startLine: q.sourceEvidence[0].startLine,
                            endLine: q.sourceEvidence[0].endLine,
                            sourceText: q.sourceEvidence[0].sourceText,
                          })
                        }
                        className="text-[10px] font-semibold text-purple-700 hover:underline print:hidden shrink-0"
                      >
                        Inspect Source →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 04: Key Terms, Amounts, & Dates */}
      {(activeSection === "all" || activeSection === "terms") && (
        <div className="rounded-xl border border-border/80 bg-card p-4 md:p-6 shadow-2xs space-y-3.5 min-w-0 print:border print:border-gray-300 print:p-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                Section 04
              </span>
              <h3 className="font-serif font-bold text-sm md:text-base text-ink-primary">
                Key Terms, Dates, and Obligations
              </h3>
            </div>
            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
              {pack.keyTerms.length} terms
            </Badge>
          </div>

          {pack.keyTerms.length === 0 ? (
            <p className="text-xs text-ink-muted italic py-2">
              No structured dates, amounts, or covenants extracted. Run Document Analysis to populate this section.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pack.keyTerms.map((kt) => (
                <div
                  key={kt.id}
                  className="rounded-lg border border-border/60 bg-paper/40 p-3.5 space-y-1.5 min-w-0 print:border-gray-300 print-break-inside-avoid"
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="font-mono uppercase tracking-wider text-[10px] text-ink-muted truncate">
                      {kt.label}
                    </span>
                    {kt.sourceEvidence.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          onSelectEvidence({
                            document: currentDocument,
                            startLine: kt.sourceEvidence[0].startLine,
                            endLine: kt.sourceEvidence[0].endLine,
                            sourceText: kt.sourceEvidence[0].sourceText,
                          })
                        }
                        className="font-mono text-[10px] text-primary hover:underline print:hidden shrink-0"
                      >
                        L{kt.sourceEvidence[0].startLine}
                      </button>
                    )}
                  </div>
                  <div className="font-bold text-xs md:text-sm text-ink-primary font-mono wrap-break-word">
                    {kt.value}
                  </div>
                  {kt.details && (
                    <p className="text-[11px] text-ink-secondary leading-snug wrap-break-word">
                      {kt.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 05: Comparison Differences (if available) */}
      {pack.comparisonChanges && pack.comparisonChanges.length > 0 && (activeSection === "all" || activeSection === "changes") && (
        <div className="rounded-xl border border-border/80 bg-card p-4 md:p-6 shadow-2xs space-y-3.5 min-w-0 print:border print:border-gray-300 print:p-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                Section 05
              </span>
              <h3 className="font-serif font-bold text-sm md:text-base text-ink-primary">
                Document Comparison & Draft Changes
              </h3>
            </div>
            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
              {pack.comparisonChanges.length} changes
            </Badge>
          </div>

          <div className="space-y-3">
            {pack.comparisonChanges.map((ch, idx) => (
              <div
                key={ch.id}
                className="rounded-lg border border-border/60 bg-paper/50 p-3.5 md:p-4 space-y-2.5 min-w-0 print:border-gray-300 print:p-3 print-break-inside-avoid"
              >
                <div className="flex items-center justify-between gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-primary shrink-0">
                      C{String(idx + 1).padStart(2, "0")}
                    </span>
                    <h4 className="font-semibold text-xs md:text-sm text-ink-primary wrap-break-word">
                      {ch.clauseTitle}
                    </h4>
                  </div>
                  <span className="font-mono uppercase text-[10px] px-2 py-0.5 rounded bg-paper-contrast border border-border/60 shrink-0">
                    {ch.changeType.replace(/_/g, " ")}
                  </span>
                </div>

                <p className="text-xs text-ink-secondary leading-relaxed wrap-break-word">
                  {ch.summary}
                </p>

                {/* Document A vs Document B comparative values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="rounded border border-border/50 bg-paper-contrast/40 p-2.5 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-[11px] text-ink-primary truncate">
                        Doc A ({pack.overview.documentName})
                      </span>
                      {ch.evidenceA && ch.evidenceA[0] && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onActiveViewerDocChange) onActiveViewerDocChange(currentDocument)
                            onSelectEvidence({
                              document: currentDocument,
                              startLine: ch.evidenceA![0].startLine,
                              endLine: ch.evidenceA![0].endLine,
                              sourceText: ch.evidenceA![0].sourceText,
                            })
                          }}
                          className="font-mono text-[10px] text-primary hover:underline print:hidden shrink-0"
                        >
                          L{ch.evidenceA[0].startLine}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-secondary wrap-break-word">
                      {ch.docAValue || (ch.evidenceA?.[0]?.sourceText ? `"${ch.evidenceA[0].sourceText}"` : "Not present in Draft 1")}
                    </p>
                  </div>

                  <div className="rounded border border-border/50 bg-paper-contrast/40 p-2.5 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-[11px] text-ink-primary truncate">
                        Doc B ({pack.overview.comparisonDocumentName || "Draft 2"})
                      </span>
                      {ch.evidenceB && ch.evidenceB[0] && comparisonDocB && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onActiveViewerDocChange) onActiveViewerDocChange(comparisonDocB)
                            onSelectEvidence({
                              document: comparisonDocB,
                              startLine: ch.evidenceB![0].startLine,
                              endLine: ch.evidenceB![0].endLine,
                              sourceText: ch.evidenceB![0].sourceText,
                            })
                          }}
                          className="font-mono text-[10px] text-primary hover:underline print:hidden shrink-0"
                        >
                          L{ch.evidenceB[0].startLine}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-secondary wrap-break-word">
                      {ch.docBValue || (ch.evidenceB?.[0]?.sourceText ? `"${ch.evidenceB[0].sourceText}"` : "Not present in Draft 2")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 06: Redesigned Structured Source Evidence Appendix */}
      {(activeSection === "all" || activeSection === "evidence") && (
        <div className="rounded-xl border border-border/80 bg-card p-4 md:p-6 shadow-2xs space-y-3.5 min-w-0 print:border print:border-gray-300 print:p-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                Section 06
              </span>
              <h3 className="font-serif font-bold text-sm md:text-base text-ink-primary">
                Source Evidence Appendix
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                {pack.evidenceAppendix.length} citations
              </Badge>
              <button
                type="button"
                onClick={() => setExpandedAppendix(!expandedAppendix)}
                className="text-xs text-ink-muted hover:text-ink-primary flex items-center gap-1 print:hidden"
              >
                {expandedAppendix ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                <span>{expandedAppendix ? "Collapse" : "Expand All"}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-ink-secondary leading-relaxed wrap-break-word">
            All facts, dates, and amounts included in this preparation pack originate from the verified lines below:
          </p>

          {/* Structured evidence items avoiding horizontal blowout */}
          <div className="space-y-2.5">
            {(expandedAppendix || activeSection === "evidence"
              ? pack.evidenceAppendix
              : pack.evidenceAppendix.slice(0, 5)
            ).map((ev) => (
              <div
                key={ev.id}
                className="rounded-lg border border-border/60 bg-paper/40 p-3 space-y-2 text-xs min-w-0 print:border-gray-300 print-break-inside-avoid"
              >
                {/* Header row: line number + referenced term */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 shrink-0">
                      Lines {ev.startLine}–{ev.endLine}
                    </span>
                    <span className="font-semibold text-ink-primary text-xs truncate">
                      {ev.referencedBy}
                    </span>
                  </div>
                </div>

                {/* Body quote with safe wrapping */}
                <blockquote className="font-serif text-xs text-ink-secondary italic border-l-2 border-primary/50 pl-2.5 py-0.5 leading-relaxed wrap-break-word whitespace-normal bg-paper-contrast/30 rounded-r">
                  &ldquo;{ev.quote}&rdquo;
                </blockquote>

                {/* Footer metadata: filename truncated safely + View source button inside card */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px] text-ink-muted font-mono min-w-0">
                  <span className="truncate max-w-55" title={ev.documentName}>
                    {ev.documentName}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectEvidence({
                        document: currentDocument,
                        startLine: ev.startLine,
                        endLine: ev.endLine,
                        sourceText: ev.quote,
                      })
                    }
                    className="text-primary hover:underline font-sans font-semibold text-[10px] print:hidden shrink-0 flex items-center gap-0.5"
                  >
                    <span>View source</span>
                    <ExternalLink className="size-2.5" />
                  </button>
                </div>
              </div>
            ))}

            {!expandedAppendix && activeSection !== "evidence" && pack.evidenceAppendix.length > 5 && (
              <button
                type="button"
                onClick={() => setExpandedAppendix(true)}
                className="w-full py-2 text-center text-xs text-primary font-semibold hover:underline border border-dashed border-border rounded-lg print:hidden"
              >
                Show {pack.evidenceAppendix.length - 5} more source citations...
              </button>
            )}
          </div>
        </div>
      )}

      {/* Connect & Resources Handoff Banner */}
      {onNavigateToMode && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden shadow-xs min-w-0">
          <div className="space-y-0.5 min-w-0">
            <span className="font-mono text-[10px] font-semibold text-primary uppercase tracking-wider">
              Next Steps · Legal Resources & Handoff
            </span>
            <p className="text-xs text-ink-primary font-medium wrap-break-word">
              Explore verified statutory portals, legal aid criteria, and consultation guidance.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => onNavigateToMode("connect")}
            className="gap-1.5 text-xs font-semibold h-7 shrink-0 shadow-xs self-start sm:self-auto"
            id="btn-goto-connect-from-prep"
          >
            <span>Where to Go Next (Connect)</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
