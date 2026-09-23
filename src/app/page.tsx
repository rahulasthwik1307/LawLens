import Link from "next/link"
import {
  FileText,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Scale,
  Compass,
  FileSearch,
  BookOpen,
  Calendar,
  Lock,
  Layers,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { DocumentLensSpecimen } from "@/components/specimen/document-lens-specimen"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground">
      {/* Top Application Header */}
      <Header />

      <main className="flex-1">
        {/* HERO SECTION — Split Editorial Composition */}
        <section className="relative pt-8 md:pt-14 pb-12 md:pb-20 border-b border-border/70 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Left Editorial Value Proposition (Strict max 4 text elements) */}
              <div className="lg:col-span-6 space-y-6">
                {/* 1. Eyebrow */}
                <div className="flex items-center gap-2">
                  <Badge variant="jurisdiction">
                    Jurisdiction: India (Default)
                  </Badge>
                  <span className="text-xs text-ink-muted hidden sm:inline">
                    · Legal Document Navigation
                  </span>
                </div>

                {/* 2. Headline (Max 2 lines on desktop) */}
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink-primary leading-[1.12]">
                  See what matters in your legal documents.
                </h1>

                {/* 3. Subtext (Max 20 words, max 3 lines) */}
                <p className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-[54ch]">
                  Transform complex contractual language into plain-language clarity, verified directly against original document evidence.
                </p>

                {/* 4. CTAs (Single intent, 1 primary + 1 secondary) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <a
                    href="#evidence"
                    className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm px-5 h-11 text-sm md:text-base font-semibold transition-all duration-100 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span>Inspect Evidence Model</span>
                    <ArrowRight className="size-4 ml-1.5" />
                  </a>
                  <a
                    href="#understand"
                    className="inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted hover:border-foreground/20 shadow-xs px-5 h-11 text-sm md:text-base font-medium transition-all duration-100 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span>View Methodology</span>
                  </a>
                </div>

                {/* Safe Boundary Micro-Strip (Non-decorative assurance) */}
                <div className="pt-4 border-t border-border/60 flex items-center gap-2 text-xs text-ink-muted">
                  <ShieldCheck className="size-4 text-primary shrink-0" />
                  <span>
                    Legal information and preparation assistance — not a substitute for professional counsel.
                  </span>
                </div>
              </div>

              {/* Right: Document Inspection Lens Specimen (Interactive Preview) */}
              <div className="lg:col-span-6" id="evidence">
                <DocumentLensSpecimen />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1 — 4-STAGE LEGAL NAVIGATION METHODOLOGY */}
        <section id="understand" className="py-16 md:py-24 border-b border-border/70 bg-paper/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary block mb-2">
                The LawLens Cycle
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink-primary mb-3">
                Understand. Verify. Act. Connect.
              </h2>
              <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
                LawLens rejects generic chatbot guesswork. The system moves the user systematically
                from confusion to evidence-grounded preparation.
              </p>
            </div>

            {/* Asymmetric 4-Part Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 01. Understand */}
              <div className="p-6 rounded-lg border border-border/80 bg-card flex flex-col justify-between space-y-4 hover:border-border transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                      STAGE 01
                    </span>
                    <BookOpen className="size-4 text-ink-muted" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-ink-primary pt-1">
                    Understand
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    Translates dense contractual clauses and legal jargon into plain-language explanations while preserving the precise contractual meaning.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-[11px] text-ink-muted">
                  Focus: Language simplification without loss of nuance.
                </div>
              </div>

              {/* 02. Verify */}
              <div className="p-6 rounded-lg border border-primary/30 bg-primary/2 flex flex-col justify-between space-y-4 shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                      STAGE 02
                    </span>
                    <FileSearch className="size-4 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-ink-primary pt-1">
                    Verify
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    Connects every derived finding to exact page coordinates, clause numbers, and original document excerpts. No ungrounded claims.
                  </p>
                </div>
                <div className="pt-3 border-t border-primary/20 text-[11px] text-primary font-medium">
                  Focus: Strict evidence provenance and traceability.
                </div>
              </div>

              {/* 03. Act */}
              <div className="p-6 rounded-lg border border-border/80 bg-card flex flex-col justify-between space-y-4 hover:border-border transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                      STAGE 03
                    </span>
                    <Calendar className="size-4 text-ink-muted" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-ink-primary pt-1">
                    Act
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    Surfaces structured action items: explicit party obligations, notice deadlines, payment schedules, and critical review points.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-[11px] text-ink-muted">
                  Focus: Obligations, dates, and actionable review items.
                </div>
              </div>

              {/* 04. Connect */}
              <div className="p-6 rounded-lg border border-border/80 bg-card flex flex-col justify-between space-y-4 hover:border-border transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                      STAGE 04
                    </span>
                    <Compass className="size-4 text-ink-muted" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-ink-primary pt-1">
                    Connect
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    Generates structured preparation packs so users can arrive at legal consultations with organized facts, cited clauses, and specific questions.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-[11px] text-ink-muted">
                  Focus: Professional handoff and legal aid navigation.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — VISUAL DISTINCTION: ORIGINAL TEXT VS. AI EXPLANATION */}
        <section className="py-16 md:py-20 border-b border-border/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                  Non-Negotiable Design Rule
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink-primary">
                  Never blur original text with AI interpretations.
                </h2>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Under <strong>PRODUCT_RULES.md (Rule 8)</strong>, AI-generated explanations
                  must never be styled like original legal instruments. Typography, margins, and borders
                  strictly demarcate authorial source from plain-language analysis.
                </p>
                <div className="space-y-2 pt-2 text-xs text-ink-secondary">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-700 shrink-0" />
                    <span>Original legal documents use authoritative serif typography & exact quotations.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-700 shrink-0" />
                    <span>AI interpretations use contemporary sans-serif with explicit derived labels.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-700 shrink-0" />
                    <span>Uncertainty or missing clauses are stated directly, never fabricated.</span>
                  </div>
                </div>
              </div>

              {/* Visual Side-by-Side Comparison Box */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original Document Card */}
                <div className="p-5 rounded-lg border border-border/90 bg-background space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted">
                      Original Contract Text
                    </span>
                    <Badge variant="subtle" size="sm">Sec. 9.1</Badge>
                  </div>
                  <p className="font-serif text-xs leading-relaxed italic text-ink-primary">
                    &ldquo;Neither party shall be liable for failure to perform its obligations hereunder if such failure results from an Act of God, insurrection, or statutory restriction, provided prompt notice is given.&rdquo;
                  </p>
                  <div className="pt-2 text-[10px] font-mono text-ink-muted">
                    Format: Original Binding Language
                  </div>
                </div>

                {/* AI Explanation Card */}
                <div className="p-5 rounded-lg border border-primary/30 bg-primary/3 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                    <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-primary">
                      LawLens Plain Explanation
                    </span>
                    <Badge variant="accent" size="sm">Derived</Badge>
                  </div>
                  <p className="font-sans text-xs leading-relaxed text-ink-primary">
                    This is a Force Majeure clause. If unexpected major events beyond your control (like riots or new laws) stop you from performing, you aren&apos;t legally liable, but you must notify the other party immediately.
                  </p>
                  <div className="pt-2 text-[10px] font-sans text-primary font-medium">
                    Format: Verified Plain Explanation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — INDIA-FIRST JURISDICTION FOUNDATION */}
        <section id="jurisdiction" className="py-16 md:py-20 border-b border-border/70 bg-paper/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
              <Badge variant="jurisdiction" className="mx-auto">
                Architectural Principle
              </Badge>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink-primary">
                Built India-First, Designed to Expand
              </h2>
              <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
                LawLens is deliberately engineered for Indian legal realities without hardcoding
                jurisdiction assumptions into generic application components.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Indian Statutory Context</CardTitle>
                  <CardDescription>
                    Contextualized against the Indian Contract Act 1872, Arbitration & Conciliation Act 1996, and Consumer Protection Act 2019.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-ink-muted">
                  Identifies India-specific statutory limits such as Section 27 (restraint of trade) and Section 74 (liquidated damages).
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Explicit Jurisdiction Selector</CardTitle>
                  <CardDescription>
                    A visible jurisdiction context ensures the user always knows which legal regime applies to their document analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-ink-muted">
                  Prevents accidental cross-jurisdiction assumptions. Future support for additional legal jurisdictions is built into the data layer.
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Statutory Handoff Resources</CardTitle>
                  <CardDescription>
                    Prepares users with appropriate Indian legal aid pointers (e.g. NALSA, State Legal Services Authorities) when relevant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-ink-muted">
                  Clear guidance for users requiring professional legal representation or official institutional dispute channels.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 4 — FOUNDATIONAL COMMITMENTS & SAFETY BOUNDARIES */}
        <section id="standards" className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border border-border/80 rounded-xl bg-card p-6 md:p-10 shadow-xs">
              <div className="max-w-3xl mb-8 space-y-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                  Engineering Safety Standards
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
                  Safe, Responsible, and Untrusted by Design
                </h2>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  In compliance with <strong>PRODUCT_RULES.md</strong> and <strong>EVALUATION.md</strong>,
                  every LawLens interaction operates under strict engineering safety guarantees:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-ink-secondary">
                <div className="space-y-2 p-4 rounded-md bg-paper-contrast/40 border border-border/50">
                  <div className="flex items-center gap-2 font-semibold text-ink-primary">
                    <Lock className="size-4 text-primary" />
                    <span>Documents are Data</span>
                  </div>
                  <p className="leading-relaxed">
                    Uploaded document text is strictly treated as untrusted data to analyze. Embedded prompt-injection attempts cannot override application rules.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-md bg-paper-contrast/40 border border-border/50">
                  <div className="flex items-center gap-2 font-semibold text-ink-primary">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>Zero Autonomous Actions</span>
                  </div>
                  <p className="leading-relaxed">
                    LawLens never automatically files court motions, sends binding notices, or makes legal decisions. User agency is strictly preserved.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-md bg-paper-contrast/40 border border-border/50">
                  <div className="flex items-center gap-2 font-semibold text-ink-primary">
                    <HelpCircle className="size-4 text-primary" />
                    <span>Honest Uncertainty</span>
                  </div>
                  <p className="leading-relaxed">
                    When document evidence is incomplete or ambiguous, LawLens states the limitation clearly instead of hallucinating confident advice.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-md bg-paper-contrast/40 border border-border/50">
                  <div className="flex items-center gap-2 font-semibold text-ink-primary">
                    <Scale className="size-4 text-primary" />
                    <span>Professional Boundary</span>
                  </div>
                  <p className="leading-relaxed">
                    The platform exists to prepare users for high-quality consultations with qualified advocates, never to pretend to replace legal counsel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Application Footer */}
      <Footer />
    </div>
  )
}
