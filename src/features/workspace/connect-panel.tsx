"use client"

import * as React from "react"
import {
  ExternalLink,
  ShieldCheck,
  Briefcase,
  HelpCircle,
  FileCheck2,
  AlertCircle,
  Check,
  Copy,
  Info,
  Scale,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UploadedDocument } from "@/types/document"
import type {
  ActionItem,
  DocumentAnalysisResult,
  DocumentComparisonResult,
} from "@/services/ai/types"
import {
  resolveResourcesForJurisdiction,
  type LegalResource,
} from "@/services/resources/resource-registry"
import { composePreparationPack } from "@/services/ai/pack-composer"

interface ConnectPanelProps {
  document: UploadedDocument
  jurisdiction?: string
  analysisResult?: DocumentAnalysisResult | null
  actions?: ActionItem[]
  comparisonResult?: DocumentComparisonResult | null
  comparisonDocB?: UploadedDocument | null
  onNavigateToMode: (mode: "findings" | "qa" | "compare" | "actions" | "prepare") => void
}

export function ConnectPanel({
  document,
  jurisdiction = "India",
  analysisResult,
  actions = [],
  comparisonResult,
  comparisonDocB,
  onNavigateToMode,
}: ConnectPanelProps) {
  const [copied, setCopied] = React.useState(false)

  const effectiveJurisdiction = document.jurisdiction || jurisdiction || "India"

  // Context-aware resource resolution
  const resolution = React.useMemo(() => {
    const hasConsumer = Boolean(
      document.name.toLowerCase().includes("consumer") ||
      (document.content && document.content.toLowerCase().includes("consumer"))
    )
    return resolveResourcesForJurisdiction(effectiveJurisdiction, {
      hasConsumerClauses: hasConsumer,
    })
  }, [effectiveJurisdiction, document])

  // Extract key questions or review items to take to a consultation
  const takeWithYouItems = React.useMemo(() => {
    const items: Array<{ title: string; hint: string }> = []

    if (actions.length > 0) {
      const askActions = actions.filter((a) => a.type === "ask")
      for (const a of askActions.slice(0, 3)) {
        items.push({
          title: a.title,
          hint: a.whyItMatters,
        })
      }

      if (items.length < 3) {
        const attentionActions = actions.filter(
          (a) => a.priority === "attention" && a.type !== "ask"
        )
        for (const a of attentionActions.slice(0, 3 - items.length)) {
          items.push({
            title: a.title,
            hint: a.whyItMatters,
          })
        }
      }
    } else if (analysisResult?.categories?.review_points) {
      for (const rp of analysisResult.categories.review_points.slice(0, 3)) {
        items.push({
          title: rp.title,
          hint: rp.explanation,
        })
      }
    }

    return items
  }, [actions, analysisResult])

  const handleCopyBriefing = async () => {
    try {
      const pack = composePreparationPack({
        document,
        analysisResult,
        actions,
        comparisonResult,
        comparisonDocB,
      })

      let text = `# LawLens Professional Preparation Pack\n`
      text += `Document: ${pack.overview.documentName}\n`
      text += `Jurisdiction: ${pack.overview.jurisdiction}\n`
      text += `Generated: ${new Date(pack.createdAt).toLocaleDateString()}\n\n`
      text += `## Executive Summary\n${pack.executiveSummary}\n\n`

      if (pack.reviewItems.length > 0) {
        text += `## Key Review Items\n`
        pack.reviewItems.slice(0, 5).forEach((item, idx) => {
          text += `${idx + 1}. ${item.title} (${item.whyItMatters})\n`
        })
        text += `\n`
      }

      if (pack.questionsToDiscuss.length > 0) {
        text += `## Inquiries to Discuss\n`
        pack.questionsToDiscuss.forEach((q, idx) => {
          text += `${idx + 1}. ${q.question} — ${q.whyThisQuestion}\n`
        })
        text += `\n`
      }

      text += `\n${pack.legalNotice}\n`

      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const officialResources = resolution.resources.filter((r) => r.category === "official")
  const legalAidResources = resolution.resources.filter((r) => r.category === "legal_aid")

  return (
    <div className="space-y-6 pb-12 min-w-0">
      {/* Header Banner */}
      <div className="rounded-xl border border-border/80 bg-card p-5 @[540px]/ai:p-6 shadow-xs space-y-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-semibold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
            Next Steps · Connect
          </span>
          <span className="font-mono text-[11px] text-ink-muted">
            {effectiveJurisdiction} Jurisdiction
          </span>
        </div>

        <h2 className="font-serif text-xl md:text-2xl font-bold text-ink-primary tracking-tight break-words">
          Where to Go Next
        </h2>
        <p className="text-xs md:text-sm text-ink-secondary leading-relaxed max-w-2xl break-words">
          You have reviewed, verified, and organized the evidence in{" "}
          <strong className="text-ink-primary font-medium">{document.name}</strong>.
          Use this guide to access verified statutory portals, explore official legal aid channels, or prepare for consultation with a qualified legal professional.
        </p>
      </div>

      {/* Unsupported Jurisdiction Notice */}
      {!resolution.isSupported && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-xs text-amber-950 dark:text-amber-200 space-y-3 min-w-0"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Jurisdiction Limitation Notice
              </h4>
              <p className="leading-relaxed text-ink-secondary text-xs break-words">
                {resolution.limitationMessage}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-ink-muted">
              You can still carry your verified Preparation Pack to a local practitioner.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToMode("prepare")}
              className="gap-1.5 text-xs h-7 whitespace-nowrap shrink-0"
            >
              <span>Open Preparation Pack</span>
              <ArrowRight className="size-3" />
            </Button>
          </div>
        </div>
      )}

      {/* SECTION 1: Preparation Pack Handoff (Take this with you) */}
      <div className="rounded-xl border border-border/80 bg-card p-5 @[540px]/ai:p-6 shadow-xs space-y-4 min-w-0">
        <div className="flex flex-col @[540px]/ai:flex-row @[540px]/ai:items-center justify-between gap-3 border-b border-border/60 pb-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Briefcase className="size-4 text-primary shrink-0" />
            <h3 className="font-serif font-bold text-sm md:text-base text-ink-primary truncate">
              Questions & Findings to Take With You
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyBriefing}
              className="gap-1.5 text-xs text-ink-secondary hover:text-ink-primary h-7 whitespace-nowrap shrink-0"
              id="btn-copy-briefing-connect"
            >
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy Briefing"}</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onNavigateToMode("prepare")}
              className="gap-1.5 text-xs font-semibold h-7 shadow-xs whitespace-nowrap shrink-0"
              id="btn-open-prep-pack"
            >
              <span>Open Preparation Pack</span>
              <ArrowRight className="size-3" />
            </Button>
          </div>
        </div>

        {takeWithYouItems.length === 0 ? (
          <p className="text-xs text-ink-muted italic py-1">
            Generate Findings or the Action Map to populate specific consultation inquiry points.
          </p>
        ) : (
          <div className="space-y-2.5 min-w-0">
            <span className="text-[11px] text-ink-muted uppercase tracking-wider font-mono">
              Key consultation points derived from verified document clauses:
            </span>
            <ul className="space-y-2">
              {takeWithYouItems.map((item, idx) => (
                <li
                  key={idx}
                  className="rounded-lg border border-border/60 bg-paper/50 p-3 text-xs space-y-0.5 min-w-0"
                >
                  <div className="flex items-start gap-2">
                    <div className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    <div className="min-w-0">
                      <span className="font-semibold text-ink-primary text-xs block break-words">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-ink-secondary leading-relaxed block break-words">
                        {item.hint}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* SECTION 2: Official Statutory & Judicial Portals */}
      {resolution.isSupported && officialResources.length > 0 && (
        <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 min-w-0">
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-sm md:text-base text-ink-primary">
                Authoritative Legal Information Portals
              </h3>
              <p className="text-xs text-ink-muted">
                Official government repositories and judicial portals for statutory research and filings.
              </p>
            </div>
            <Badge variant="outline" size="sm" className="font-mono text-[10px] shrink-0">
              {officialResources.length} official portals
            </Badge>
          </div>

          <div className="grid grid-cols-1 @[540px]/ai:grid-cols-2 gap-3.5 min-w-0">
            {officialResources.map((res) => (
              <div
                key={res.id}
                className="rounded-xl border border-border/80 bg-card p-4 space-y-3 flex flex-col justify-between hover:border-border transition-colors shadow-xs min-w-0"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20 uppercase shrink-0">
                      {res.sourceType.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono text-[10px] text-ink-muted shrink-0">
                      {res.lastVerified}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs md:text-sm text-ink-primary break-words">
                      {res.title}
                    </h4>
                    <span className="text-[11px] text-ink-muted block mt-0.5 break-words">
                      {res.organization}
                    </span>
                  </div>

                  <p className="text-xs text-ink-secondary leading-relaxed break-words">
                    {res.description}
                  </p>

                  {res.relevanceHint && (
                    <p className="text-[11px] text-ink-muted bg-paper-contrast/50 p-2 rounded border border-border/40 break-words">
                      <strong className="text-ink-primary font-medium">Use for:</strong> {res.relevanceHint}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-mono flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-600 inline-block shrink-0" />
                    Verified Official Domain
                  </span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
                    aria-label={`Open ${res.title} in a new tab`}
                  >
                    <span>Open official source</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Official Legal Aid Authority */}
      {resolution.isSupported && legalAidResources.length > 0 && (
        <div className="space-y-4 min-w-0">
          <div className="border-b border-border/60 pb-2 min-w-0">
            <h3 className="font-serif font-bold text-sm md:text-base text-ink-primary">
              Official Legal Aid & Public Assistance Channels
            </h3>
            <p className="text-xs text-ink-muted">
              Constitutional statutory authorities providing free legal representation and dispute resolution for eligible individuals.
            </p>
          </div>

          <div className="space-y-3 min-w-0">
            {legalAidResources.map((res) => (
              <div
                key={res.id}
                className="rounded-xl border border-primary/20 bg-primary/5 p-4 @[540px]/ai:p-5 space-y-3 shadow-xs min-w-0"
              >
                <div className="flex flex-col @[540px]/ai:flex-row @[540px]/ai:items-center justify-between gap-2 border-b border-primary/10 pb-3 min-w-0">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-semibold text-primary uppercase tracking-wider block">
                      Statutory Legal Services
                    </span>
                    <h4 className="font-serif font-bold text-sm md:text-base text-ink-primary mt-0.5 break-words">
                      {res.title}
                    </h4>
                    <span className="text-[11px] text-ink-muted block mt-0.5 break-words">
                      {res.organization}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-ink-muted shrink-0">
                    Verified {res.lastVerified}
                  </span>
                </div>

                <p className="text-xs text-ink-secondary leading-relaxed break-words">
                  {res.description}
                </p>

                <div className="rounded-lg bg-card/80 p-3 border border-border/50 text-[11px] text-ink-secondary space-y-1 min-w-0">
                  <strong className="text-ink-primary font-medium block">
                    Statutory Eligibility (Section 12 of the Legal Services Authorities Act, 1987):
                  </strong>
                  <p className="leading-relaxed break-words">
                    Free legal aid is available to women, children, members of SC/ST communities, industrial workmen, persons with disabilities, custody inmates, and persons whose annual income falls below statutory income ceilings set by individual States.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 min-w-0">
                  <span className="text-[11px] text-ink-muted font-mono">
                    Official Central Portal: nalsa.gov.in
                  </span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
                    aria-label={`Open ${res.title} in a new tab`}
                  >
                    <span>Visit NALSA Portal</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: Professional Review Boundary & Checklist */}
      <div className="rounded-xl border border-border/80 bg-card p-5 @[540px]/ai:p-6 shadow-xs space-y-4 min-w-0">
        <div className="space-y-1 border-b border-border/60 pb-3 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted font-semibold">
            Product Boundary & Consultation Guide
          </span>
          <h3 className="font-serif font-bold text-sm md:text-base text-ink-primary">
            When to Consider Qualified Professional Review
          </h3>
        </div>

        <p className="text-xs md:text-sm text-ink-secondary leading-relaxed break-words">
          LawLens is a legal document comprehension and evidence-grounding platform. It does not provide legal advice, draft enforceable filings, predict dispute outcomes, or act as an advocate.
        </p>

        <div className="grid grid-cols-1 @[540px]/ai:grid-cols-2 gap-3 text-xs min-w-0">
          <div className="rounded-lg bg-paper-contrast/40 p-3.5 border border-border/50 space-y-1.5 min-w-0">
            <span className="font-semibold text-ink-primary text-xs block">
              Situations Warranting Legal Counsel
            </span>
            <ul className="space-y-1 text-[11px] text-ink-secondary list-disc pl-4 leading-relaxed">
              <li>High-value commercial commitments or unverified deposits</li>
              <li>Significant termination penalties or non-compete covenants</li>
              <li>Ambiguous dispute resolution clauses requiring litigation strategy</li>
              <li>Material changes introduced between contract drafts</li>
            </ul>
          </div>

          <div className="rounded-lg bg-paper-contrast/40 p-3.5 border border-border/50 space-y-1.5 min-w-0">
            <span className="font-semibold text-ink-primary text-xs block">
              What to Bring to Your Consultation
            </span>
            <ul className="space-y-1 text-[11px] text-ink-secondary list-disc pl-4 leading-relaxed">
              <li>Complete original signed or drafted document</li>
              <li>LawLens Professional Preparation Pack (printed or copied)</li>
              <li>Factual timeline of party discussions and communications</li>
              <li>Specific clarification questions surfaced in the Action Map</li>
            </ul>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 flex flex-col @[540px]/ai:flex-row @[540px]/ai:items-center justify-between gap-3 text-xs min-w-0">
          <span className="text-[11px] text-ink-muted">
            Independent counsel provides advice tailored to your personal and jurisdictional circumstances.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToMode("prepare")}
            className="gap-1.5 text-xs h-7 shrink-0 font-medium whitespace-nowrap"
          >
            <span>Review Full Preparation Pack</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
