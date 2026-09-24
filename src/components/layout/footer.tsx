import Link from "next/link"
import { Scale, ArrowUpRight } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-paper-contrast/40 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Identity & Mission */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-ink-primary flex items-center justify-center text-paper shadow-2xs">
                <Scale className="size-3.5 text-paper" strokeWidth={2.2} />
              </div>
              <span className="font-serif font-bold text-lg text-ink-primary">
                LawLens
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed max-w-sm">
              GenAI-powered legal document navigation. Transform complex agreements into plain-language clarity, verified against original evidence.
            </p>
            <div className="pt-1 text-[11px] text-ink-muted">
              Built India-First · Primary Legal Context: Republic of India
            </div>
          </div>

          {/* Core Framework */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink-primary">
              Core Framework
            </h4>
            <ul className="space-y-2 text-xs text-ink-secondary">
              <li className="flex items-center gap-2">
                <span className="font-mono text-primary text-[10px] font-semibold">01</span>
                <span>Understand Plain Language</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-mono text-primary text-[10px] font-semibold">02</span>
                <span>Verify Source Evidence</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-mono text-primary text-[10px] font-semibold">03</span>
                <span>Act on Obligations</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-mono text-primary text-[10px] font-semibold">04</span>
                <span>Connect with Counsel</span>
              </li>
            </ul>
          </div>

          {/* Navigation & Safety Boundary */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink-primary">
              Legal Boundary
            </h4>
            <div className="p-3.5 rounded-lg border border-border/70 bg-card text-xs text-ink-secondary space-y-2 leading-relaxed">
              <p>
                <strong>Information, Not Legal Advice:</strong> LawLens does not create an attorney-client relationship or replace professional legal counsel.
              </p>
              <div className="pt-1 flex items-center gap-4 text-[11px]">
                <a
                  href="/#standards"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Safety Standards</span>
                  <ArrowUpRight className="size-3" />
                </a>
                <Link
                  href="/workspace"
                  className="text-ink-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Open Workspace</span>
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
          <p>© {new Date().getFullYear()} LawLens. See what matters.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Evidence-Grounded Legal Navigation</span>
            <span>·</span>
            <span>India Default Jurisdiction</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
