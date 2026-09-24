"use client"

import * as React from "react"
import { BookOpen, FileSearch, Calendar, Compass, ArrowRight } from "lucide-react"

interface CycleStage {
  id: string
  number: string
  title: string
  tagline: string
  description: string
  focusPoint: string
  icon: React.ComponentType<{ className?: string }>
}

const STAGES: CycleStage[] = [
  {
    id: "understand",
    number: "01",
    title: "Understand",
    tagline: "Plain-Language Translation",
    description:
      "Translates dense contractual clauses and legal jargon into clear, accessible language while strictly preserving the authentic legal meaning.",
    focusPoint: "Language simplification without loss of contractual nuance",
    icon: BookOpen,
  },
  {
    id: "verify",
    number: "02",
    title: "Verify",
    tagline: "Evidence Grounding",
    description:
      "Connects every finding to exact document coordinates, clause numbers, and verbatim excerpts. No ungrounded claims or hallucinated citations.",
    focusPoint: "Strict evidence provenance and line-level traceability",
    icon: FileSearch,
  },
  {
    id: "act",
    number: "03",
    title: "Act",
    tagline: "Obligation & Deadline Extraction",
    description:
      "Extracts structured review points: explicit party obligations, notice deadlines, payment schedules, and critical conditional terms.",
    focusPoint: "Actionable obligations, timeframes, and condition checklists",
    icon: Calendar,
  },
  {
    id: "connect",
    number: "04",
    title: "Connect",
    tagline: "Professional Preparation Pack",
    description:
      "Compiles structured consultation packs so you arrive at legal consultations with organized facts, cited clauses, and specific questions.",
    focusPoint: "Advocate handoff and statutory legal aid navigation",
    icon: Compass,
  },
]

export function CycleProgression() {
  const [activeStage, setActiveStage] = React.useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Subtle Step Progression Flow Indicator */}
      <div className="hidden sm:flex items-center justify-between text-xs text-ink-muted border-b border-border/60 pb-3">
        {STAGES.map((stage, idx) => (
          <React.Fragment key={stage.id}>
            <div
              className={`flex items-center gap-2 cursor-pointer transition-colors duration-150 ${
                activeStage === stage.id ? "text-primary font-semibold" : "hover:text-ink-primary"
              }`}
              onMouseEnter={() => setActiveStage(stage.id)}
              onMouseLeave={() => setActiveStage(null)}
            >
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  activeStage === stage.id
                    ? "bg-primary text-primary-foreground font-bold"
                    : "bg-paper-contrast text-ink-secondary"
                }`}
              >
                {stage.number}
              </span>
              <span className="font-medium text-xs">{stage.title}</span>
            </div>
            {idx < STAGES.length - 1 && (
              <div className="flex-1 mx-3 h-px bg-border/80" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 4 Cards Grid - Controlled Asymmetry with Neutral Initial State */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {STAGES.map((stage) => {
          const Icon = stage.icon
          const isHovered = activeStage === stage.id

          return (
            <div
              key={stage.id}
              tabIndex={0}
              onMouseEnter={() => setActiveStage(stage.id)}
              onMouseLeave={() => setActiveStage(null)}
              onFocus={() => setActiveStage(stage.id)}
              onBlur={() => setActiveStage(null)}
              className={`group p-5 rounded-xl border transition-all duration-200 ease-out bg-card flex flex-col justify-between space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isHovered
                  ? "border-primary/60 shadow-xs -translate-y-0.5 bg-paper"
                  : "border-border/80 hover:border-border/90 shadow-2xs"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded transition-colors duration-150 ${
                      isHovered
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-ink-secondary"
                    }`}
                  >
                    STAGE {stage.number}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150 ${
                      isHovered
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/50 text-ink-muted group-hover:text-ink-primary"
                    }`}
                  >
                    <Icon className="size-3.5" />
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-primary group-hover:text-primary transition-colors duration-150">
                    {stage.title}
                  </h3>
                  <span className="text-[11px] font-medium text-ink-muted block mt-0.5">
                    {stage.tagline}
                  </span>
                </div>

                <p className="text-xs text-ink-secondary leading-relaxed">
                  {stage.description}
                </p>
              </div>

              <div
                className={`pt-3 border-t text-[11px] leading-snug transition-colors duration-150 ${
                  isHovered
                    ? "border-primary/20 text-primary font-medium"
                    : "border-border/50 text-ink-muted"
                }`}
              >
                {stage.focusPoint}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
