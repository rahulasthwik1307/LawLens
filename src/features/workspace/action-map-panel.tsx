"use client"

import * as React from "react"
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Info,
  ExternalLink,
  Clock,
  HelpCircle,
  FileCheck,
  CheckSquare,
  Search,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UploadedDocument } from "@/types/document"
import type {
  ActionItem,
  ActionStatus,
  ActionType,
  DocumentAnalysisResult,
  DocumentComparisonResult,
} from "@/services/ai/types"

import { LegalActionPlannerPanel } from "./legal-action-planner-panel"

interface ActionMapPanelProps {
  currentDocument: UploadedDocument
  analysisResult?: DocumentAnalysisResult | null
  comparisonResult?: DocumentComparisonResult | null
  comparisonDocB?: UploadedDocument | null
  actions?: ActionItem[]
  selectedFindingId?: string
  onActionsChange?: (actions: ActionItem[]) => void
  onSelectEvidence: (params: {
    document?: UploadedDocument
    startLine: number
    endLine: number
    sourceText: string
  }) => void
  onActiveViewerDocChange?: (doc: UploadedDocument) => void
  onNavigateToMode?: (mode: "findings" | "qa" | "compare" | "actions" | "prepare" | "connect") => void
}

type TypeFilter = "all" | ActionType | "attention"

const ACTION_TYPE_META: Record<
  ActionType,
  {
    label: string
    badgeClass: string
    icon: React.ComponentType<{ className?: string }>
    hint: string
  }
> = {
  review: {
    label: "REVIEW",
    badgeClass: "bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/30",
    icon: FileCheck,
    hint: "Deserves closer human review",
  },
  verify: {
    label: "VERIFY",
    badgeClass: "bg-blue-500/10 text-blue-900 dark:text-blue-300 border-blue-500/30",
    icon: Search,
    hint: "Check against commercial terms or other sources",
  },
  prepare: {
    label: "PREPARE",
    badgeClass: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border-emerald-500/30",
    icon: CheckSquare,
    hint: "Information or certificates to gather",
  },
  ask: {
    label: "ASK",
    badgeClass: "bg-purple-500/10 text-purple-900 dark:text-purple-300 border-purple-500/30",
    icon: HelpCircle,
    hint: "Questions to raise with the other party",
  },
  track: {
    label: "TRACK",
    badgeClass: "bg-cyan-500/10 text-cyan-900 dark:text-cyan-300 border-cyan-500/30",
    icon: Clock,
    hint: "Time-sensitive date or notice window",
  },
}

