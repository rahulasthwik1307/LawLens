"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Copy,
  Check,
  Shield,
  Sparkles,
  Info,
  Hash,
  BookOpen,
  AlertCircle,
  RotateCcw,
  X,
  Compass,
  HelpCircle,
  GitCompare,
  Briefcase,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UploadedDocument } from "@/types/document"
import { formatFileSize } from "@/lib/document-validation"
import {
  ActionItem,
  DocumentAnalysisResult,
  DocumentComparisonResult,
  DocumentQAResult,
  FindingEvidence,
  LegalFinding,
} from "@/services/ai/types"
import { AnalysisLoadingView } from "./analysis-loading-view"
import { FindingsPanel } from "./findings-panel"
import { DocumentQAPanel } from "./document-qa-panel"
import { DocumentComparisonPanel } from "./document-comparison-panel"
import { ActionMapPanel } from "./action-map-panel"
import { PreparationPackPanel } from "./preparation-pack-panel"
import { ConnectPanel } from "./connect-panel"
import { WorkspaceSplitPane } from "./workspace-split-pane"

interface DocumentWorkspaceProps {
  document: UploadedDocument
  onSelectAnother: () => void
}

type AnalysisStatus = "idle" | "loading" | "ready" | "error"
type WorkspaceMode = "findings" | "qa" | "compare" | "actions" | "prepare" | "connect"

/**
 * Extracts a clean, editorial document title from the document content or filename.
 */
