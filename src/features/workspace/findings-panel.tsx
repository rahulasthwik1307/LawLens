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
  ExternalLink,
  ChevronRight,
  Info,
  Scale,
  Sparkles,
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

  // Filtered findings list
  const filteredFindings = React.useMemo(() => {
    if (selectedCategory === "all") return analysis.findings
    return (
      analysis.categories[selectedCategory as FindingCategory] || []
    )
  }, [analysis, selectedCategory])

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Overview & Metadata Summary Banner */}
      <div className="rounded-xl border border-border/80 bg-paper p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-sm font-bold text-ink-primary">
              {analysis.documentType}
            </span>
            <Badge variant="outline" size="sm" className="font-mono text-[11px]">
              {analysis.stats.totalFindings} Provisions Identified
            </Badge>
            <Badge
              variant={
                analysis.stats.verificationRate >= 80 ? "default" : "subtle"
              }
              size="sm"
              className="text-[11px]"
            >
              {analysis.stats.verificationRate}% Verified Quotes
            </Badge>
            {analysis.metadata?.modelName && (
              <Badge variant="subtle" size="sm" className="font-mono text-[10px] text-ink-muted">
                {analysis.metadata.modelName}
              </Badge>
            )}
          </div>

          {onReanalyze && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReanalyze}
              className="text-xs h-7 text-ink-muted hover:text-ink-primary"
            >
              Re-analyze
            </Button>
          )}
        </div>

        {/* Plain Language Summary */}
        <p className="text-xs md:text-sm text-ink-secondary leading-relaxed border-t border-border/60 pt-3">
          {analysis.summary}
        </p>

        {/* Legal Information Disclaimer Pill */}
        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted bg-paper-contrast/60 px-3 py-1.5 rounded-md border border-border/50">
          <Info className="size-3.5 text-primary shrink-0" />
          <span>
            LawLens provides structured informational analysis grounded in the source document. It does not provide legal advice.
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
            Filter Findings by Category
          </span>
          <span className="text-xs text-ink-muted">
            Showing {filteredFindings.length} of {analysis.findings.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground border-primary"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-paper text-ink-secondary hover:text-ink-primary border-border/70 hover:bg-paper-contrast"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{meta.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
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

      {/* Findings List */}
      <div className="space-y-3.5">
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

          return (
            <div
              key={finding.id}
              tabIndex={0}
              className={`rounded-xl border p-4 md:p-5 transition-all duration-150 space-y-3 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isCurrentActive
                  ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/40"
                  : "bg-card border-border/80 hover:border-primary/40 hover:bg-card/90"
              }`}
            >
              {/* Header: Category Badge + Confidence Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-primary bg-secondary px-2.5 py-1 rounded-md">
                    <CategoryIcon className="size-3.5 text-primary" />
                    <span>{meta.label}</span>
                  </div>

                  {finding.confidence === "clear_in_document" && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="size-3 text-emerald-600" />
                      <span>Clear in document</span>
                    </span>
                  )}
                  {finding.confidence === "supported_by_source" && (
                    <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Supported by source
                    </span>
                  )}
                  {finding.confidence === "needs_review" && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <AlertCircle className="size-3 text-amber-600" />
                      <span>Needs review</span>
                    </span>
                  )}
                  {finding.confidence === "unclear_from_document" && (
                    <span className="text-[11px] font-medium text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Unclear from document
                    </span>
                  )}
                </div>

                {finding.evidence && finding.evidence.verificationStatus === "verified" && (
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded">
                    Verified Citation
                  </span>
                )}
              </div>

              {/* Title & Explanation */}
              <div className="space-y-1.5">
                <h4 className="font-serif text-base font-bold text-ink-primary leading-snug">
                  {finding.title}
                </h4>
                <p className="text-xs md:text-sm text-ink-secondary leading-relaxed">
                  {finding.explanation}
                </p>
              </div>

              {/* Uncertainty Callout if applicable */}
              {finding.uncertainty && (
                <div className="rounded-md bg-amber-50/90 border border-amber-200 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="size-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-normal">{finding.uncertainty}</p>
                </div>
              )}

              {/* Grounded Evidence Box with Action Link */}
              {finding.evidence ? (
                <div className="rounded-lg bg-paper border border-border/70 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-ink-muted">
                    <span className="font-mono font-medium text-ink-secondary">
                      Source Lines {finding.evidence.startLine}–{finding.evidence.endLine}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase ${
                        finding.evidence.verificationStatus === "verified"
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {finding.evidence.verificationStatus === "verified"
                        ? "Verbatim Excerpt"
                        : "Unverified Quote"}
                    </span>
                  </div>

                  <blockquote className="font-serif text-xs text-ink-primary italic border-l-2 border-primary/60 pl-2.5 py-0.5 leading-relaxed bg-paper-contrast/30 rounded-r">
                    &ldquo;{finding.evidence.sourceText}&rdquo;
                  </blockquote>

                  <div className="pt-1 flex justify-end">
                    <Button
                      variant={isCurrentActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSelectEvidence(finding.evidence!)}
                      className="gap-1.5 h-7 text-xs font-medium"
                    >
                      <span>
                        {isCurrentActive ? "Viewing in Document" : "View in Document"}
                      </span>
                      <ChevronRight className="size-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-ink-muted italic py-1">
                  General document-level interpretation; no specific single-clause citation.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
