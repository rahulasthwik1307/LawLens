"use client"

import * as React from "react"
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  BookmarkCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ClauseSpecimen {
  id: string
  label: string
  category: "Obligation" | "Dispute" | "Review Point"
  badgeVariant: "default" | "accent" | "attention" | "critical"
  documentTitle: string
  clauseNumber: string
  clauseHeading: string
  originalText: string
  pageRef: string
  explanation: string
  jurisdictionNote: string
  actions: string[]
}

const SPECIMENS: ClauseSpecimen[] = [
  {
    id: "termination",
    label: "Early Termination",
    category: "Obligation",
    badgeVariant: "accent",
    documentTitle: "Commercial Lease Agreement",
    clauseNumber: "Clause 14.2",
    clauseHeading: "Early Termination & Liquidated Damages",
    originalText:
      "Either party may terminate this Agreement prior to expiry of the Term by providing not less than thirty (30) days prior written notice. Upon premature termination by Lessee without Lessor default, Lessee shall pay liquidated damages equivalent to two (2) months base rent.",
    pageRef: "Page 4 · Sec. 14.2 · Paragraph 1",
    explanation:
      "You can terminate this agreement early by providing 30 days written notice. However, if you leave without landlord default, you are contractually required to pay a departure fee equal to 2 months rent.",
    jurisdictionNote:
      "Under Indian Contract Act, 1872 (Section 74), liquidated damages clauses generally require proof of genuine pre-estimated loss rather than punitive penalties.",
    actions: [
      "Track mandatory 30-day written notice requirement",
      "Verify formal notice address listed in Schedule A",
      "Prepare liquidated damages point for legal consultation",
    ],
  },
  {
    id: "arbitration",
    label: "Arbitration Seat",
    category: "Dispute",
    badgeVariant: "default",
    documentTitle: "Master Services Agreement",
    clauseNumber: "Clause 22.1",
    clauseHeading: "Dispute Resolution & Seat of Arbitration",
    originalText:
      "Any dispute arising out of or in connection with this Contract shall be resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Bengaluru, India, and proceedings shall be conducted in English.",
    pageRef: "Page 11 · Sec. 22.1 · Paragraph 2",
    explanation:
      "Disputes cannot be taken directly to regular court; they must be resolved via formal arbitration in Bengaluru under Indian arbitration law.",
    jurisdictionNote:
      "Selecting Bengaluru as the 'Seat' vests supervisory court jurisdiction exclusively with the High Court of Karnataka.",
    actions: [
      "Confirm arbitration costs and procedural rules",
      "Note Bengaluru territorial jurisdiction for filings",
    ],
  },
  {
    id: "noncompete",
    label: "Non-Compete Scope",
    category: "Review Point",
    badgeVariant: "critical",
    documentTitle: "Executive Employment Contract",
    clauseNumber: "Clause 8.3",
    clauseHeading: "Post-Termination Restraint of Trade",
    originalText:
      "The Employee covenants that for a period of twelve (12) months following termination of employment, Employee shall not directly or indirectly engage in any business competing with the Employer within the territory of India.",
    pageRef: "Page 6 · Sec. 8.3 · Paragraph 1",
    explanation:
      "The contract attempts to prohibit you from working for any competitor anywhere in India for 1 year after your employment ends.",
    jurisdictionNote:
      "Section 27 of the Indian Contract Act, 1872 renders post-employment covenants in restraint of trade void, unlike some common law jurisdictions.",
    actions: [
      "Highlight Section 27 Indian Contract Act precedent",
      "Include clause in Human Handoff preparation pack",
      "Seek advice from employment advocate before signing",
    ],
  },
]

export function DocumentLensSpecimen() {
  const [activeId, setActiveId] = React.useState<string>("termination")
  const activeSpecimen = SPECIMENS.find((s) => s.id === activeId) || SPECIMENS[0]

  return (
    <div className="rounded-xl border border-border/80 bg-paper shadow-xs overflow-hidden transition-all duration-200">
      {/* Specimen Header & Selector Bar */}
      <div className="border-b border-border/70 bg-paper-contrast/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
            Interactive Document Lens Specimen
          </span>
          <span className="text-[11px] text-ink-muted hidden sm:inline">
            (Evidence Grounding Demonstration)
          </span>
        </div>

        {/* Clause switch pills */}
        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-background border border-border/60">
          {SPECIMENS.map((specimen) => {
            const isSelected = specimen.id === activeId
            return (
              <button
                key={specimen.id}
                type="button"
                onClick={() => setActiveId(specimen.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-muted/50"
                }`}
              >
                {specimen.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Specimen Comparison Surface */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Original Legal Document Fragment */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-ink-muted" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wide text-ink-secondary">
                Original Legal Document
              </span>
            </div>
            <Badge variant="subtle" size="sm" className="font-mono">
              {activeSpecimen.pageRef}
            </Badge>
          </div>

          {/* Authentic Document Excerpt Container */}
          <div className="relative flex-1 p-4 sm:p-5 rounded-lg border border-border/90 bg-background font-serif text-sm leading-relaxed text-ink-primary shadow-2xs">
            <div className="mb-2.5 pb-2 border-b border-border/50 flex items-center justify-between text-xs text-ink-muted">
              <span className="font-sans font-medium">{activeSpecimen.documentTitle}</span>
              <span className="font-mono font-semibold text-primary">{activeSpecimen.clauseNumber}</span>
            </div>
            <h4 className="font-bold text-sm mb-2 text-ink-primary">
              {activeSpecimen.clauseHeading}
            </h4>
            <p className="italic text-ink-secondary bg-paper-contrast/40 p-3 rounded border-l-2 border-primary/50 text-[13px] leading-relaxed">
              &ldquo;{activeSpecimen.originalText}&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span>Exact contractual excerpt preserved without modification</span>
            </div>
          </div>
        </div>

        {/* Right: LawLens Analysis & Evidence Connection */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="size-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                LawLens Plain Explanation & Evidence
              </span>
            </div>
            <Badge variant={activeSpecimen.badgeVariant} size="sm">
              {activeSpecimen.category}
            </Badge>
          </div>

          {/* Plain language explanation box */}
          <div className="flex-1 space-y-3">
            <div className="p-4 sm:p-5 rounded-lg border border-primary/20 bg-primary/3 space-y-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-primary block mb-1">
                  Plain-Language Meaning
                </span>
                <p className="text-xs sm:text-sm text-ink-primary leading-relaxed">
                  {activeSpecimen.explanation}
                </p>
              </div>

              {/* Jurisdiction context note */}
              <div className="pt-2 border-t border-primary/10">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-muted block mb-0.5">
                  India Jurisdiction Context
                </span>
                <p className="text-[11px] text-ink-secondary leading-normal">
                  {activeSpecimen.jurisdictionNote}
                </p>
              </div>
            </div>

            {/* Actionable Review Checklist Items */}
            <div className="p-3.5 rounded-lg border border-border/80 bg-card space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-primary block">
                Derived Action & Review Items
              </span>
              <ul className="space-y-1.5">
                {activeSpecimen.actions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-ink-secondary">
                    <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Provenance Footer */}
      <div className="border-t border-border/70 bg-paper-contrast/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
        <div className="flex items-center gap-2">
          <BookmarkCheck className="size-3.5 text-emerald-700" />
          <span>Core Flow: <strong>Finding → Explanation → Evidence → Source</strong></span>
        </div>
        <span className="text-ink-secondary font-medium">
          Source verifiable against original document page & clause coordinates
        </span>
      </div>
    </div>
  )
}