function getDocumentTitle(doc: UploadedDocument): string {
  if (doc.content) {
    const rawLines = doc.content.split("\n")
    for (const rawLine of rawLines.slice(0, 10)) {
      const line = rawLine.trim()
      if (!line || line.startsWith("=") || line.startsWith("-") || line.startsWith("#")) continue
      if (/^(THIS|DATE|BETWEEN|DATED|EXECUTED|EXECUTION)/i.test(line)) continue
      if (line.length >= 4 && line.length <= 100 && !line.includes(":") && !line.includes(";")) {
        return line.replace(/^["']|["']$/g, "")
      }
    }
  }
  // Fallback from filename
  return doc.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ")
    .toUpperCase()
}

export function DocumentWorkspace({
  document,
  onSelectAnother,
}: DocumentWorkspaceProps) {
  const [showLineNumbers, setShowLineNumbers] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  // AI Analysis State
  const [analysisStatus, setAnalysisStatus] = React.useState<AnalysisStatus>("idle")
  const [analysisResult, setAnalysisResult] = React.useState<DocumentAnalysisResult | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [activeEvidence, setActiveEvidence] = React.useState<FindingEvidence | null>(null)
  const [workspaceMode, setWorkspaceMode] = React.useState<WorkspaceMode>("findings")
  const [comparisonResult, setComparisonResult] = React.useState<DocumentComparisonResult | null>(null)
  const [comparisonDocB, setComparisonDocB] = React.useState<UploadedDocument | null>(null)
  const [actions, setActions] = React.useState<ActionItem[]>([])
  const [qaHistory, setQAHistory] = React.useState<DocumentQAResult[]>([])
  const [activeViewerDoc, setActiveViewerDoc] = React.useState<UploadedDocument>(document)
  const [prevDocId, setPrevDocId] = React.useState(document.id)

  if (document.id !== prevDocId) {
    setPrevDocId(document.id)
    setActiveViewerDoc(document)
  }

  const [selectedPlannerFindingId, setSelectedPlannerFindingId] = React.useState<string | undefined>(undefined)

  const handlePlanFindingAction = (finding: LegalFinding) => {
    setSelectedPlannerFindingId(finding.id)
    setWorkspaceMode("actions")
    setActiveMobileTab("ai")
  }

  // Mobile navigation tab state
  const [activeMobileTab, setActiveMobileTab] = React.useState<"document" | "ai">("document")

  // Document lines and element refs for auto-scrolling to cited lines
  const lines = React.useMemo(() => {
    if (!activeViewerDoc.content) return []
    return activeViewerDoc.content.split("\n")
  }, [activeViewerDoc.content])

  const lineRefs = React.useRef<Map<number, HTMLDivElement>>(new Map())
  const documentViewerRef = React.useRef<HTMLDivElement>(null)

  const handleCopyText = async () => {
    if (!activeViewerDoc.content) return
    try {
      await navigator.clipboard.writeText(activeViewerDoc.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  // Handle Evidence selection: highlight lines, scroll to line range, and switch mobile view if needed
  const handleSelectEvidence = (evidence: FindingEvidence) => {
    setActiveEvidence(evidence)
    // On small screens, switch to document tab to show the highlighted citation
    setActiveMobileTab("document")

    setTimeout(() => {
      const targetEl = lineRefs.current.get(evidence.startLine)
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 60)
  }

  // Handle Comparison evidence selection (dynamically switches viewer to Doc A or B)
  const handleSelectComparisonEvidence = (params: {
    document: UploadedDocument
    startLine: number
    endLine: number
    sourceText: string
  }) => {
    setActiveViewerDoc(params.document)
    setActiveEvidence({
      startLine: params.startLine,
      endLine: params.endLine,
      sourceText: params.sourceText,
      verificationStatus: "verified",
    })
    setActiveMobileTab("document")

    setTimeout(() => {
      const targetEl = lineRefs.current.get(params.startLine)
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 60)
  }

  const handleClearHighlight = () => {
    setActiveEvidence(null)
  }

  // Server-side AI Analysis call
  const handleStartAnalysis = async () => {
    if (analysisStatus === "loading") return
    if (!document.isTextReadable || !document.content.trim()) {
      setErrorMessage(
        "This document format requires server-side extraction before analysis."
      )
      setAnalysisStatus("error")
      return
    }

    setAnalysisStatus("loading")
    setErrorMessage(null)

    try {
      const res = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document,
          jurisdiction: document.jurisdiction || "India",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(
          data?.error || "Document analysis failed. Please try again."
        )
        setAnalysisStatus("error")
        return
      }

      setAnalysisResult(data as DocumentAnalysisResult)
      setAnalysisStatus("ready")
      // Automatically switch mobile view to AI workspace so findings are immediately visible
      setActiveMobileTab("ai")
    } catch {
      setErrorMessage(
        "Network connection failed while contacting the analysis service. Please try again."
      )
      setAnalysisStatus("error")
    }
  }

  const documentTitle = React.useMemo(() => getDocumentTitle(document), [document])

  // Status label for primary AI workspace UX (product-oriented, no raw model name)
  const aiStatusLabel = React.useMemo(() => {
    if (analysisStatus === "loading") return "Analyzing document..."
    if (analysisStatus === "ready") return "Evidence verified"
    if (workspaceMode === "compare") return "Comparison ready"
    if (workspaceMode === "prepare") return "Briefing compiled"
    if (workspaceMode === "actions") return "Actions mapped"
    if (workspaceMode === "connect") return "Resource handoff"
    return "Ready"
  }, [analysisStatus, workspaceMode])

  // Left Pane: Original Document Reader
  const leftPaneContent = (
    <div className="flex flex-col h-full overflow-hidden bg-card min-w-0">
      {/* Document Reader Header Bar */}
      <div className="shrink-0 px-4 py-2.5 bg-paper border-b border-border/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-serif text-xs font-bold text-ink-primary uppercase tracking-wide">
            Original Document
          </span>
          <div className="flex items-center gap-1 text-[11px] font-mono text-ink-muted bg-secondary px-2 py-0.5 rounded border border-border/50">
            <Shield className="size-3 text-primary" />
            <span>Untrusted Source · Isolated View</span>
          </div>
        </div>

        {activeViewerDoc.isTextReadable && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
                showLineNumbers
                  ? "border-primary/40 bg-primary/10 text-primary font-medium"
                  : "border-border text-ink-muted hover:text-ink-primary"
              }`}
              title="Toggle line numbers"
            >
              <Hash className="size-3" />
              <span className="text-[11px]">Line Numbers</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="gap-1 h-7 text-xs px-2.5"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3 text-ink-muted" />
                  <span>Copy Text</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Active Highlight Context Pill */}
      {activeEvidence && (
        <div className="shrink-0 bg-primary/10 border-b border-primary/25 px-4 py-2 flex items-center justify-between text-xs text-ink-primary animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <Compass className="size-3.5 text-primary shrink-0" />
            <span className="font-semibold text-primary">
              Citing Lines {activeEvidence.startLine}–{activeEvidence.endLine}
            </span>
            <span className="text-[11px] text-ink-muted truncate hidden sm:inline">
              (&ldquo;{activeEvidence.sourceText.substring(0, 45)}...&rdquo;)
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearHighlight}
            className="flex items-center gap-1 text-[11px] font-medium text-ink-secondary hover:text-ink-primary ml-2 shrink-0 underline"
          >
            <X className="size-3" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* Active Viewer Document Tab Indicator (if switched in comparison) */}
      {activeViewerDoc.id !== document.id && (
        <div className="shrink-0 px-4 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs">
          <span className="font-mono text-[11px] text-emerald-900 dark:text-emerald-300 font-medium truncate">
            Viewing Document B: {activeViewerDoc.name}
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveViewerDoc(document)
              setActiveEvidence(null)
            }}
            className="text-[11px] text-primary hover:underline font-semibold"
          >
            Switch to Document A
          </button>
        </div>
      )}

      {/* Document Text Display Area (Independent scroll) */}
      <div
        ref={documentViewerRef}
        tabIndex={0}
        role="region"
        aria-label="Original document text content"
        className="flex-1 overflow-y-auto p-4 md:p-6 text-ink-primary font-serif text-[14px] leading-relaxed selection:bg-primary/15 outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {activeViewerDoc.isTextReadable ? (
          <div className="space-y-1 min-w-0">
            {lines.map((line, idx) => {
              const lineNumber = idx + 1
              const isHighlighted =
                activeEvidence &&
                lineNumber >= activeEvidence.startLine &&
                lineNumber <= activeEvidence.endLine

              return (
                <div
                  key={lineNumber}
                  ref={(el) => {
                    if (el) {
                      lineRefs.current.set(lineNumber, el)
                    } else {
                      lineRefs.current.delete(lineNumber)
                    }
                  }}
                  className={`flex items-start gap-3.5 group transition-colors duration-150 rounded px-1.5 -mx-1.5 ${
                    isHighlighted
                      ? "bg-primary/12 border-l-2 border-primary pl-2.5 font-medium"
                      : "hover:bg-paper-contrast/40"
                  }`}
                >
                  {showLineNumbers && (
                    <span
                      className={`font-mono text-[11px] select-none shrink-0 w-8 text-right pt-0.5 ${
                        isHighlighted
                          ? "text-primary font-bold"
                          : "text-ink-muted/50 group-hover:text-ink-secondary"
                      }`}
                    >
                      {lineNumber}
                    </span>
                  )}
                  <p className="flex-1 min-w-0 whitespace-pre-wrap wrap-break-word font-normal">
                    {line || <span className="opacity-0">{"."}</span>}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          /* Safe Binary Container Mounted Message */
          <div className="h-full flex items-center justify-center p-8 text-center bg-paper/30">
            <div className="space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-secondary text-primary mx-auto flex items-center justify-center">
                <BookOpen className="size-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-serif text-base font-bold text-ink-primary">
                  Safe Binary Container Mounted
                </h4>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  This {document.extension.toUpperCase()} document ({formatFileSize(document.size)}) has been validated and loaded into memory as untrusted binary data.
                </p>
                <p className="text-[11px] text-ink-muted bg-paper-contrast/60 p-3 rounded-md border border-border/60 mt-2">
                  <strong>Notice:</strong> This document format requires server-side extraction before analysis. To explore active evidence grounding, upload a .TXT or .MD file or select an Indian legal sample.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Right Pane: AI Workspace
  const rightPaneContent = (
    <div className="flex flex-col h-full overflow-hidden bg-background min-w-0">
      {/* Persistent AI Workspace Navigation Header */}
      <div className="shrink-0 p-3 md:p-3.5 bg-paper border-b border-border/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xs font-bold uppercase tracking-wider text-ink-primary">
              AI Workspace
            </span>
            <span className="text-[11px] text-ink-muted hidden sm:inline">· Evidence-Grounded</span>
          </div>

          {/* Product-oriented status pill (no raw model strings) */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
            <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>{aiStatusLabel}</span>
          </div>
        </div>

        {/* Compact, responsive workspace navigation tabs */}
        <div
          role="tablist"
          aria-label="AI Workspace Sections"
          className="grid grid-cols-3 @[540px]/ai:grid-cols-6 gap-1 bg-paper-contrast/60 p-1 rounded-lg border border-border/70 text-xs font-medium min-w-0"
        >
          <button
            type="button"
            id="mode-tab-findings"
            role="tab"
            aria-selected={workspaceMode === "findings"}
            onClick={() => setWorkspaceMode("findings")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-150 min-w-0 ${
              workspaceMode === "findings"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-ink-secondary hover:text-ink-primary hover:bg-paper"
            }`}
          >
            <Sparkles className="size-3.5 shrink-0" />
            <span className="truncate">Findings</span>
          </button>

          <button
            type="button"
            id="mode-tab-qa"
            role="tab"
            aria-selected={workspaceMode === "qa"}
            onClick={() => setWorkspaceMode("qa")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-150 min-w-0 ${
              workspaceMode === "qa"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-ink-secondary hover:text-ink-primary hover:bg-paper"
            }`}
          >
            <HelpCircle className="size-3.5 shrink-0" />
            <span className="truncate">Q&A</span>
          </button>

          <button
            type="button"
            id="mode-tab-compare"
            role="tab"
            aria-selected={workspaceMode === "compare"}
            onClick={() => setWorkspaceMode("compare")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-150 min-w-0 ${
              workspaceMode === "compare"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-ink-secondary hover:text-ink-primary hover:bg-paper"
            }`}
          >
            <GitCompare className="size-3.5 shrink-0" />
            <span className="truncate">Compare</span>
          </button>

          <button
            type="button"
            id="mode-tab-actions"
            role="tab"
            aria-selected={workspaceMode === "actions"}
            onClick={() => setWorkspaceMode("actions")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-150 min-w-0 ${
              workspaceMode === "actions"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-ink-secondary hover:text-ink-primary hover:bg-paper"
            }`}
          >
            <Compass className="size-3.5 shrink-0" />
            <span className="truncate">Actions</span>
          </button>

          <button
            type="button"
            id="mode-tab-prepare"
            role="tab"
            aria-selected={workspaceMode === "prepare"}
            onClick={() => setWorkspaceMode("prepare")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-150 min-w-0 ${
              workspaceMode === "prepare"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-ink-secondary hover:text-ink-primary hover:bg-paper"
            }`}
          >
            <Briefcase className="size-3.5 shrink-0" />
            <span className="truncate">Prepare</span>
          </button>

          <button
            type="button"
            id="mode-tab-connect"
            role="tab"
            aria-selected={workspaceMode === "connect"}
            onClick={() => setWorkspaceMode("connect")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all duration-150 min-w-0 ${
              workspaceMode === "connect"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-ink-secondary hover:text-ink-primary hover:bg-paper"
            }`}
          >
            <ArrowUpRight className="size-3.5 shrink-0" />
            <span className="truncate">Connect</span>
          </button>
        </div>
      </div>

      {/* AI Workspace Panel Content Area (Independent scroll) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 min-w-0">
        {/* Document Comparison Mode */}
        {workspaceMode === "compare" && (
          <DocumentComparisonPanel
            currentDocument={document}
            onSelectEvidence={handleSelectComparisonEvidence}
            onActiveViewerDocChange={setActiveViewerDoc}
            onComparisonCompleted={(res, docB) => {
              setComparisonResult(res)
              setComparisonDocB(docB)
            }}
          />
        )}

        {/* Document Q&A Mode */}
        {workspaceMode === "qa" && (
          <DocumentQAPanel
            document={document}
            activeEvidence={activeEvidence}
            onSelectEvidence={handleSelectEvidence}
            qaHistory={qaHistory}
            onQAHistoryChange={setQAHistory}
          />
        )}

        {/* Action Map Mode */}
        {workspaceMode === "actions" && (
          <ActionMapPanel
            currentDocument={document}
            analysisResult={analysisResult}
            comparisonResult={comparisonResult}
            comparisonDocB={comparisonDocB}
            actions={actions}
            selectedFindingId={selectedPlannerFindingId}
            onActionsChange={setActions}
            onSelectEvidence={(params) => {
              if (params.document) {
                setActiveViewerDoc(params.document)
              }
              setActiveEvidence({
                startLine: params.startLine,
                endLine: params.endLine,
                sourceText: params.sourceText,
                verificationStatus: "verified",
              })
              setActiveMobileTab("document")
              setTimeout(() => {
                const targetEl = lineRefs.current.get(params.startLine)
                if (targetEl) {
                  targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              }, 60)
            }}
            onActiveViewerDocChange={setActiveViewerDoc}
            onNavigateToMode={(mode) => setWorkspaceMode(mode)}
          />
        )}

        {/* Professional Preparation Pack Mode */}
        {workspaceMode === "prepare" && (
          <PreparationPackPanel
            currentDocument={document}
            analysisResult={analysisResult}
            actions={actions}
            comparisonResult={comparisonResult}
            comparisonDocB={comparisonDocB}
            qaHistory={qaHistory}
            onSelectEvidence={(params) => {
              if (params.document) {
                setActiveViewerDoc(params.document)
              }
              setActiveEvidence({
                startLine: params.startLine,
                endLine: params.endLine,
                sourceText: params.sourceText,
                verificationStatus: "verified",
              })
              setActiveMobileTab("document")
              setTimeout(() => {
                const targetEl = lineRefs.current.get(params.startLine)
                if (targetEl) {
                  targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              }, 60)
            }}
            onActiveViewerDocChange={setActiveViewerDoc}
            onNavigateToMode={(mode) => setWorkspaceMode(mode)}
          />
        )}

        {/* Connect / Resource Handoff Mode */}
        {workspaceMode === "connect" && (
          <ConnectPanel
            document={document}
            jurisdiction={document.jurisdiction || "India"}
            analysisResult={analysisResult}
            actions={actions}
            comparisonResult={comparisonResult}
            comparisonDocB={comparisonDocB}
            onNavigateToMode={(mode) => setWorkspaceMode(mode)}
          />
        )}

        {/* Structured Findings Mode */}
        {workspaceMode === "findings" && (
          <>
            {analysisStatus === "idle" && (
              <div className="rounded-xl border border-border/80 bg-card p-6 md:p-8 space-y-5 shadow-2xs">
                <div className="space-y-2.5 pb-4 border-b border-border/60">
                  <div className="flex items-center gap-2 text-ink-primary font-bold text-base">
                    <Sparkles className="size-5 text-primary" />
                    <span>Document Understanding Engine</span>
                  </div>
                  <p className="text-xs md:text-sm text-ink-secondary leading-relaxed">
                    Generate a structured, evidence-grounded interpretation of this agreement. Important clauses are identified, categorized, and linked directly to their source lines.
                  </p>
                </div>

                {/* What will be analyzed list */}
                <div className="space-y-2 text-xs text-ink-secondary">
                  <span className="font-semibold text-ink-primary uppercase tracking-wider text-[11px]">
                    Supported Analysis Dimensions
                  </span>
                  <ul className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <li className="flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-primary" />
                      <span>Involved Parties</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-primary" />
                      <span>Dates & Deadlines</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-primary" />
                      <span>Monetary Obligations</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-primary" />
                      <span>Covenants & Duties</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-primary" />
                      <span>Restrictive Clauses</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-primary" />
                      <span>Termination Rules</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-primary" />
                      <span>Dispute Resolution</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-primary" />
                      <span>Review Points</span>
                    </li>
                  </ul>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <Button
                    onClick={handleStartAnalysis}
                    className="w-full gap-2 shadow-xs font-semibold text-xs h-9"
                    disabled={!document.isTextReadable}
                  >
                    <Sparkles className="size-4" />
                    <span>Start Evidence-Grounded Analysis</span>
                  </Button>
                  {!document.isTextReadable && (
                    <p className="text-[11px] text-ink-muted text-center pt-2">
                      Text extraction required before analysis for binary files.
                    </p>
                  )}
                </div>

                {/* Security & Grounding Notice */}
                <div className="rounded-md bg-paper-contrast/40 border border-border/60 p-2.5 text-[11px] text-ink-muted flex items-start gap-2.5">
                  <Info className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Strict Evidence Constraint:</strong> AI findings are verified against the original text before display. Unsupported claims are rejected to prevent hallucination.
                  </p>
                </div>
              </div>
            )}

            {analysisStatus === "loading" && (
              <AnalysisLoadingView documentName={document.name} />
            )}

            {analysisStatus === "error" && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50/90 p-5 space-y-3.5 text-red-950 shadow-2xs"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-sm text-red-950">
                      Analysis Could Not Be Completed
                    </h4>
                    <p className="text-xs text-red-800 leading-relaxed">
                      {errorMessage ||
                        "An error occurred while analyzing the document."}
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartAnalysis}
                    className="gap-1.5 text-xs border-red-300 text-red-900 hover:bg-red-100 h-7"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Retry Analysis</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => setAnalysisStatus("idle")}
                    className="text-xs text-red-800 hover:text-red-950 underline"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="pt-2 border-t border-red-200/70 text-[11px] text-red-700">
                  Your original document remains completely safe and accessible in the left reader pane.
                </div>
              </div>
            )}

            {analysisStatus === "ready" && analysisResult && (
              <FindingsPanel
                analysis={analysisResult}
                activeEvidence={activeEvidence}
                onSelectEvidence={handleSelectEvidence}
                onReanalyze={handleStartAnalysis}
                onPlanAction={handlePlanFindingAction}
              />
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full min-w-0">
      {/* Unified Compact Workspace & Document Header Bar */}
      <div className="rounded-xl border border-border/80 bg-card p-4 md:p-5 shadow-2xs space-y-3 min-w-0">
        {/* Navigation context row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-border/60">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Link
              href="/"
              className="hover:text-ink-primary transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="size-3" />
              <span>Overview</span>
            </Link>
            <span>/</span>
            <span className="text-ink-primary font-semibold">Document Workspace</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAnother}
              className="gap-1.5 text-xs text-ink-secondary hover:text-ink-primary h-7"
            >
              <ArrowLeft className="size-3.5" />
              <span>Select Another Document</span>
            </Button>
          </div>
        </div>

        {/* Primary Document Title */}
        <div className="space-y-1 min-w-0">
          <h1 className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-ink-primary leading-snug wrap-break-word">
            {documentTitle}
          </h1>

          {/* Secondary Document Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted pt-0.5">
            <span className="font-mono text-ink-secondary font-medium truncate max-w-xs sm:max-w-md" title={document.name}>
              {document.name}
            </span>
            <span className="text-border">·</span>
            <span className="font-mono text-ink-secondary">{lines.length} lines</span>
            <span className="text-border">·</span>
            <span className="font-mono text-ink-secondary">{document.wordCount} words</span>
            <span className="text-border">·</span>
            <span className="font-mono text-ink-secondary">{formatFileSize(document.size)}</span>
            <span className="text-border">·</span>
            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
              .{document.extension.toUpperCase()}
            </Badge>
            <Badge variant="jurisdiction" size="sm" className="text-[10px]">
              Jurisdiction: {document.jurisdiction || "India"}
            </Badge>
            {document.isSample && (
              <Badge variant="subtle" size="sm" className="text-[10px]">
                Sample Specimen
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Two-Pane Workstation with Independent Scrolling & Resizer */}
      <WorkspaceSplitPane
        leftPane={leftPaneContent}
        rightPane={rightPaneContent}
        defaultSplit={50}
        minLeft={35}
        maxLeft={65}
        activeMobileTab={activeMobileTab}
        onMobileTabChange={setActiveMobileTab}
      />
    </div>
  )
}
