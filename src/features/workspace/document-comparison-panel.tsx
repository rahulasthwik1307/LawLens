"use client"

import * as React from "react"
import {
  GitCompare,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Scale,
  Eye,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UploadedDocument } from "@/types/document"
import { SAMPLE_DOCUMENTS } from "@/lib/sample-documents"
import type {
  ComparisonDifference,
  ComparisonDifferenceType,
  DocumentComparisonResult,
} from "@/services/ai/types"

interface DocumentComparisonPanelProps {
  currentDocument: UploadedDocument
  availableDocuments?: UploadedDocument[]
  onSelectEvidence: (params: {
    document: UploadedDocument
    startLine: number
    endLine: number
    sourceText: string
  }) => void
  onActiveViewerDocChange?: (doc: UploadedDocument) => void
  onComparisonCompleted?: (result: DocumentComparisonResult, docB: UploadedDocument) => void
}

type FilterType = "all" | "review_needed" | ComparisonDifferenceType

export function DocumentComparisonPanel({
  currentDocument,
  availableDocuments = [],
  onSelectEvidence,
  onActiveViewerDocChange,
  onComparisonCompleted,
}: DocumentComparisonPanelProps) {
  // Combine sample documents and user uploaded documents (deduped by ID)
  const allAvailableDocs = React.useMemo(() => {
    const map = new Map<string, UploadedDocument>()
    map.set(currentDocument.id, currentDocument)
    for (const d of availableDocuments) {
      map.set(d.id, d)
    }
    for (const d of SAMPLE_DOCUMENTS) {
      if (!map.has(d.id)) {
        map.set(d.id, d)
      }
    }
    return Array.from(map.values())
  }, [currentDocument, availableDocuments])

  // Comparison selections: Doc A defaults to current workspace document
  const [docAId, setDocAId] = React.useState<string>(currentDocument.id)
  // Default Doc B to sample_commercial_lease_v2 if available and different from docA
  const defaultDocB = React.useMemo(() => {
    const v2 = allAvailableDocs.find((d) => d.id === "sample_commercial_lease_v2")
    if (v2 && v2.id !== currentDocument.id) return v2.id
    const other = allAvailableDocs.find((d) => d.id !== currentDocument.id)
    return other ? other.id : currentDocument.id
  }, [allAvailableDocs, currentDocument.id])

  const [docBId, setDocBId] = React.useState<string>(defaultDocB)

  // Status and results
  const [isComparing, setIsComparing] = React.useState(false)
  const [comparisonResult, setComparisonResult] = React.useState<DocumentComparisonResult | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<FilterType>("all")

  const selectedDocA = allAvailableDocs.find((d) => d.id === docAId) || currentDocument
  const selectedDocB = allAvailableDocs.find((d) => d.id === docBId) || currentDocument

  const isSameDocument = docAId === docBId

  const handleRunComparison = async () => {
    if (isComparing) return
    if (isSameDocument) {
      setErrorMessage("Please select two distinct documents to compare.")
      return
    }

    if (!selectedDocA.isTextReadable || !selectedDocB.isTextReadable) {
      setErrorMessage("Both documents must contain readable text before comparison.")
      return
    }

    setIsComparing(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/documents/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentA: selectedDocA,
          documentB: selectedDocB,
          jurisdiction: "India",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Document comparison failed.")
      }

      setComparisonResult(data.result)
      if (onComparisonCompleted) {
        onComparisonCompleted(data.result, selectedDocB)
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred."
      )
    } finally {
      setIsComparing(false)
    }
  }

  // Filtered differences
  const filteredDifferences = React.useMemo(() => {
    if (!comparisonResult) return []
    if (filter === "all") return comparisonResult.differences
    if (filter === "review_needed") {
      return comparisonResult.differences.filter(
        (d) => d.reviewStatus === "review_recommended"
      )
    }
    return comparisonResult.differences.filter((d) => d.type === filter)
  }, [comparisonResult, filter])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Configuration & Selection Card */}
      <div className="rounded-xl border border-border/80 bg-card p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <GitCompare className="size-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-ink-primary">
                Document Comparison & Inconsistency Detection
              </h3>
              <p className="text-xs text-ink-secondary">
                Two-stage alignment and evidence-grounded difference analysis
              </p>
            </div>
          </div>
          <Badge variant="outline" size="sm" className="font-mono text-[10px]">
            Comparative Review
          </Badge>
        </div>

        {/* Dual Document Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Document A (Base) */}
          <div className="space-y-2 p-3.5 rounded-lg border border-border/60 bg-paper-contrast/30">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-primary flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-500" />
                Document A (Base Draft)
              </span>
              <span className="font-mono text-[10px] text-ink-muted">
                {selectedDocA.lineCount} lines
              </span>
            </div>
            <select
              value={docAId}
              onChange={(e) => {
                setDocAId(e.target.value)
                setComparisonResult(null)
              }}
              className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-2 text-ink-primary focus:outline-none focus:ring-1 focus:ring-ring font-sans"
            >
              {allAvailableDocs.map((doc) => (
                <option key={`a_${doc.id}`} value={doc.id}>
                  {doc.name} {doc.id === currentDocument.id ? "(Current Workspace)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Document B (Comparison) */}
          <div className="space-y-2 p-3.5 rounded-lg border border-border/60 bg-paper-contrast/30">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-primary flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                Document B (Revised / Secondary Draft)
              </span>
              <span className="font-mono text-[10px] text-ink-muted">
                {selectedDocB.lineCount} lines
              </span>
            </div>
            <select
              value={docBId}
              onChange={(e) => {
                setDocBId(e.target.value)
                setComparisonResult(null)
              }}
              className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-2 text-ink-primary focus:outline-none focus:ring-1 focus:ring-ring font-sans"
            >
              {allAvailableDocs.map((doc) => (
                <option key={`b_${doc.id}`} value={doc.id}>
                  {doc.name} {doc.id === "sample_commercial_lease_v2" ? "(v2 Revision)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Warning if same document selected */}
        {isSameDocument && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <span>
              Document A and Document B are currently the same file. Please select two different documents to compare.
            </span>
          </div>
        )}

        {/* Action Button & Disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-[11px] text-ink-muted">
            Grounding: Every identified difference cites verbatim quotes from both documents.
          </span>
          <Button
            type="button"
            onClick={handleRunComparison}
            disabled={isComparing || isSameDocument}
            className="w-full sm:w-auto text-xs px-5 py-2 shadow-xs"
          >
            {isComparing ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="size-3.5 animate-spin" />
                <span>Comparing Documents...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <GitCompare className="size-3.5" />
                <span>Run Comparison Analysis</span>
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Error View */}
      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive flex items-start gap-3">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Comparison Error</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Comparison Loading Skeleton */}
      {isComparing && (
        <div className="rounded-xl border border-border/80 bg-card p-8 text-center space-y-4 shadow-xs animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <RefreshCw className="size-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-sm text-ink-primary">
              Analyzing Differences & Aligning Clauses
            </h4>
            <p className="text-xs text-ink-secondary max-w-md mx-auto">
              Extracting and verifying evidence quotes from both Document A and Document B...
            </p>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResult && !isComparing && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="rounded-xl border border-border/80 bg-card p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-ink-primary font-bold text-sm">
              <Sparkles className="size-4 text-primary" />
              <span>Comparison Overview</span>
            </div>

            <p className="text-xs md:text-sm text-ink-primary leading-relaxed bg-paper-contrast/30 p-3.5 rounded-lg border border-border/60">
              {comparisonResult.executiveSummary}
            </p>

            {/* Unchanged Provisions Section */}
            {comparisonResult.unchangedProvisionsSummary && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                  Unchanged / Consistent Provisions
                </span>
                <p className="text-xs text-ink-secondary leading-relaxed bg-secondary/30 p-3 rounded-lg">
                  {comparisonResult.unchangedProvisionsSummary}
                </p>
              </div>
            )}

            {/* Metric Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-center">
              <div className="p-2.5 rounded-lg border border-border/60 bg-paper-contrast/20">
                <div className="text-lg font-bold text-ink-primary">
                  {comparisonResult.stats.totalDifferences}
                </div>
                <div className="text-[10px] text-ink-secondary font-medium">
                  Total Differences
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-paper-contrast/20">
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {comparisonResult.stats.reviewRecommendedCount}
                </div>
                <div className="text-[10px] text-ink-secondary font-medium">
                  Review Recommended
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-paper-contrast/20">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {comparisonResult.stats.addedCount + comparisonResult.stats.valueChangedCount}
                </div>
                <div className="text-[10px] text-ink-secondary font-medium">
                  Added / Values Shifted
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border/60 bg-paper-contrast/20">
                <div className="text-lg font-bold text-primary flex items-center justify-center gap-1">
                  <ShieldCheck className="size-4" />
                  <span>{comparisonResult.stats.verifiedEvidenceItems}</span>
                </div>
                <div className="text-[10px] text-ink-secondary font-medium">
                  Verified Citations
                </div>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-paper-contrast/40 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-card text-ink-primary shadow-xs"
                  : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              All ({comparisonResult.differences.length})
            </button>

            {comparisonResult.stats.reviewRecommendedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("review_needed")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filter === "review_needed"
                    ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 shadow-xs"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                <AlertTriangle className="size-3 text-amber-500" />
                <span>Review Recommended ({comparisonResult.stats.reviewRecommendedCount})</span>
              </button>
            )}

            {comparisonResult.stats.valueChangedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("value_changed")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === "value_changed"
                    ? "bg-card text-ink-primary shadow-xs"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                Values Changed ({comparisonResult.stats.valueChangedCount})
              </button>
            )}

            {comparisonResult.stats.addedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("added")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === "added"
                    ? "bg-card text-ink-primary shadow-xs"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                Added Clauses ({comparisonResult.stats.addedCount})
              </button>
            )}

            {comparisonResult.stats.removedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("removed")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === "removed"
                    ? "bg-card text-ink-primary shadow-xs"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                Removed Clauses ({comparisonResult.stats.removedCount})
              </button>
            )}

            {comparisonResult.stats.modifiedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("modified")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === "modified"
                    ? "bg-card text-ink-primary shadow-xs"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                Modified Terms ({comparisonResult.stats.modifiedCount})
              </button>
            )}
          </div>

          {/* Difference Cards List */}
          <div className="space-y-4">
            {filteredDifferences.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-border/80 text-xs text-ink-muted">
                No differences found for the selected filter.
              </div>
            ) : (
              filteredDifferences.map((diff) => (
                <DifferenceCard
                  key={diff.id}
                  diff={diff}
                  selectedDocA={selectedDocA}
                  selectedDocB={selectedDocB}
                  onSelectEvidence={onSelectEvidence}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface DifferenceCardProps {
  diff: ComparisonDifference
  selectedDocA: UploadedDocument
  selectedDocB: UploadedDocument
  onSelectEvidence: (params: {
    document: UploadedDocument
    startLine: number
    endLine: number
    sourceText: string
  }) => void
}

function DifferenceCard({
  diff,
  selectedDocA,
  selectedDocB,
  onSelectEvidence,
}: DifferenceCardProps) {
  const getTypeBadge = (type: ComparisonDifferenceType) => {
    switch (type) {
      case "added":
        return (
          <Badge
            variant="outline"
            size="sm"
            className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 text-[10px]"
          >
            Added Clause
          </Badge>
        )
      case "removed":
        return (
          <Badge
            variant="outline"
            size="sm"
            className="bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20 text-[10px]"
          >
            Removed Clause
          </Badge>
        )
      case "value_changed":
        return (
          <Badge
            variant="outline"
            size="sm"
            className="bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20 text-[10px]"
          >
            Value Shift
          </Badge>
        )
      case "modified":
        return (
          <Badge
            variant="outline"
            size="sm"
            className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 text-[10px]"
          >
            Modified Clause
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" size="sm" className="text-[10px]">
            Unchanged
          </Badge>
        )
    }
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-xs hover:border-border transition-colors">
      {/* Header with Title and Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          {getTypeBadge(diff.type)}
          <h4 className="font-serif font-bold text-sm text-ink-primary">
            {diff.clauseTitle}
          </h4>
        </div>

        {diff.reviewStatus === "review_recommended" && (
          <Badge
            variant="outline"
            size="sm"
            className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[10px] font-medium flex items-center gap-1"
          >
            <AlertTriangle className="size-3 text-amber-600" />
            <span>Review Recommended</span>
          </Badge>
        )}
      </div>

      {/* Summary & Explanation */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-ink-primary leading-snug">
          {diff.summary}
        </p>
        <p className="text-xs text-ink-secondary leading-relaxed">
          {diff.explanation}
        </p>
      </div>

      {/* Review Note */}
      {diff.riskOrReviewNote && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <Info className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-[11px] uppercase tracking-wider block">
              Review Note:
            </span>
            <span className="text-[11px]">{diff.riskOrReviewNote}</span>
          </div>
        </div>
      )}

      {/* Evidence Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {/* Document A Evidence */}
        <div className="rounded-lg border border-border/60 bg-paper-contrast/20 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-ink-secondary flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-blue-500" />
              Document A
            </span>
            {diff.evidenceA.length > 0 && (
              <span className="font-mono text-[10px] text-ink-muted">
                L{diff.evidenceA[0].startLine}–L{diff.evidenceA[0].endLine}
              </span>
            )}
          </div>

          {diff.evidenceA.length > 0 ? (
            diff.evidenceA.map((ev, i) => (
              <div key={i} className="space-y-2">
                <blockquote className="text-[11px] font-serif italic text-ink-primary border-l-2 border-blue-500/50 pl-2.5 py-0.5">
                  &ldquo;{ev.sourceText}&rdquo;
                </blockquote>
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={ev.verificationStatus === "verified" ? "default" : "outline"}
                    size="sm"
                    className="font-mono text-[9px]"
                  >
                    {ev.verificationStatus === "verified" ? "Verified Grounding" : "Unverified Quote"}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onSelectEvidence({
                        document: selectedDocA,
                        startLine: ev.startLine,
                        endLine: ev.endLine,
                        sourceText: ev.sourceText,
                      })
                    }
                    className="text-[10px] h-6 px-2 flex items-center gap-1 text-ink-secondary hover:text-ink-primary"
                  >
                    <Eye className="size-3" />
                    <span>View in Doc A</span>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-ink-muted italic py-1">
              Provision not present in Document A (introduced in Document B).
            </p>
          )}
        </div>

        {/* Document B Evidence */}
        <div className="rounded-lg border border-border/60 bg-paper-contrast/20 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-ink-secondary flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Document B
            </span>
            {diff.evidenceB.length > 0 && (
              <span className="font-mono text-[10px] text-ink-muted">
                L{diff.evidenceB[0].startLine}–L{diff.evidenceB[0].endLine}
              </span>
            )}
          </div>

          {diff.evidenceB.length > 0 ? (
            diff.evidenceB.map((ev, i) => (
              <div key={i} className="space-y-2">
                <blockquote className="text-[11px] font-serif italic text-ink-primary border-l-2 border-emerald-500/50 pl-2.5 py-0.5">
                  &ldquo;{ev.sourceText}&rdquo;
                </blockquote>
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={ev.verificationStatus === "verified" ? "default" : "outline"}
                    size="sm"
                    className="font-mono text-[9px]"
                  >
                    {ev.verificationStatus === "verified" ? "Verified Grounding" : "Unverified Quote"}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onSelectEvidence({
                        document: selectedDocB,
                        startLine: ev.startLine,
                        endLine: ev.endLine,
                        sourceText: ev.sourceText,
                      })
                    }
                    className="text-[10px] h-6 px-2 flex items-center gap-1 text-ink-secondary hover:text-ink-primary"
                  >
                    <Eye className="size-3" />
                    <span>View in Doc B</span>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-ink-muted italic py-1">
              Provision omitted in Document B (present only in Document A).
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
