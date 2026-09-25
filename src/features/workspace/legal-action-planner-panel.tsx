"use client"

import * as React from "react"
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  ListChecks,
  Search,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  Info,
  Calendar,
  Layers,
  Coins,
  Shield,
  Ban,
  FileX,
  Gavel,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UploadedDocument } from "@/types/document"
import type {
  ActionItem,
  DocumentAnalysisResult,
  FindingCategory,
} from "@/services/ai/types"
import {
  buildLegalActionPlan,
  convertPlanToActionItem,
  getActionableFindings,
  type LegalActionPlan,
} from "@/services/ai/legal-action-planner"

interface LegalActionPlannerPanelProps {
  currentDocument: UploadedDocument
  analysisResult?: DocumentAnalysisResult | null
  actions?: ActionItem[]
  selectedFindingId?: string
  onActionsChange?: (actions: ActionItem[]) => void
  onSelectEvidence: (params: {
    document?: UploadedDocument
    startLine: number
    endLine: number
    sourceText: string
  }) => void
  onNavigateToMode?: (mode: "findings" | "qa" | "compare" | "actions" | "prepare" | "connect") => void
}

const CATEGORY_ICONS: Record<FindingCategory, React.ComponentType<{ className?: string }>> = {
  parties: Compass,
  dates: Calendar,
  monetary: Coins,
  rights: Shield,
  obligations: Layers,
  restrictions: Ban,
  termination: FileX,
  dispute_resolution: Gavel,
  review_points: AlertCircle,
}

