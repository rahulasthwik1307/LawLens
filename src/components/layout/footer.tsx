import Link from "next/link"
import { Scale, ShieldCheck, FileCheck, ArrowUpRight } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-paper-contrast/50 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Identity & Mission */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
                <Scale className="size-3.5" />
              </div>
              <span className="font-serif font-bold text-lg text-ink-primary">
                LawLens
              </span>
            </div>
            <p className="text-sm text-ink-secondary leading-relaxed max-w-md">
              A GenAI-powered legal information and document navigation platform.
              Designed to help people understand complex legal language, identify critical clauses,
              verify findings against source evidence, and prepare for appropriate next steps.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card text-xs text-ink-secondary">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Primary Jurisdiction: <strong>Republic of India</strong></span>
              </div>
            </div>
          </div>

          {/* Core Framework */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-serif text-sm font-semibold text-ink-primary uppercase tracking-wider text-[11px]">
              Core Framework
            </h4>
            <ul className="space-y-2 text-sm text-ink-secondary">
              <li className="flex items-center gap-1.5">
                <span className="text-primary font-mono text-xs">01.</span>
                <span>Understand Plain Language</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary font-mono text-xs">02.</span>
                <span>Verify Source Evidence</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary font-mono text-xs">03.</span>
                <span>Act on Obligations</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary font-mono text-xs">04.</span>
                <span>Connect with Counsel</span>
              </li>
            </ul>
          </div>

          {/* Product Principles */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-serif text-sm font-semibold text-ink-primary uppercase tracking-wider text-[11px]">
              Foundational Commitments
            </h4>
            <div className="space-y-2.5 text-xs text-ink-secondary leading-relaxed bg-card p-3.5 rounded-md border border-border/70">
              <p>
                <strong>Information, Not Legal Advice:</strong> LawLens does not create an attorney-client relationship or replace professional legal representation.
              </p>
              <p>
                <strong>Untrusted Document Boundary:</strong> Uploaded document content is strictly isolated as analysis data and cannot override application instructions.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar / Legal Disclaimer */}
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <p>© {new Date().getFullYear()} LawLens. See what matters.</p>
          <div className="flex items-center gap-6">
            <span>India-First Product Architecture</span>
            <span>•</span>
            <span>Evidence-Grounded Intelligence</span>
            <span>•</span>
            <span>Light Theme Foundation</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
