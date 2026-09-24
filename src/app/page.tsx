import Link from "next/link"
import {
  FileText,
  Search,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Scale,
  Compass,
  FileSearch,
  BookOpen,
  Calendar,
  Lock,
  Layers,
  HelpCircle,
  Landmark,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { DocumentLensSpecimen } from "@/components/specimen/document-lens-specimen"
import { DistinctionSpecimen } from "@/components/specimen/distinction-specimen"
import { CycleProgression } from "@/components/specimen/cycle-progression"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground">
      {/* Redesigned Three-Group Header */}
      <Header />

      <main className="flex-1">
        {/* HERO SECTION — Balanced Editorial Composition with Compact Specimen */}
        <section className="relative pt-8 md:pt-14 pb-12 md:pb-18 border-b border-border/70 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Strong Editorial Message & CTAs */}
              <div className="lg:col-span-5 xl:col-span-5 space-y-5">
                {/* 1. Concise Eyebrow */}
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>India-First Legal Document Navigation</span>
                </div>

                {/* 2. Main Headline (Editorial Serif, 2 lines desktop) */}
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] xl:text-[46px] font-bold tracking-tight text-ink-primary leading-[1.12]">
                  See what matters in your legal documents.
                </h1>

                {/* 3. Supporting Copy (Concise, Plain Language + Grounding) */}
                <p className="text-sm sm:text-base text-ink-secondary leading-relaxed max-w-[46ch]">
                  Transform complex agreements into clear plain-language explanations, verified directly against original clause evidence.
                </p>

                {/* 4. Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <Link
                    href="/workspace"
                    className="group inline-flex items-center justify-center gap-2 rounded-md bg-ink-primary text-paper hover:bg-primary px-5 h-10 text-xs sm:text-sm font-semibold tracking-wide transition-all duration-150 ease-out shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>Start Document Intake</span>
                    <ArrowRight className="size-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                  </Link>
                  <a
                    href="#evidence"
                    className="inline-flex items-center justify-center rounded-md border border-border bg-paper hover:bg-paper-contrast/60 text-ink-primary px-4.5 h-10 text-xs sm:text-sm font-medium transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>Inspect Evidence Model</span>
                  </a>
                </div>

                {/* 5. Credibility / Support Line */}
                <div className="pt-3 border-t border-border/60 space-y-1">
                  <div className="text-xs font-semibold text-ink-primary flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-primary" />
                    <span>Built for documents, not guesses.</span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    Plain-language interpretation · Source verification · Action preparation
                  </p>
                </div>
              </div>

              {/* Right Column: Wide Compact Evidence Demonstration Specimen */}
              <div className="lg:col-span-7 xl:col-span-7" id="evidence">
                <DocumentLensSpecimen />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1 — THE LAWLENS CYCLE (Understand. Verify. Act. Connect.) */}
        <section id="understand" className="py-14 md:py-20 border-b border-border/70 bg-paper/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-2xl space-y-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary block">
                The LawLens Cycle
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink-primary">
                Understand. Verify. Act. Connect.
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                LawLens moves systematically from confusion to evidence-grounded preparation.
                Every conclusion originates in authentic source text before structuring practical next steps.
              </p>
            </div>

            {/* Asymmetric Progressive Cycle with Neutral Initial State */}
            <CycleProgression />
          </div>
        </section>

        {/* SECTION 2 — SOURCE ≠ INTERPRETATION (Original vs. Plain Explanation) */}
        <section className="py-14 md:py-20 border-b border-border/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary">
                  Core Evidence Principle
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink-primary leading-snug">
                  Original legal text stays visually distinct from LawLens explanations.
                </h2>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  Every document finding preserves strict visual and typographic boundaries. You can always tell what your agreement actually says versus what LawLens explains.
                </p>

                <div className="space-y-2.5 pt-1 text-xs text-ink-secondary">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Original Contract Text:</strong> Authoritative serif typography, quotation treatment, and verbatim source metadata.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Plain Explanations:</strong> Contemporary sans-serif typography, explicitly marked as derived analysis.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Traceable Grounding:</strong> Missing or ambiguous clauses are stated directly rather than invented.
                    </span>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Visual Specimen */}
              <div className="lg:col-span-7">
                <DistinctionSpecimen />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — INDIA-FIRST CONTEXT (Product Storytelling) */}
        <section id="jurisdiction" className="py-14 md:py-20 border-b border-border/70 bg-paper/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
                <Landmark className="size-3" />
                <span>Statutory Grounding</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink-primary">
                Built India-First, Designed to Expand
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                LawLens starts with the legal framework users actually operate within — analyzing agreements against Indian statutory codes, standard dispute venues, and established legal aid institutions.
              </p>
            </div>

            {/* Differentiated Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Card 1: Indian Statutory Context (Wide highlight card) */}
              <div className="md:col-span-6 lg:col-span-5 p-5 rounded-xl border border-border/80 bg-card flex flex-col justify-between space-y-4 shadow-2xs hover:border-border transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary">
                      Statutory Framework
                    </span>
                    <Scale className="size-4 text-ink-muted" />
                  </div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-ink-primary">
                    Indian Statutory Context
                  </h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Contracts are examined against core Indian legislation to identify enforceability limits and required procedures.
                  </p>

                  <div className="pt-2 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-paper-contrast border border-border/70 text-ink-primary">
                      Contract Act 1872 (§27, §74)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-paper-contrast border border-border/70 text-ink-primary">
                      Arbitration Act 1996
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-paper-contrast border border-border/70 text-ink-primary">
                      Consumer Protection 2019
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 text-[11px] text-ink-muted">
                  Flags jurisdiction-specific realities such as void post-employment restraints.
                </div>
              </div>

              {/* Card 2: Explicit Jurisdiction Selector (Context-control card) */}
              <div className="md:col-span-6 lg:col-span-4 p-5 rounded-xl border border-primary/25 bg-primary/2 flex flex-col justify-between space-y-4 shadow-2xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary">
                      Context Control
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  </div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-ink-primary">
                    Explicit Jurisdiction Selector
                  </h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Every analysis operates under an explicit jurisdiction context so the system never silently applies foreign law assumptions.
                  </p>

                  {/* UI Preview Pill */}
                  <div className="p-2.5 rounded-lg border border-primary/20 bg-background/80 flex items-center justify-between text-xs">
                    <span className="text-ink-muted text-[11px]">Selected Regime:</span>
                    <span className="font-semibold text-primary flex items-center gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Republic of India (Default)
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-primary/15 text-[11px] text-primary font-medium">
                  Prevents accidental cross-border legal confusion.
                </div>
              </div>

              {/* Card 3: Statutory Handoff Resources (Resource card) */}
              <div className="md:col-span-12 lg:col-span-3 p-5 rounded-xl border border-border/80 bg-card flex flex-col justify-between space-y-4 shadow-2xs hover:border-border transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary">
                      Handoff Portals
                    </span>
                    <ExternalLink className="size-3.5 text-ink-muted" />
                  </div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-ink-primary">
                    Statutory Handoff
                  </h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Connects users to authoritative legal aid institutions and dispute resolution channels when formal assistance is required.
                  </p>

                  <ul className="space-y-1.5 text-xs text-ink-secondary">
                    <li className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      <span>NALSA (National Legal Services)</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      <span>State Legal Services Authorities</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      <span>National Consumer Helpline</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-border/50 text-[11px] text-ink-muted">
                  Official dispute redressal and legal aid pathways.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — SAFETY PRINCIPLES (Safe by Design. Evidence Before Confidence.) */}
        <section id="standards" className="py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border border-border/80 rounded-2xl bg-card p-6 sm:p-8 lg:p-10 shadow-xs space-y-8">
              <div className="max-w-2xl space-y-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary block">
                  Trust & Governance
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
                  Safe by Design. Evidence Before Confidence.
                </h2>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  LawLens is engineered to ensure every finding is verifiable, user agency is strictly preserved, and document text is treated with uncompromising security boundaries.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs text-ink-secondary">
                <div className="space-y-2.5 p-4.5 rounded-xl bg-paper-contrast/40 border border-border/60">
                  <div className="flex items-center gap-2 font-semibold text-ink-primary text-xs">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <Lock className="size-3.5" />
                    </div>
                    <span>Documents are Data</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    Uploaded document text is strictly treated as untrusted data to analyze. Embedded prompt-injection attempts cannot alter application behavior or access internal rules.
                  </p>
                </div>

                <div className="space-y-2.5 p-4.5 rounded-xl bg-paper-contrast/40 border border-border/60">
                  <div className="flex items-center gap-2 font-semibold text-ink-primary text-xs">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <ShieldCheck className="size-3.5" />
                    </div>
                    <span>Zero Autonomous Actions</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    LawLens never automatically files court motions, sends legal notices, or makes binding contractual decisions. The user retains complete agency at every step.
                  </p>
                </div>

                <div className="space-y-2.5 p-4.5 rounded-xl bg-paper-contrast/40 border border-border/60">
                  <div className="flex items-center gap-2 font-semibold text-ink-primary text-xs">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <HelpCircle className="size-3.5" />
                    </div>
                    <span>Honest Uncertainty</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    When document evidence is incomplete, ambiguous, or unstated, LawLens surfaces the limitation directly rather than fabricating confident answers.
                  </p>
                </div>

                <div className="space-y-2.5 p-4.5 rounded-xl bg-paper-contrast/40 border border-border/60">
                  <div className="flex items-center gap-2 font-semibold text-ink-primary text-xs">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <Scale className="size-3.5" />
                    </div>
                    <span>Professional Boundary</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    LawLens produces structured preparation packs to help users have more productive consultations with qualified advocates, never pretending to replace them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Redesigned Minimal Footer */}
      <Footer />
    </div>
  )
}