export function ActionMapPanel({
  currentDocument,
  analysisResult,
  comparisonResult,
  comparisonDocB,
  actions: externalActions,
  selectedFindingId: initialSelectedFindingId,
  onActionsChange,
  onSelectEvidence,
  onActiveViewerDocChange,
  onNavigateToMode,
}: ActionMapPanelProps) {
  const [internalActions, setInternalActions] = React.useState<ActionItem[]>([])
  const actions = externalActions !== undefined ? externalActions : internalActions
  const setActions = React.useCallback(
    (actionUpdater: ActionItem[] | ((prev: ActionItem[]) => ActionItem[])) => {
      if (typeof actionUpdater === "function") {
        setInternalActions((prev) => {
          const current = externalActions !== undefined ? externalActions : prev
          const updated = actionUpdater(current)
          onActionsChange?.(updated)
          return updated
        })
      } else {
        setInternalActions(actionUpdater)
        onActionsChange?.(actionUpdater)
      }
    },
    [externalActions, onActionsChange]
  )

  const [loading, setLoading] = React.useState(false)
  const [loadingStep, setLoadingStep] = React.useState(0)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "open" | "reviewed">("all")
  const [isGenerated, setIsGenerated] = React.useState(false)

  // Sub-experience view switcher: "map" (overview) or "planner" (7-stage clause planner)
  const [actionViewMode, setActionViewMode] = React.useState<"map" | "planner">(
    initialSelectedFindingId ? "planner" : "map"
  )
  const [activePlannerFindingId, setActivePlannerFindingId] = React.useState<string | undefined>(
    initialSelectedFindingId
  )
  const [prevInitialFindingId, setPrevInitialFindingId] = React.useState<string | undefined>(
    initialSelectedFindingId
  )

  // React to finding selection from Findings panel without cascading effect render
  if (initialSelectedFindingId && initialSelectedFindingId !== prevInitialFindingId) {
    setPrevInitialFindingId(initialSelectedFindingId)
    setActivePlannerFindingId(initialSelectedFindingId)
    setActionViewMode("planner")
  }

  // Truthful loading stages
  React.useEffect(() => {
    if (!loading) {
      return
    }

    const t1 = setTimeout(() => setLoadingStep(1), 1000)
    const t2 = setTimeout(() => setLoadingStep(2), 2400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [loading])

  const handleGenerateActions = async () => {
    if (loading) return
    setLoading(true)
    setLoadingStep(0)
    setErrorMessage(null)

    try {
      let payload: Record<string, unknown>

      // Determine payload: comparison-derived or single document
      if (comparisonResult && comparisonDocB) {
        payload = {
          documentA: currentDocument,
          documentB: comparisonDocB,
          differences: comparisonResult.differences,
          jurisdiction: currentDocument.jurisdiction || "India",
        }
      } else if (analysisResult) {
        payload = {
          document: currentDocument,
          findings: analysisResult.findings,
          jurisdiction: currentDocument.jurisdiction || "India",
        }
      } else {
        payload = {
          document: currentDocument,
          jurisdiction: currentDocument.jurisdiction || "India",
        }
      }

      const res = await fetch("/api/documents/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data?.error || "Action generation failed. Please try again.")
        return
      }

      const generatedActions = data?.result?.actions || []
      setActions(generatedActions)
      setIsGenerated(true)
    } catch {
      setErrorMessage(
        "Network connection failed while contacting the action service. Please try again."
      )
    } finally {
      setLoading(false)
      setLoadingStep(0)
    }
  }

  // Toggle local UI status for an action (strictly UI state)
  const handleToggleStatus = (actionId: string) => {
    setActions((prev) =>
      prev.map((act) => {
        if (act.id !== actionId) return act
        const newStatus: ActionStatus = act.status === "reviewed" ? "open" : "reviewed"
        return { ...act, status: newStatus }
      })
    )
  }

  // Handle navigation to document source
  const handleViewSource = (action: ActionItem, targetDocDesignation?: "A" | "B") => {
    const isComparison = comparisonResult && comparisonDocB

    let targetDoc: UploadedDocument | undefined = currentDocument
    let ev = action.sourceEvidence[0]

    if (isComparison) {
      if (targetDocDesignation === "B" || action.documentDesignation === "B") {
        targetDoc = comparisonDocB
        ev = action.sourceEvidence.find((e) => e.documentId === comparisonDocB.id) || action.sourceEvidence[0]
      } else if (targetDocDesignation === "A" || action.documentDesignation === "A") {
        targetDoc = currentDocument
        ev = action.sourceEvidence.find((e) => e.documentId === currentDocument.id) || action.sourceEvidence[0]
      }
    }

    if (targetDoc && onActiveViewerDocChange) {
      onActiveViewerDocChange(targetDoc)
    }

    if (ev) {
      onSelectEvidence({
        document: targetDoc,
        startLine: ev.startLine,
        endLine: ev.endLine,
        sourceText: ev.sourceText,
      })
    }
  }

  // Metrics and counts
  const totalCount = actions.length
  const attentionCount = actions.filter((a) => a.priority === "attention").length
  const reviewedCount = actions.filter((a) => a.status === "reviewed").length
  const openCount = totalCount - reviewedCount

  // Filtering
  const filteredActions = React.useMemo(() => {
    return actions.filter((act) => {
      // Status filter
      if (statusFilter === "open" && act.status !== "open") return false
      if (statusFilter === "reviewed" && act.status !== "reviewed") return false

      // Type filter
      if (typeFilter === "attention") return act.priority === "attention"
      if (typeFilter !== "all" && act.type !== typeFilter) return false

      return true
    })
  }, [actions, statusFilter, typeFilter])

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Experience Selector: Map vs Planner */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-card border border-border/80 p-2 rounded-xl shadow-2xs">
        <div className="flex items-center gap-1 bg-paper p-1 rounded-lg border border-border/70">
          <button
            type="button"
            id="view-tab-action-map"
            onClick={() => setActionViewMode("map")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              actionViewMode === "map"
                ? "bg-card text-ink-primary font-semibold shadow-2xs border border-border/60"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            Clause Action Map
          </button>
          <button
            type="button"
            id="view-tab-action-planner"
            onClick={() => setActionViewMode("planner")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              actionViewMode === "planner"
                ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            <Sparkles className="size-3" />
            <span>Legal Action Planner</span>
          </button>
        </div>

        <div className="text-[11px] text-ink-muted px-2 hidden sm:block">
          {actionViewMode === "planner"
            ? "7-step clause-grounded pathway"
            : "Contract-wide action matrix"}
        </div>
      </div>

      {actionViewMode === "planner" ? (
        <LegalActionPlannerPanel
          currentDocument={currentDocument}
          analysisResult={analysisResult}
          actions={actions}
          selectedFindingId={activePlannerFindingId}
          onActionsChange={setActions}
          onSelectEvidence={onSelectEvidence}
          onNavigateToMode={onNavigateToMode}
        />
      ) : (
        <>
          {/* Editorial Header */}
          <div className="rounded-xl border border-border/80 bg-card p-4 md:p-5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Compass className="size-4 text-primary shrink-0" />
                  <h3 className="font-serif text-base font-bold text-ink-primary">
                    Clause-to-Action Map
                  </h3>
              {isGenerated && totalCount > 0 && (
                <Badge
                  variant={attentionCount > 0 ? "attention" : "outline"}
                  size="sm"
                  className={
                    attentionCount > 0
                      ? "bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/20 text-[11px]"
                      : "text-[11px]"
                  }
                >
                  {attentionCount > 0 ? `${attentionCount} need attention` : `${totalCount} verified items`}
                </Badge>
              )}
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Transforms verified findings into actionable follow-up items:{" "}
              <span className="font-medium text-ink-primary">
                Clause → Meaning → Why it matters → What to check → Source
              </span>
            </p>
          </div>

          {isGenerated && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateActions}
              disabled={loading}
              className="gap-1.5 text-xs h-8 shrink-0 self-start sm:self-auto"
            >
              <RotateCcw className={`size-3 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Map</span>
            </Button>
          )}
        </div>

        {/* Initial Gate State: Prompt user to generate actions if not generated yet */}
        {!isGenerated && !loading && !errorMessage && (
          <div className="py-4 space-y-4">
            <div className="rounded-lg bg-paper p-4 border border-border/70 space-y-2">
              <span className="font-semibold text-xs text-ink-primary uppercase tracking-wider">
                Controlled Action Categories
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink-secondary pt-1">
                <div className="flex items-start gap-2">
                  <FileCheck className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink-primary">Review:</strong> Provisions warranting closer human inspection.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Search className="size-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink-primary">Verify:</strong> Monetary terms, dates, or details to cross-check.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckSquare className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink-primary">Prepare:</strong> Documentation or records explicitly referenced.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <HelpCircle className="size-3.5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink-primary">Ask:</strong> Pertinent questions to clarify with the counterparty.
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <Clock className="size-3.5 text-cyan-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink-primary">Track:</strong> Key milestones, renewals, or notice periods.
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerateActions}
              className="w-full gap-2 shadow-xs font-semibold text-xs h-9"
              disabled={!currentDocument.isTextReadable}
            >
              <Compass className="size-4" />
              <span>
                {comparisonResult
                  ? "Generate Comparison Action Map"
                  : "Generate Clause-to-Action Map"}
              </span>
            </Button>

            <div className="rounded-md bg-paper-contrast/40 border border-border/60 p-2.5 text-[11px] text-ink-muted flex items-start gap-2">
              <Info className="size-3.5 text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Actions are strictly synthesized from verified document evidence. No legal advice or autonomous actions are generated.
              </p>
            </div>
          </div>
        )}

        {/* Truthful Loading State */}
        {loading && (
          <div className="py-8 space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center animate-pulse">
              <Compass className="size-5 animate-spin" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif font-bold text-sm text-ink-primary">
                Synthesizing Action Layer
              </h4>
              <p className="text-xs text-ink-secondary">
                {loadingStep === 0 && "1/3 Reviewing verified clauses..."}
                {loadingStep === 1 && "2/3 Identifying follow-up candidates..."}
                {loadingStep === 2 && "3/3 Linking actions to source citations..."}
              </p>
            </div>

            <div className="w-48 h-1 bg-border/60 rounded-full mx-auto overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{
                  width: loadingStep === 0 ? "30%" : loadingStep === 1 ? "65%" : "95%",
                }}
              />
            </div>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !loading && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50/90 p-4 space-y-3 text-red-950 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-red-950">Action Generation Error</span>
                <p className="text-red-800 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateActions}
              className="gap-1.5 text-xs h-7 border-red-300 text-red-900 hover:bg-red-100"
            >
              <RotateCcw className="size-3" />
              <span>Retry</span>
            </Button>
          </div>
        )}

        {/* Filter and Grouping Controls (visible when actions exist) */}
        {isGenerated && !loading && actions.length > 0 && (
          <div className="space-y-3 pt-1">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs min-w-0">
              <div className="flex flex-wrap items-center gap-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setTypeFilter("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    typeFilter === "all"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-paper text-ink-secondary hover:text-ink-primary border border-border/60"
                  }`}
                >
                  All ({totalCount})
                </button>

                {attentionCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setTypeFilter("attention")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                      typeFilter === "attention"
                        ? "bg-amber-600 text-white font-semibold"
                        : "bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    <span>Needs Attention ({attentionCount})</span>
                  </button>
                )}

                {(["review", "verify", "prepare", "ask", "track"] as ActionType[]).map((type) => {
                  const count = actions.filter((a) => a.type === type).length
                  if (count === 0) return null
                  const meta = ACTION_TYPE_META[type]

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTypeFilter(type)}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                        typeFilter === type
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-paper text-ink-secondary hover:text-ink-primary border border-border/60"
                      }`}
                    >
                      {meta.label} ({count})
                    </button>
                  )
                })}
              </div>

              {/* Status toggles */}
              <div className="flex items-center gap-1 text-[11px] bg-paper p-0.5 rounded-md border border-border/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                    statusFilter === "all"
                      ? "bg-card text-ink-primary font-medium shadow-2xs"
                      : "text-ink-muted hover:text-ink-secondary"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("open")}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                    statusFilter === "open"
                      ? "bg-card text-ink-primary font-medium shadow-2xs"
                      : "text-ink-muted hover:text-ink-secondary"
                  }`}
                >
                  Open ({openCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("reviewed")}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                    statusFilter === "reviewed"
                      ? "bg-card text-ink-primary font-medium shadow-2xs"
                      : "text-ink-muted hover:text-ink-secondary"
                  }`}
                >
                  Reviewed ({reviewedCount})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Items List */}
      {isGenerated && !loading && (
        <div className="space-y-3">
          {filteredActions.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-card p-8 text-center space-y-3">
              <Compass className="size-8 text-ink-muted mx-auto" />
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="font-serif font-bold text-sm text-ink-primary">
                  No Immediate Follow-ups Identified
                </h4>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  No immediate follow-ups matching this filter were identified from the verified document evidence.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter("all")
                  setStatusFilter("all")
                }}
                className="text-xs h-7"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredActions.map((action) => {
              const meta = ACTION_TYPE_META[action.type]
              const Icon = meta.icon
              const isReviewed = action.status === "reviewed"
              const isComparison = Boolean(comparisonResult && comparisonDocB)
              const hasMultipleEvidence = action.sourceEvidence.length > 1

              return (
                <div
                  key={action.id}
                  className={`rounded-xl border transition-all duration-150 p-4 md:p-5 space-y-3.5 shadow-2xs ${
                    isReviewed
                      ? "bg-paper/40 border-border/60 opacity-80"
                      : action.priority === "attention"
                      ? "bg-card border-amber-500/30 hover:border-amber-500/50"
                      : "bg-card border-border/90 hover:border-border"
                  }`}
                >
                  {/* Top Bar: Action Type, Priority, Status */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        size="sm"
                        className={`gap-1 font-mono text-[10px] uppercase font-semibold ${meta.badgeClass}`}
                      >
                        <Icon className="size-3" />
                        <span>{meta.label}</span>
                      </Badge>

                      <Badge
                        variant="outline"
                        size="sm"
                        className={
                          action.priority === "attention"
                            ? "bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/30 text-[10px]"
                            : action.priority === "important"
                            ? "bg-slate-500/10 text-slate-800 dark:text-slate-300 border-slate-500/30 text-[10px]"
                            : "text-[10px] text-ink-muted"
                        }
                      >
                        {action.priority === "attention"
                          ? "Needs attention"
                          : action.priority === "important"
                          ? "Important"
                          : "Standard"}
                      </Badge>
                    </div>

                    {/* UI Status Checkbox Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(action.id)}
                      role="checkbox"
                      aria-checked={isReviewed}
                      aria-label={`Mark "${action.title}" as ${isReviewed ? "open" : "reviewed"}`}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all duration-150 ${
                        isReviewed
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium"
                          : "border-border text-ink-muted hover:text-ink-primary hover:bg-paper"
                      }`}
                    >
                      <CheckCircle2
                        className={`size-3.5 ${
                          isReviewed ? "text-emerald-600" : "text-ink-muted"
                        }`}
                      />
                      <span className="text-[11px]">
                        {isReviewed ? "Marked as reviewed" : "Mark as reviewed"}
                      </span>
                    </button>
                  </div>

                  {/* Title & Core Action */}
                  <div>
                    <h4
                      className={`font-serif text-sm md:text-base font-bold text-ink-primary leading-snug ${
                        isReviewed ? "line-through text-ink-secondary" : ""
                      }`}
                    >
                      {action.title}
                    </h4>
                  </div>

                  {/* Structured Progression: Meaning → Why it matters → What to check/do */}
                  <div className="space-y-2 text-xs leading-relaxed bg-paper/60 p-3.5 rounded-lg border border-border/60">
                    <div>
                      <span className="font-semibold text-ink-primary text-[11px] block pb-0.5">
                        What does it mean?
                      </span>
                      <p className="text-ink-secondary">{action.description}</p>
                    </div>

                    <div className="pt-1.5 border-t border-border/50">
                      <span className="font-semibold text-ink-primary text-[11px] block pb-0.5">
                        Why it matters:
                      </span>
                      <p className="text-ink-secondary">{action.whyItMatters}</p>
                    </div>

                    {action.suggestedStep && (
                      <div className="pt-1.5 border-t border-border/50">
                        <span className="font-semibold text-ink-primary text-[11px] block pb-0.5">
                          What to check or do:
                        </span>
                        <p className="text-ink-primary font-medium">
                          {action.suggestedStep}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Source Evidence Box with Jump Navigation */}
                  <div className="rounded-lg bg-paper-contrast/40 border border-border/70 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-ink-muted">
                      <span className="font-semibold uppercase tracking-wider text-ink-primary">
                        Document Source Grounding
                      </span>
                      <span>
                        {action.sourceEvidence.some((e) => e.verificationStatus === "verified") ? (
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                            <ShieldCheck className="size-3" />
                            Verified Evidence
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                            <AlertTriangle className="size-3" />
                            Unverified Quote
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Quote previews */}
                    <div className="space-y-1.5">
                      {action.sourceEvidence.map((ev, evIdx) => {
                        const isDocB = ev.documentId === comparisonDocB?.id
                        const label = isComparison ? (isDocB ? "Doc B" : "Doc A") : "Lines"

                        return (
                          <div
                            key={evIdx}
                            className="bg-card p-2.5 rounded border border-border/60 space-y-1 font-serif text-[13px] text-ink-primary leading-normal"
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                              <span className="font-medium text-primary">
                                {label} {ev.startLine}–{ev.endLine}
                              </span>
                              <span className="text-[10px] text-ink-muted truncate max-w-44">
                                {ev.documentName || currentDocument.name}
                              </span>
                            </div>
                            <p className="italic text-ink-secondary line-clamp-3">
                              &ldquo;{ev.sourceText}&rdquo;
                            </p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-1 flex items-center gap-2 flex-wrap min-w-0">
                      {isComparison && hasMultipleEvidence ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSource(action, "A")}
                            className="gap-1 text-[11px] h-7 whitespace-nowrap shrink-0"
                          >
                            <ExternalLink className="size-3 text-primary shrink-0" />
                            <span>View in Doc A</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSource(action, "B")}
                            className="gap-1 text-[11px] h-7 whitespace-nowrap shrink-0"
                          >
                            <ExternalLink className="size-3 text-primary shrink-0" />
                            <span>View in Doc B</span>
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSource(action)}
                          className="gap-1 text-[11px] h-7 whitespace-nowrap shrink-0"
                        >
                          <ExternalLink className="size-3 text-primary shrink-0" />
                          <span>View in Document</span>
                        </Button>
                      )}

                      {action.relatedFindingId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActivePlannerFindingId(action.relatedFindingId)
                            setActionViewMode("planner")
                          }}
                          className="gap-1 text-[11px] h-7 text-primary hover:text-primary whitespace-nowrap shrink-0"
                          title="Open 7-step Legal Action Planner for this clause"
                        >
                          <Sparkles className="size-3 shrink-0" />
                          <span>Action Plan</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Legal Boundary Notice */}
      <div className="text-[11px] text-ink-muted text-center pt-2 pb-4 leading-relaxed border-t border-border/60">
        LawLens provides legal information and navigation assistance, not legal advice.
        Status checkboxes are personal workspace markers and do not execute or satisfy legal obligations.
      </div>
        </>
      )}
    </div>
  )
}
