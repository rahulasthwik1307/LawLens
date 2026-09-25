"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"

export function DistinctionSpecimen() {
  const [hoveredSide, setHoveredSide] = React.useState<"source" | "explanation" | null>(null)

  return (
    <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4.5 p-1">
      {/* Original Contract Text Card */}
      <div
        onMouseEnter={() => setHoveredSide("source")}
        onMouseLeave={() => setHoveredSide(null)}
        className={`p-5 rounded-xl border transition-all duration-200 bg-background/90 flex flex-col justify-between space-y-4 shadow-2xs ${
          hoveredSide === "source"
            ? "border-ink-primary shadow-xs ring-1 ring-ink-primary/10"
            : hoveredSide === "explanation"
            ? "border-border/60 opacity-80"
            : "border-border/90 hover:border-border"
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink-muted">
              Original Contract Text
            </span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-muted text-ink-secondary">
              Sec. 9.1
            </span>
          </div>

          <div className="text-xs font-semibold text-ink-primary">
            Commercial Lease Agreement
          </div>

          <blockquote className="font-serif text-xs leading-relaxed italic text-ink-primary bg-paper-contrast/40 p-3 rounded-md border-l-2 border-ink-primary/40">
            &ldquo;Neither party shall be liable for failure to perform its obligations hereunder if such failure results from an Act of God, insurrection, or statutory restriction, provided prompt notice is given.&rdquo;
          </blockquote>
        </div>

        <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-[10px] font-mono text-ink-muted">
          <span>Verbatim Legal Source</span>
          <span className="font-sans text-ink-secondary font-medium">Authoritative Serif</span>
        </div>
      </div>

      {/* LawLens Plain Explanation Card */}
      <div
        onMouseEnter={() => setHoveredSide("explanation")}
        onMouseLeave={() => setHoveredSide(null)}
        className={`p-5 rounded-xl border transition-all duration-200 bg-primary/2 flex flex-col justify-between space-y-4 shadow-2xs ${
          hoveredSide === "explanation"
            ? "border-primary shadow-xs ring-1 ring-primary/20"
            : hoveredSide === "source"
            ? "border-primary/20 opacity-85"
            : "border-primary/30 hover:border-primary/50"
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-primary/20">
            <div className="flex items-center gap-1.5 text-primary">
              <Sparkles className="size-3" />
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider">
                LawLens Plain Explanation
              </span>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-primary/25 bg-primary/10 text-primary">
              Derived
            </span>
          </div>

          <div className="text-xs font-semibold text-primary">
            Plain-Language Meaning
          </div>

          <p className="font-sans text-xs leading-relaxed text-ink-primary font-normal bg-card/60 p-3 rounded-md border border-primary/10">
            This is a <strong>Force Majeure clause</strong>. If unexpected major events beyond your control (such as civil unrest, natural disasters, or new statutes) prevent you from performing, you are legally excused from liability, provided you notify the other party promptly in writing.
          </p>
        </div>

        <div className="pt-2.5 border-t border-primary/20 flex items-center justify-between text-[10px] text-ink-muted">
          <span className="text-primary font-medium font-sans">Verified Plain Interpretation</span>
          <span className="font-sans text-ink-secondary font-medium">Contemporary Sans</span>
        </div>
      </div>
    </div>
  )
}
