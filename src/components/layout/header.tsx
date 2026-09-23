"use client"

import * as React from "react"
import Link from "next/link"
import { ShieldCheck, Compass, Scale, Menu, X, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-xs group-hover:bg-primary/90 transition-colors">
              <Scale className="size-4" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg leading-tight tracking-tight text-ink-primary">
                LawLens
              </span>
              <span className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">
                See what matters
              </span>
            </div>
          </Link>

          {/* Jurisdiction indicator - Non-negotiable Principle 1 & 2 */}
          <div className="hidden md:flex items-center ml-2 pl-3 border-l border-border/60">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Jurisdiction: <strong>India</strong></span>
              <span className="text-[10px] text-ink-muted">(Default)</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-ink-secondary">
          <a
            href="#understand"
            className="hover:text-ink-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
          >
            Methodology
          </a>
          <a
            href="#evidence"
            className="hover:text-ink-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
          >
            Evidence Model
          </a>
          <a
            href="#jurisdiction"
            className="hover:text-ink-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
          >
            India-First Scope
          </a>
          <a
            href="#standards"
            className="hover:text-ink-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
          >
            Product Standards
          </a>
        </nav>

        {/* Right CTA / Action */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="#evidence"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted hover:border-foreground/20 shadow-xs text-xs h-8 px-3 font-medium transition-all duration-100 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Compass className="size-3.5 mr-1" />
            Inspect Lens Specimen
          </a>
          <a
            href="#understand"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs text-xs h-8 px-3 font-semibold transition-all duration-100 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Explore System
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex sm:hidden items-center">
          <button
            type="button"
            className="p-2 rounded-md text-ink-secondary hover:text-ink-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation panel */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-border/80 bg-background px-4 pt-3 pb-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-xs text-ink-muted">Active Context:</span>
            <Badge variant="jurisdiction">India (Default)</Badge>
          </div>
          <nav className="flex flex-col space-y-2 text-sm font-medium text-ink-secondary">
            <a
              href="#understand"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-ink-primary"
            >
              Methodology
            </a>
            <a
              href="#evidence"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-ink-primary"
            >
              Evidence Model
            </a>
            <a
              href="#jurisdiction"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-ink-primary"
            >
              India-First Scope
            </a>
            <a
              href="#standards"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-ink-primary"
            >
              Product Standards
            </a>
          </nav>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="#evidence"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center w-full rounded-md bg-primary text-primary-foreground text-xs font-semibold h-9 px-4"
            >
              Inspect Lens Specimen
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
