"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Scale, Menu, X, ArrowRight } from "lucide-react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const [activeSection, setActiveSection] = React.useState<string | null>(null)

  // Track active landing-page section when on "/"
  React.useEffect(() => {
    if (pathname !== "/") {
      return
    }

    const sectionIds = ["understand", "evidence", "jurisdiction"]
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) return

    const computeActiveSection = () => {
      // Hero area check: at top of page, no section link should be active
      if (window.scrollY < 180) {
        setActiveSection(null)
        return
      }

      const headerOffset = 100 // accounts for sticky navbar height (60px) + offset
      let current: string | null = null

      // Check which section spans the header offset line
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= headerOffset && rect.bottom > headerOffset) {
          current = id
          break
        }
      }

      // Fallback: check if the top of a section is in the upper viewport area
      if (!current) {
        for (const id of sectionIds) {
          const el = document.getElementById(id)
          if (!el) continue
          const rect = el.getBoundingClientRect()
          if (rect.top >= 0 && rect.top < window.innerHeight * 0.45) {
            current = id
            break
          }
        }
      }

      setActiveSection(current)
    }

    // IntersectionObserver triggers updates when sections cross viewport
    const observer = new IntersectionObserver(
      () => {
        computeActiveSection()
      },
      {
        rootMargin: "-60px 0px -40% 0px",
        threshold: [0, 0.2, 0.5],
      }
    )

    sections.forEach((sec) => observer.observe(sec))

    // Scroll listener ensures smooth updates, fast scrolling, and hero area clearing
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          computeActiveSection()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    computeActiveSection()

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [pathname])

  const getSectionHref = (id: string) => (pathname === "/" ? `#${id}` : `/#${id}`)

  const isWorkspaceActive = pathname === "/workspace"
  const isMethodologyActive = pathname === "/" && activeSection === "understand"
  const isEvidenceActive = pathname === "/" && activeSection === "evidence"
  const isIndiaFirstActive = pathname === "/" && activeSection === "jurisdiction"

  const navLinkClass = (isActive: boolean) =>
    `transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs py-1 ${
      isActive
        ? "text-primary font-semibold"
        : "text-ink-secondary hover:text-ink-primary font-medium"
    }`

  const mobileNavLinkClass = (isActive: boolean) =>
    `py-1.5 transition-colors ${
      isActive
        ? "text-primary font-semibold"
        : "text-ink-secondary hover:text-ink-primary font-medium"
    }`

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        {/* Left: LawLens Brand Group */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <div className="w-7.5 h-7.5 rounded-md bg-ink-primary flex items-center justify-center text-paper shadow-2xs group-hover:bg-primary transition-colors duration-150">
              <Scale className="size-3.5 text-paper" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg leading-none tracking-tight text-ink-primary">
                LawLens
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-ink-muted font-semibold mt-0.5">
                See what matters
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Primary Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-xs tracking-wide" aria-label="Main Navigation">
          <Link
            href="/workspace"
            className={navLinkClass(isWorkspaceActive)}
          >
            Document Workspace
          </Link>
          <a
            href={getSectionHref("understand")}
            className={navLinkClass(isMethodologyActive)}
          >
            Methodology
          </a>
          <a
            href={getSectionHref("evidence")}
            className={navLinkClass(isEvidenceActive)}
          >
            Evidence Model
          </a>
          <a
            href={getSectionHref("jurisdiction")}
            className={navLinkClass(isIndiaFirstActive)}
          >
            India-First
          </a>
        </nav>

        {/* Right: Refined Contextual Control + Primary CTA */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Subtle Contextual Jurisdiction Control */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/80 bg-paper-contrast/60 text-[11px] font-medium text-ink-secondary select-none"
            title="Active Legal Regime: India (Default)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-ink-muted">Jurisdiction:</span>
            <span className="font-semibold text-ink-primary">India</span>
          </div>

          {/* Redesigned Premium CTA */}
          <Link
            href="/workspace"
            className="group inline-flex items-center justify-center gap-1.5 rounded-md bg-ink-primary text-paper hover:bg-primary px-3.5 h-8 text-xs font-semibold tracking-wide transition-all duration-150 ease-out shadow-2xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>Open Workspace</span>
            <ArrowRight className="size-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            className="p-1.5 rounded-md text-ink-secondary hover:text-ink-primary hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/80 bg-background/98 px-5 pt-3.5 pb-5 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
            <span className="text-xs text-ink-muted">Active Jurisdiction</span>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-600/30 bg-emerald-500/10 text-emerald-800 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>India (Default)</span>
            </div>
          </div>
          <nav className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              href="/workspace"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between ${mobileNavLinkClass(isWorkspaceActive)}`}
            >
              <span>Document Workspace</span>
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={getSectionHref("understand")}
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass(isMethodologyActive)}
            >
              Methodology
            </a>
            <a
              href={getSectionHref("evidence")}
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass(isEvidenceActive)}
            >
              Evidence Model
            </a>
            <a
              href={getSectionHref("jurisdiction")}
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass(isIndiaFirstActive)}
            >
              India-First
            </a>
            <Link
              href="/#standards"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-ink-primary text-xs text-ink-muted"
            >
              Safety Principles
            </Link>
          </nav>
          <div className="pt-2">
            <Link
              href="/workspace"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center w-full gap-2 rounded-md bg-ink-primary text-paper text-xs font-semibold h-9 px-4 active:scale-[0.98] transition-all"
            >
              <span>Open Workspace</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
