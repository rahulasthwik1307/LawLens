"use client"

import * as React from "react"
import { Loader2, CheckCircle2, ShieldCheck, Scale } from "lucide-react"

interface AnalysisLoadingViewProps {
  documentName: string
}

interface Stage {
  id: string
  title: string
  detail: string
}

const ANALYSIS_STAGES: Stage[] = [
  {
    id: "normalize",
    title: "Normalizing document & isolating untrusted stream",
    detail: "Indexing line boundaries and establishing security containment.",
  },
  {
    id: "provisions",
    title: "Identifying parties, covenants, and dates",
    detail: "Consulting AI service under Indian legal framework constraints.",
  },
  {
    id: "schema",
    title: "Validating structured finding schema",
    detail: "Verifying typed output against strict Zod contract models.",
  },
  {
    id: "grounding",
    title: "Verifying evidence quotes against source lines",
    detail: "Performing substring verification to reject ungrounded claims.",
  },
  {
    id: "presentation",
    title: "Assembling verified legal interpretation",
    detail: "Formatting calibrated findings for dual-panel inspection.",
  },
]

export function AnalysisLoadingView({ documentName }: AnalysisLoadingViewProps) {
  const [currentStageIndex, setCurrentStageIndex] = React.useState(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return ANALYSIS_STAGES.length - 1
    }
    return 0
  })

  React.useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReducedMotion) {
      return
    }

    // Progress through truthful stages
    const timer = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < ANALYSIS_STAGES.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 1800)

    return () => clearInterval(timer)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-border/80 bg-card p-5 @[540px]/ai:p-8 space-y-6 shadow-xs animate-in fade-in duration-200 min-w-0"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-border/60 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Loader2 className="size-5 animate-spin motion-reduce:animate-none" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-lg font-bold text-ink-primary wrap-break-word">
              Analyzing Document
            </h3>
            <p className="text-xs text-ink-secondary wrap-break-word">
              Extracting evidence-grounded provisions from &ldquo;{documentName}&rdquo;
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-muted bg-paper px-2.5 py-1 rounded border border-border/70 shrink-0">
          <Scale className="size-3 text-primary" />
          <span>India Context</span>
        </div>
      </div>

      {/* Progress Stages */}
      <div className="space-y-4 min-w-0">
        {ANALYSIS_STAGES.map((stage, idx) => {
          const isFinished = idx < currentStageIndex
          const isCurrent = idx === currentStageIndex
          const isPending = idx > currentStageIndex

          return (
            <div
              key={stage.id}
              className={`flex items-start gap-3 transition-opacity duration-300 min-w-0 ${
                isPending ? "opacity-35" : "opacity-100"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isFinished ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="size-4 text-primary animate-spin motion-reduce:animate-none" />
                ) : (
                  <div className="size-4 rounded-full border border-border/80 bg-paper" />
                )}
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <p
                  className={`text-xs font-semibold wrap-break-word ${
                    isCurrent
                      ? "text-primary"
                      : isFinished
                      ? "text-ink-primary"
                      : "text-ink-muted"
                  }`}
                >
                  {stage.title}
                </p>
                <p className="text-[11px] text-ink-muted leading-relaxed wrap-break-word">
                  {stage.detail}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reassurance Notice */}
      <div className="pt-2 border-t border-border/50 text-[11px] text-ink-muted flex items-center gap-2 min-w-0">
        <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
        <span className="wrap-break-word">Original document remains read-only and isolated.</span>
      </div>
    </div>
  )
}
