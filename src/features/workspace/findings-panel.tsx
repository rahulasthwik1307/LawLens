"use client"

import * as React from "react"
import {
  Users,
  Calendar,
  Coins,
  Shield,
  Layers,
  Ban,
  FileX,
  Gavel,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  ExternalLink,
  ChevronsUpDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DocumentAnalysisResult,
  FindingCategory,
  FindingEvidence,
  LegalFinding,
} from "@/services/ai/types"

interface FindingsPanelProps {
  analysis: DocumentAnalysisResult
  activeEvidence?: FindingEvidence | null
  onSelectEvidence: (evidence: FindingEvidence) => void
  onReanalyze?: () => void
}

const CATEGORY_META: Record<
  FindingCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  parties: { label: "Parties", icon: Users },
  dates: { label: "Dates & Deadlines", icon: Calendar },
  monetary: { label: "Monetary Terms", icon: Coins },
  rights: { label: "Rights", icon: Shield },
  obligations: { label: "Obligations", icon: Layers },
  restrictions: { label: "Restrictions", icon: Ban },
  termination: { label: "Termination", icon: FileX },
  dispute_resolution: { label: "Dispute Resolution", icon: Gavel },
  review_points: { label: "Review Points", icon: AlertCircle },
}

export function FindingsPanel({
  analysis,
  activeEvidence,
  onSelectEvidence,
  onReanalyze,
}: FindingsPanelProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
  // Track which finding cards have their verbatim excerpt expanded
  const [expandedCardIds, setExpandedCardIds] = React.useState<Set<string>>(new Set())

  // Filtered findings list
  const filteredFindings = React.useMemo(() => {
    if (selectedCategory === "all") return analysis.findings
    return (
      analysis.categories[selectedCategory as FindingCategory] || []
    )
  }, [analysis, selectedCategory])

  const toggleCardExcerpt = (id: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const allExpanded = filteredFindings.length > 0 && filteredFindings.every((f) => expandedCardIds.has(f.id))

  const handleToggleExpandAll = () => {
    if (allExpanded) {
      setExpandedCardIds(new Set())
    } else {
      setExpandedCardIds(new Set(filteredFindings.map((f) => f.id)))
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Compact Overview & Analysis Summary Header */}
      <div className="rounded-xl border border-border/80 bg-paper p-4 md:p-5 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              Findings Overview
            </span>
            <span className="font-serif text-sm font-bold text-ink-primary">
              {analysis.documentType}
            </span>
            <span className="text-xs text-ink-muted">·</span>
            <span className="font-mono text-xs font-semibold text-ink-secondary">
              {analysis.stats.totalFindings} provisions
            </span>
            <span className="text-xs text-ink-muted">·</span>
            <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded">
              {analysis.stats.verificationRate}% verified citations
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleExpandAll}
              className="text-[11px] h-7 px-2.5 gap-1 text-ink-secondary hover:text-ink-primary"
              title={allExpanded ? "Collapse all quotes" : "Expand all quotes"}
            >
              <ChevronsUpDown className="size-3" />
              <span>{allExpanded ? "Collapse All Quotes" : "Expand All Quotes"}</span>
            </Button>
            {onReanalyze && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReanalyze}
                className="text-[11px] h-7 px-2.5 text-ink-muted hover:text-ink-primary"
              >
                Re-analyze
              </Button>
            )}
          </div>
        </div>

        {/* Compact Plain Language Summary */}
        <p className="text-xs md:text-sm text-ink-secondary leading-relaxed border-t border-border/60 pt-2.5">
          {analysis.summary}
        </p>

        {/* Subordinate Legal Information Disclaimer */}
        <div className="flex items-center gap-2 text-[11px] text-ink-muted bg-paper-contrast/50 px-3 py-1.5 rounded-md border border-border/50">
          <Info className="size-3.5 text-primary shrink-0" />
          <span className="leading-tight">
            LawLens provides structured informational analysis grounded in the source document. It does not provide legal advice.
          </span>
        </div>
      </div>

      {/* Compact Filter Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
            Filter Findings by Category
          </span>
          <span className="font-mono text-[11px] text-ink-muted">
            Showing {filteredFindings.length} of {analysis.findings.length}
          </span>
        </div>

        {/* Category Chips - Wraps naturally, never clipped */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                : "bg-paper text-ink-secondary hover:text-ink-primary border-border/70 hover:bg-paper-contrast"
            }`}
          >
            All Provisions ({analysis.findings.length})
          </button>

          {(Object.keys(CATEGORY_META) as FindingCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat]
            const count = analysis.categories[cat]?.length || 0
            if (count === 0) return null

            const isSelected = selectedCategory === cat
            const Icon = meta.icon

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                    : "bg-paper text-ink-secondary hover:text-ink-primary border-border/70 hover:bg-paper-contrast"
                }`}
              >
                <Icon className="size-3" />
                <span>{meta.label}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-secondary text-ink-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Findings Responsive Grid: 2 columns on wide viewports, 1 column on narrower */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
        {filteredFindings.map((finding) => {
          const meta = CATEGORY_META[finding.category] || {
            label: finding.category,
            icon: Info,
          }
          const CategoryIcon = meta.icon

          const isCurrentActive =
            activeEvidence &&
            finding.evidence &&
            activeEvidence.startLine === finding.evidence.startLine &&
            activeEvidence.endLine === finding.evidence.endLine

          const isExcerptExpanded = expandedCardIds.has(finding.id)

          return (
            <div
              key={finding.id}
              tabIndex={0}
              className={`rounded-xl border p-4 transition-all duration-150 space-y-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring flex flex-col justify-between ${
                isCurrentActive
                  ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/40"
                  : "bg-card border-border/80 hover:border-primary/40 hover:bg-card/95"
              }`}
            >
              <div className="space-y-2">
                {/* Header: Category Badge + Confidence Badge */}
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-ink-primary bg-secondary px-2 py-0.5 rounded">
                      <CategoryIcon className="size-3 text-primary" />
                      <span>{meta.label}</span>
                    </div>

                    {finding.confidence === "clear_in_document" && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="size-2.5 text-emerald-600" />
                        <span>Clear</span>
                      </span>
                    )}
                    {finding.confidence === "supported_by_source" && (
                      <span className="text-[10px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        Supported
                      </span>
                    )}
                    {finding.confidence === "needs_review" && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <AlertCircle className="size-2.5 text-amber-600" />
                        <span>Review</span>
                      </span>
                    )}
                    {finding.confidence === "unclear_from_document" && (
                      <span className="text-[10px] font-medium text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        Unclear
                      </span>
                    )}
                  </div>

                  {finding.evidence && finding.evidence.verificationStatus === "verified" && (
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* Finding Title & Plain Language Explanation */}
                <div className="space-y-1">
                  <h4 className="font-serif text-sm md:text-[15px] font-bold text-ink-primary leading-snug">
                    {finding.title}
                  </h4>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    {finding.explanation}
                  </p>
                </div>

                {/* Uncertainty Callout if present */}
                {finding.uncertainty && (
                  <div className="rounded-md bg-amber-50/90 border border-amber-200 p-2 text-xs text-amber-900 flex items-start gap-1.5">
                    <AlertCircle className="size-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <p className="leading-snug text-[11px]">{finding.uncertainty}</p>
                  </div>
                )}
              </div>

              {/* Progressive Disclosure Evidence Section */}
              {finding.evidence ? (
                <div className="rounded-lg bg-paper border border-border/70 p-2.5 space-y-2 mt-2">
                  {/* Compact Grounding Row */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-secondary">
                      <span className="font-bold text-ink-primary">
                        Lines {finding.evidence.startLine}–{finding.evidence.endLine}
                      </span>
                      <span className="text-ink-muted">·</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        Grounded
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleCardExcerpt(finding.id)}
                        className="text-[11px] font-medium text-ink-muted hover:text-ink-primary px-1.5 py-0.5 rounded hover:bg-paper-contrast transition-colors flex items-center gap-1"
                        aria-expanded={isExcerptExpanded}
                      >
                        <span>{isExcerptExpanded ? "Hide Quote" : "Quote"}</span>
                        {isExcerptExpanded ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        )}
                      </button>

                      <Button
                        variant={isCurrentActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSelectEvidence(finding.evidence!)}
                        className="gap-1 h-6 px-2 text-[11px] font-medium"
                      >
                        <span>{isCurrentActive ? "Viewing" : "View Source"}</span>
                        <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Verbatim Excerpt */}
                  {isExcerptExpanded && (
                    <div className="pt-2 border-t border-border/50 space-y-2 animate-in fade-in duration-150">
                      <blockquote className="font-serif text-xs text-ink-primary italic border-l-2 border-primary/60 pl-2.5 py-1 leading-relaxed bg-paper-contrast/40 rounded-r">
                        &ldquo;{finding.evidence.sourceText}&rdquo;
                      </blockquote>
                      <div className="flex items-center justify-between text-[10px] text-ink-muted font-mono pt-0.5">
                        <span>
                          {finding.evidence.verificationStatus === "verified"
                            ? "Verbatim document excerpt"
                            : "Unverified quote"}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectEvidence(finding.evidence!)}
                          className="text-primary hover:underline font-semibold"
                        >
                          Highlight in Document →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-ink-muted italic py-1 border-t border-border/40 mt-1">
                  General document-level interpretation.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