export function LegalActionPlannerPanel({
  currentDocument,
  analysisResult,
  actions = [],
  selectedFindingId: initialSelectedFindingId,
  onActionsChange,
  onSelectEvidence,
  onNavigateToMode,
}: LegalActionPlannerPanelProps) {
  // Get all actionable findings from document analysis
  const actionableFindings = React.useMemo(() => {
    if (!analysisResult?.findings) return []
    return getActionableFindings(analysisResult.findings)
  }, [analysisResult])

  // Active finding state
  const [activeFindingId, setActiveFindingId] = React.useState<string>(() => {
    if (initialSelectedFindingId) {
      const match = actionableFindings.find((f) => f.id === initialSelectedFindingId)
      if (match) return match.id
    }
    return actionableFindings[0]?.id || ""
  })

  // Synchronize if prop changes externally during render
  const [prevSelectedFindingId, setPrevSelectedFindingId] = React.useState(initialSelectedFindingId)
  if (initialSelectedFindingId !== prevSelectedFindingId) {
    setPrevSelectedFindingId(initialSelectedFindingId)
    if (initialSelectedFindingId) {
      const match = actionableFindings.find((f) => f.id === initialSelectedFindingId)
      if (match) {
        setActiveFindingId(match.id)
      }
    }
  }

  const activeFinding = React.useMemo(() => {
    return actionableFindings.find((f) => f.id === activeFindingId) || actionableFindings[0]
  }, [actionableFindings, activeFindingId])

  // Interactive step completion tracking per finding
  const [completedSteps, setCompletedSteps] = React.useState<Record<string, boolean>>({})

  // Copy feedback state
  const [copiedQuestions, setCopiedQuestions] = React.useState(false)
  const [addedToPack, setAddedToPack] = React.useState(false)

  // Generate current plan
  const plan: LegalActionPlan | null = React.useMemo(() => {
    if (!activeFinding) return null
    return buildLegalActionPlan({
      finding: activeFinding,
      document: currentDocument,
      allFindings: analysisResult?.findings || [],
      existingActions: actions,
      jurisdiction: currentDocument.jurisdiction || "India",
    })
  }, [activeFinding, currentDocument, analysisResult, actions])

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }))
  }

  const handleCopyQuestions = () => {
    if (!plan) return
    const text = plan.questionsToAskLawyer
      .map((q, idx) => `${idx + 1}. ${q.question} (Purpose: ${q.whyAskThis})`)
      .join("\n\n")

    navigator.clipboard.writeText(
      `LawLens Professional Consultation Questions for: ${plan.findingTitle}\nSource: ${currentDocument.name}, Lines ${plan.evidence.startLine}-${plan.evidence.endLine}\n\n${text}`
    )
    setCopiedQuestions(true)
    setTimeout(() => setCopiedQuestions(false), 2000)
  }

  const handleAddToPack = () => {
    if (!plan || !onActionsChange) return
    const actionItem = convertPlanToActionItem(plan, currentDocument)

    // Check if already in actions
    const exists = actions.some((a) => a.relatedFindingId === plan.findingId)
    if (exists) {
      onActionsChange(
        actions.map((a) => (a.relatedFindingId === plan.findingId ? actionItem : a))
      )
    } else {
      onActionsChange([...actions, actionItem])
    }

    setAddedToPack(true)
    setTimeout(() => setAddedToPack(false), 2500)
  }

  if (!analysisResult || actionableFindings.length === 0) {
    return (
      <div className="rounded-xl border border-border/80 bg-card p-6 md:p-8 text-center space-y-3.5">
        <Compass className="size-8 text-ink-muted mx-auto" />
        <div className="space-y-1 max-w-md mx-auto">
          <h4 className="font-serif font-bold text-sm md:text-base text-ink-primary">
            No Verified Findings Available Yet
          </h4>
          <p className="text-xs text-ink-secondary leading-relaxed">
            The Legal Action Planner structures verified document findings into plain-language explanations, what to check, possible next steps, and questions for professional review.
          </p>
        </div>
        {onNavigateToMode && (
          <Button
            size="sm"
            onClick={() => onNavigateToMode("findings")}
            className="text-xs gap-1.5 h-8"
          >
            <span>Run Document Analysis in Findings</span>
            <ArrowRight className="size-3" />
          </Button>
        )}
      </div>
    )
  }

  if (!plan || !activeFinding) return null

  const CatIcon = CATEGORY_ICONS[plan.findingCategory] || Compass

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Finding Selector Strip */}
      <div className="rounded-xl border border-border/80 bg-paper p-3 md:p-3.5 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-wider">
            Select Clause to Plan ({actionableFindings.length} Available)
          </span>
          <span className="text-[11px] text-ink-secondary">
            Clause {actionableFindings.findIndex((f) => f.id === activeFinding.id) + 1} of{" "}
            {actionableFindings.length}
          </span>
        </div>

        {/* Scrollable / wrapping clause pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 min-w-0">
          {actionableFindings.map((f) => {
            const isSelected = f.id === activeFinding.id
            const Icon = CATEGORY_ICONS[f.category] || Compass
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFindingId(f.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all duration-150 border max-w-full min-w-0 ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold border-primary shadow-2xs"
                    : "bg-paper text-ink-secondary hover:text-ink-primary border-border/70 hover:bg-paper-contrast"
                }`}
              >
                <Icon className="size-3 shrink-0" />
                <span className="truncate max-w-36 @[420px]/ai:max-w-60">{f.title}</span>
                {f.evidence && (
                  <span
                    className={`font-mono text-[10px] shrink-0 ${
                      isSelected ? "text-primary-foreground/80" : "text-ink-muted"
                    }`}
                  >
                    L{f.evidence.startLine}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Legal Action Planner Card */}
      <div className="rounded-xl border border-border/90 bg-card p-4 md:p-6 shadow-2xs space-y-5 min-w-0 @container/planner">
        {/* Header Row: Category Badge + Title + Verification Status */}
        <div className="space-y-2 pb-4 border-b border-border/60 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <Badge
                variant="outline"
                size="sm"
                className="gap-1 font-mono text-[10px] uppercase font-semibold bg-primary/10 text-primary border-primary/20 shrink-0"
              >
                <CatIcon className="size-3 shrink-0" />
                <span className="whitespace-nowrap">{plan.findingCategory.replace(/_/g, " ")}</span>
              </Badge>

              <Badge
                variant="outline"
                size="sm"
                className={`gap-1 font-mono text-[10px] shrink-0 ${
                  plan.status === "verified"
                    ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 font-semibold"
                    : "bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/30"
                }`}
              >
                {plan.status === "verified" && <ShieldCheck className="size-3 shrink-0" />}
                <span className="whitespace-nowrap">
                  {plan.status === "verified"
                    ? "Verified Grounding"
                    : plan.status === "needs_review"
                    ? "Needs Review"
                    : "Review Suggested"}
                </span>
              </Badge>

              <span className="font-mono text-xs text-ink-muted whitespace-nowrap">
                Lines {plan.evidence.startLine}–{plan.evidence.endLine}
              </span>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToPack}
                className="h-7 text-xs gap-1 text-ink-secondary hover:text-ink-primary whitespace-nowrap"
              >
                {addedToPack ? (
                  <>
                    <Check className="size-3 text-emerald-600 shrink-0" />
                    <span>Added to Briefing</span>
                  </>
                ) : (
                  <>
                    <ListChecks className="size-3 shrink-0" />
                    <span>Send to Prep Pack</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <h3 className="font-serif text-base md:text-lg font-bold text-ink-primary leading-snug wrap-break-word">
            {plan.findingTitle}
          </h3>
        </div>

        {/* 1. What the document says (verbatim / concise excerpt) */}
        <div className="rounded-lg bg-paper/70 border border-border/70 p-3.5 space-y-1.5 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted font-bold block">
            What the Document Says
          </span>
          <blockquote className="font-serif text-xs md:text-sm text-ink-primary italic border-l-2 border-primary/60 pl-3 py-0.5 leading-relaxed bg-paper-contrast/30 rounded-r wrap-break-word">
            &ldquo;{plan.whatItSays}&rdquo;
          </blockquote>
        </div>

        {/* 2 & 3. What it means & Why it matters (Editorial 2-Column or Stacked based on AI container width) */}
        <div className="grid grid-cols-1 @[540px]/ai:grid-cols-2 gap-3.5 min-w-0">
          {/* What it means */}
          <div className="rounded-lg border border-border/70 bg-paper/50 p-3.5 space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 pb-1 border-b border-border/40">
              <BookOpen className="size-3.5 text-primary shrink-0" />
              <h4 className="font-serif text-xs md:text-[13px] font-bold text-ink-primary">
                What It Means
              </h4>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed pt-0.5 wrap-break-word">
              {plan.whatItMeans}
            </p>
          </div>

          {/* Why it matters */}
          <div className="rounded-lg border border-border/70 bg-paper/50 p-3.5 space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 pb-1 border-b border-border/40">
              <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
              <h4 className="font-serif text-xs md:text-[13px] font-bold text-ink-primary">
                Why It Matters
              </h4>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed pt-0.5 wrap-break-word">
              {plan.whyItMatters}
            </p>
          </div>
        </div>

        {/* 4. What to Check (Related Clauses & Dependencies) */}
        <div className="rounded-lg border border-border/70 bg-paper/40 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/50">
            <div className="flex items-center gap-1.5">
              <Search className="size-3.5 text-blue-600 shrink-0" />
              <h4 className="font-serif text-xs md:text-[13px] font-bold text-ink-primary">
                What to Check in the Document
              </h4>
            </div>
            <span className="font-mono text-[10px] text-ink-muted">
              {plan.whatToCheck.length} related cross-reference{plan.whatToCheck.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2">
            {plan.whatToCheck.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border/60 bg-card p-2.5 flex flex-col @[480px]/ai:flex-row @[480px]/ai:items-center justify-between gap-2 text-xs min-w-0"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-ink-primary font-serif">
                      {item.label}
                    </span>
                    {item.startLine && (
                      <span className="font-mono text-[10px] text-primary px-1.5 py-0.2 rounded bg-primary/10 whitespace-nowrap">
                        Lines {item.startLine}–{item.endLine || item.startLine}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-secondary wrap-break-word">{item.details}</p>
                </div>

                {item.startLine && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onSelectEvidence({
                        document: currentDocument,
                        startLine: item.startLine!,
                        endLine: item.endLine || item.startLine!,
                        sourceText: item.sourceText || item.label,
                      })
                    }
                    className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary self-start @[480px]/ai:self-auto shrink-0 whitespace-nowrap"
                  >
                    <span>View in text</span>
                    <ExternalLink className="size-2.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 5. Possible Next Steps (Interactive Operational Checklist) */}
        <div className="rounded-lg border border-border/70 bg-paper/50 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/50">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
              <h4 className="font-serif text-xs md:text-[13px] font-bold text-ink-primary">
                Possible Next Steps (Informational Review)
              </h4>
            </div>
            <span className="font-mono text-[10px] text-ink-muted">
              {plan.possibleNextSteps.filter((s) => completedSteps[s.id]).length} /{" "}
              {plan.possibleNextSteps.length} checked
            </span>
          </div>

          <div className="space-y-2">
            {plan.possibleNextSteps.map((step) => {
              const isChecked = Boolean(completedSteps[step.id])
              return (
                <div
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault()
                      toggleStep(step.id)
                    }
                  }}
                  className={`rounded-md border p-2.5 flex items-start gap-2.5 cursor-pointer transition-all duration-150 select-none ${
                    isChecked
                      ? "bg-emerald-500/5 border-emerald-500/30 text-ink-muted"
                      : "bg-card border-border/70 hover:border-primary/40"
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <div
                      className={`size-4 rounded border flex items-center justify-center transition-colors ${
                        isChecked
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-border/80 bg-paper"
                      }`}
                    >
                      {isChecked && <Check className="size-3" />}
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-primary shrink-0">
                        {String(step.stepNumber).padStart(2, "0")}
                      </span>
                      <p
                        className={`font-medium ${
                          isChecked ? "line-through text-ink-secondary" : "text-ink-primary"
                        }`}
                      >
                        {step.text}
                      </p>
                    </div>
                    {step.detail && (
                      <p className="text-[11px] text-ink-muted pl-6">{step.detail}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 6. Questions to Ask a Lawyer (Tailored for Professional Consultation) */}
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-purple-500/15">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="size-3.5 text-purple-700 dark:text-purple-300 shrink-0" />
              <h4 className="font-serif text-xs md:text-[13px] font-bold text-ink-primary">
                Questions to Ask a Lawyer
              </h4>
            </div>
            <button
              type="button"
              onClick={handleCopyQuestions}
              className="text-[11px] font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1 transition-colors"
            >
              {copiedQuestions ? (
                <>
                  <Check className="size-3 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy Questions</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            {plan.questionsToAskLawyer.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-md border border-purple-500/20 bg-card p-2.5 space-y-1 text-xs"
              >
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[10px] font-bold text-purple-700 dark:text-purple-300 shrink-0 pt-0.5">
                    Q{idx + 1}
                  </span>
                  <p className="font-semibold text-ink-primary leading-snug">
                    {q.question}
                  </p>
                </div>
                <p className="text-[11px] text-ink-muted pl-5">
                  <strong className="text-ink-secondary font-medium">Why ask:</strong>{" "}
                  {q.whyAskThis}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Evidence Grounding & Document Navigation */}
        <div className="rounded-lg border border-border/70 bg-paper/60 p-3 flex flex-col @[480px]/ai:flex-row @[480px]/ai:items-center justify-between gap-2.5 text-xs min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <div className="space-y-0.5 min-w-0">
              <span className="font-semibold text-ink-primary text-xs block">
                Source Document Grounding
              </span>
              <p className="text-[11px] text-ink-muted truncate">
                {currentDocument.name} · Lines {plan.evidence.startLine}–{plan.evidence.endLine}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onSelectEvidence({
                document: currentDocument,
                startLine: plan.evidence.startLine,
                endLine: plan.evidence.endLine,
                sourceText: plan.evidence.sourceText,
              })
            }
            className="h-7 text-xs gap-1.5 self-start @[480px]/ai:self-auto shrink-0 whitespace-nowrap"
          >
            <span>View in Document</span>
            <ExternalLink className="size-3" />
          </Button>
        </div>

        {/* Boundary Notice & Connect Handoff */}
        <div className="rounded-lg border border-border/60 bg-paper-contrast/40 p-3 text-xs flex flex-col @[480px]/ai:flex-row @[480px]/ai:items-center justify-between gap-2.5 text-ink-muted min-w-0">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Info className="size-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed wrap-break-word">
              {plan.disclaimer}
            </p>
          </div>

          {onNavigateToMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToMode("connect")}
              className="text-[11px] h-7 gap-1 text-primary hover:text-primary shrink-0 self-start @[480px]/ai:self-auto whitespace-nowrap"
            >
              <span>Explore Connect Resources</span>
              <ChevronRight className="size-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
