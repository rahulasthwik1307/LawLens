"use client"

import * as React from "react"
import { FileText, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Scale } from "lucide-react"

interface ClauseSpecimen {
  id: string
  label: string
  category: "Obligation" | "Dispute Venue" | "Statutory Review"
  documentTitle: string
  clauseNumber: string
  clauseHeading: string
  originalText: string
  pageRef: string
  explanation: string
  statutoryGrounding: string
  lineCoordinates: string
}

const SPECIMENS: ClauseSpecimen[] = [
  {
    id: "termination",
    label: "Early Termination",
    category: "Obligation",
    documentTitle: "Commercial Lease Agreement",
    clauseNumber: "Clause 14.2",
    clauseHeading: "Early Termination & Liquidated Damages",
    originalText:
      "Either party may terminate this Agreement prior to expiry of the Term by providing not less than thirty (30) days prior written notice. Upon premature termination by Lessee without Lessor default, Lessee shall pay liquidated damages equivalent to two (2) months base rent.",
    pageRef: "Page 4 · Sec. 14.2",
    lineCoordinates: "Lines 142–148",
    explanation:
      "You can terminate early with 30 days written notice. However, leaving without landlord default contractually requires paying a departure fee equal to 2 months rent.",
    statutoryGrounding:
      "Indian Contract Act, 1872 (§74): Liquidated damages clauses require proof of genuine pre-estimated loss rather than arbitrary penalty.",
  },
  {
    id: "arbitration",
    label: "Arbitration Seat",
    category: "Dispute Venue",
    documentTitle: "Master Services Agreement",
    clauseNumber: "Clause 22.1",
    clauseHeading: "Dispute Resolution & Seat",
    originalText:
      "Any dispute arising out of or in connection with this Contract shall be resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Bengaluru, India, and proceedings shall be conducted in English.",
    pageRef: "Page 11 · Sec. 22.1",
    lineCoordinates: "Lines 310–316",
    explanation:
      "Disputes cannot be filed in regular civil court; they must be resolved through binding arbitration in Bengaluru under Indian arbitration law.",
    statutoryGrounding:
      "Arbitration and Conciliation Act, 1996: Naming Bengaluru as 'Seat' vests supervisory court jurisdiction exclusively with the High Court of Karnataka.",
  },
  {
    id: "noncompete",
    label: "Non-Compete Scope",
    category: "Statutory Review",
    documentTitle: "Executive Employment Contract",
    clauseNumber: "Clause 8.3",
    clauseHeading: "Post-Termination Restraint",
    originalText:
      "The Employee covenants that for a period of twelve (12) months following termination of employment, Employee shall not directly or indirectly engage in any business competing with the Employer within the territory of India.",
    pageRef: "Page 6 · Sec. 8.3",
    lineCoordinates: "Lines 188–194",
    explanation:
      "The clause attempts to prohibit you from working for any competitor anywhere in India for 1 full year after your employment concludes.",
    statutoryGrounding:
      "Indian Contract Act, 1872 (§27): Post-employment covenants in restraint of trade are typically void under Indian law, unlike in some foreign jurisdictions.",
  },
]

export function DocumentLensSpecimen() {
  const [activeId, setActiveId] = React.useState<string>("termination")
  const activeSpecimen = SPECIMENS.find((s) => s.id === activeId) || SPECIMENS[0]

  return (
    <div className="rounded-xl border border-border/80 bg-paper shadow-xs overflow-hidden transition-all duration-200">
      {/* Specimen Header & Compact Clause Selector */}
      <div className="border-b border-border/70 bg-paper-contrast/50 px-3.5 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink-primary">
            Interactive Document Lens
          </span>
          <span className="text-[10px] text-ink-muted hidden md:inline">
            · Evidence Grounding Demo
          </span>
        </div>

        {/* Clause Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Document Clause Specimens"
          className="flex items-center gap-1 p-0.5 rounded-lg bg-background/80 border border-border/70"
        >
          {SPECIMENS.map((specimen) => {
            const isSelected = specimen.id === activeId
            return (
              <button
                key={specimen.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveId(specimen.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected
                    ? "bg-ink-primary text-paper shadow-2xs font-semibold"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-muted/60"
                }`}
              >
                {specimen.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Specimen Demonstration Surface (Original Clause ➔ Plain Explanation) */}
      <div
        key={activeSpecimen.id}
        className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 animate-in fade-in duration-200"
      >
        {/* Left: Original Legal Excerpt */}
        <div className="md:col-span-6 flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border border-border/80 bg-background/70 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-ink-muted">
                <FileText className="size-3 text-ink-muted shrink-0" />
                <span className="font-sans font-medium truncate max-w-44">
                  {activeSpecimen.documentTitle}
                </span>
              </div>
              <span className="font-mono text-primary font-semibold text-[10px] bg-primary/8 px-1.5 py-0.5 rounded">
                {activeSpecimen.clauseNumber}
              </span>
            </div>

            <div className="text-xs font-semibold text-ink-primary">
              {activeSpecimen.clauseHeading}
            </div>

            <p className="font-serif italic text-xs leading-relaxed text-ink-primary/90 bg-paper-contrast/40 p-2.5 rounded border-l-2 border-primary/60">
              &ldquo;{activeSpecimen.originalText}&rdquo;
            </p>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-ink-muted font-mono">
            <span>{activeSpecimen.pageRef}</span>
            <span className="text-emerald-700 font-sans font-medium flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              <span>Verbatim Source</span>
            </span>
          </div>
        </div>

        {/* Right: LawLens Plain Explanation & Statutory Context */}
        <div className="md:col-span-6 flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border border-primary/25 bg-primary/2 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <Sparkles className="size-3 text-primary shrink-0" />
                <span className="uppercase tracking-wider text-[10px]">Plain Explanation</span>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">
                {activeSpecimen.category}
              </span>
            </div>

            <p className="font-sans text-xs text-ink-primary leading-relaxed font-normal">
              {activeSpecimen.explanation}
            </p>

            <div className="pt-2 border-t border-primary/15 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block font-semibold">
                Statutory Context
              </span>
              <p className="text-[11px] text-ink-secondary leading-snug">
                {activeSpecimen.statutoryGrounding}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-primary/15 flex items-center justify-between text-[10px] text-ink-muted">
            <span className="font-mono text-primary font-medium">{activeSpecimen.lineCoordinates}</span>
            <span className="text-ink-secondary font-medium">Evidence Grounded</span>
          </div>
        </div>
      </div>

      {/* Provenance Strip */}
      <div className="border-t border-border/70 bg-paper-contrast/30 px-3.5 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
        <div className="flex items-center gap-1.5 text-ink-secondary">
          <span className="font-semibold text-primary font-mono text-[10px]">PROVENANCE</span>
          <span>Source Clause</span>
          <ArrowRight className="size-2.5 text-ink-muted" />
          <span>Verified Evidence</span>
          <ArrowRight className="size-2.5 text-ink-muted" />
          <span className="font-medium text-ink-primary">Plain Meaning</span>
        </div>
        <span className="text-[10px] font-mono text-ink-muted">
          Coordinates preserved without hallucination
        </span>
      </div>
    </div>
  )
}
