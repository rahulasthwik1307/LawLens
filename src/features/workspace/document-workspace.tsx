"use client"

import * as React from "react"
import {
  FileText,
  ArrowLeft,
  Copy,
  Check,
  Shield,
  Layers,
  Sparkles,
  Info,
  Scale,
  Hash,
  BookOpen,
  FileCode,
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
} from "@/services/ai/types"
import { AnalysisLoadingView } from "./analysis-loading-view"
import { FindingsPanel } from "./findings-panel"
import { DocumentQAPanel } from "./document-qa-panel"
import { DocumentComparisonPanel } from "./document-comparison-panel"
import { ActionMapPanel } from "./action-map-panel"
import { PreparationPackPanel } from "./preparation-pack-panel"
import { ConnectPanel } from "./connect-panel"

interface DocumentWorkspaceProps {
  document: UploadedDocument
  onSelectAnother: () => void
}

type AnalysisStatus = "idle" | "loading" | "ready" | "error"

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
  const [workspaceMode, setWorkspaceMode] = React.useState<"findings" | "qa" | "compare" | "actions" | "prepare" | "connect">("findings")
  const [comparisonResult, setComparisonResult] = React.useState<DocumentComparisonResult | null>(null)
  const [comparisonDocB, setComparisonDocB] = React.useState<UploadedDocument | null>(null)
  const [actions, setActions] = React.useState<ActionItem[]>([])
  const [qaHistory, setQAHistory] = React.useState<DocumentQAResult[]>([])
  const [activeViewerDoc, setActiveViewerDoc] = React.useState<UploadedDocument>(document)

  React.useEffect(() => {
    setActiveViewerDoc(document)
  }, [document])

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

  // Handle Evidence selection: highlight lines and scroll to line range
  const handleSelectEvidence = (evidence: FindingEvidence) => {
    setActiveEvidence(evidence)

    const targetEl = lineRefs.current.get(evidence.startLine)
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
    }
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

    setTimeout(() => {
      const targetEl = lineRefs.current.get(params.startLine)
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 50)
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
    } catch (err: unknown) {
      setErrorMessage(
        "Network connection failed while contacting the analysis service. Please try again."
      )
      setAnalysisStatus("error")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Workspace Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAnother}
              className="gap-1.5 text-xs text-ink-secondary hover:text-ink-primary"
            >
              <ArrowLeft className="size-3.5" />
              <span>Select Another Document</span>
            </Button>
            <Badge variant="outline" size="sm" className="font-mono">
              .{document.extension.toUpperCase()}
            </Badge>
            <Badge variant="jurisdiction" size="sm">
              Jurisdiction: {document.jurisdiction}
            </Badge>
            {document.isSample && (
              <Badge variant="subtle" size="sm">
                Sample Specimen
              </Badge>
            )}
          </div>

          <h2 className="font-serif text-xl md:text-2xl font-bold text-ink-primary flex items-center gap-2">
            <FileText className="size-5 text-primary shrink-0" />
            <span className="truncate">{document.name}</span>
          </h2>
        </div>

        {/* Metadata stats pill */}
        <div className="flex items-center gap-4 text-xs text-ink-muted bg-paper px-3.5 py-2 rounded-lg border border-border/70 self-start md:self-auto shrink-0">
          <div>
            <span className="font-medium text-ink-secondary">Size:</span>{" "}
            {formatFileSize(document.size)}
          </div>
          <div className="w-px h-3.5 bg-border" />
          <div>
            <span className="font-medium text-ink-secondary">Lines:</span>{" "}
            {document.lineCount}
          </div>
          <div className="w-px h-3.5 bg-border" />
          <div>
            <span className="font-medium text-ink-secondary">Words:</span>{" "}
            {document.wordCount}
          </div>
        </div>
      </div>

      {/* Main Dual-Panel Reading and Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Original Source Material (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Original Source Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-bold text-ink-primary uppercase tracking-wide">
                Original Document (Untrusted Source)
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono text-ink-muted bg-secondary px-2 py-0.5 rounded">
                <Shield className="size-3 text-primary" />
                <span>Isolated View</span>
              </div>
            </div>

            {document.isTextReadable && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
                    showLineNumbers
                      ? "border-primary/40 bg-primary/5 text-primary"
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
                  className="gap-1 h-7 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
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

          {/* Active Highlight Context Pill (if an evidence citation is selected) */}
          {activeEvidence && (
            <div className="rounded-lg bg-primary/10 border border-primary/30 px-3.5 py-2 flex items-center justify-between text-xs text-ink-primary animate-in fade-in duration-150">
              <div className="flex items-center gap-2 min-w-0">
                <Compass className="size-4 text-primary shrink-0" />
                <span className="font-medium truncate">
                  Highlighting Lines {activeEvidence.startLine}–{activeEvidence.endLine}
                </span>
                <span className="text-[11px] text-ink-muted hidden sm:inline truncate">
                  (&ldquo;{activeEvidence.sourceText.substring(0, 45)}...&rdquo;)
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearHighlight}
                className="flex items-center gap-1 text-[11px] font-medium text-ink-secondary hover:text-ink-primary ml-2 shrink-0 underline"
              >
                <X className="size-3" />
                <span>Clear Highlight</span>
              </button>
            </div>
          )}

          {/* Reading Surface Container */}
          <div className="rounded-xl border border-border/90 bg-card overflow-hidden shadow-xs">
            {/* Visual Header Banner for Untrusted Content Boundary */}
            <div className="px-4 py-2.5 bg-paper-contrast/50 border-b border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-secondary">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <FileCode className="size-3.5 text-primary" />
                <span className="font-semibold text-ink-primary truncate max-w-56">
                  {activeViewerDoc.name}
                </span>
                <span className="text-ink-muted">({lines.length} lines)</span>
                {activeViewerDoc.id !== document.id && (
                  <Badge variant="outline" size="sm" className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 text-[10px]">
                    Viewing Document B
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeViewerDoc.id !== document.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveViewerDoc(document)
                      setActiveEvidence(null)
                    }}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Switch to Document A
                  </button>
                )}
                <span className="text-[11px] text-ink-muted italic hidden sm:inline">
                  Source text is passive data
                </span>
              </div>
            </div>

            {/* Document Text Display */}
            {activeViewerDoc.isTextReadable ? (
              <div
                ref={documentViewerRef}
                tabIndex={0}
                role="region"
                aria-label="Original document text content"
                className="max-h-180 overflow-y-auto p-4 md:p-6 text-ink-primary font-serif text-[14px] leading-relaxed selection:bg-primary/15 outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <div className="space-y-1">
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
                        className={`flex items-start gap-4 group transition-colors duration-150 rounded px-1 -mx-1 ${
                          isHighlighted
                            ? "bg-primary/15 border-l-2 border-primary pl-2 font-medium"
                            : "hover:bg-paper-contrast/40"
                        }`}
                      >
                        {showLineNumbers && (
                          <span
                            className={`font-mono text-[11px] select-none shrink-0 w-8 text-right pt-0.5 ${
                              isHighlighted
                                ? "text-primary font-bold"
                                : "text-ink-muted/60 group-hover:text-ink-secondary"
                            }`}
                          >
                            {lineNumber}
                          </span>
                        )}
                        <p className="flex-1 whitespace-pre-wrap wrap-break-word font-normal">
                          {line || <span className="opacity-0">{"."}</span>}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Safe Binary Inspection Container for Non-Text Extracted Files */
              <div className="p-8 md:p-12 text-center space-y-4 bg-paper/50">
                <div className="w-14 h-14 rounded-full bg-secondary text-primary mx-auto flex items-center justify-center">
                  <BookOpen className="size-7" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h4 className="font-serif text-lg font-bold text-ink-primary">
                    Safe Binary Container Mounted
                  </h4>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    This {document.extension.toUpperCase()} document ({formatFileSize(document.size)}) has been validated and loaded into memory as untrusted binary data.
                  </p>
                  <p className="text-[11px] text-ink-muted bg-paper-contrast/60 p-3 rounded-md border border-border/60">
                    <strong>Notice:</strong> This document format requires server-side extraction before analysis. To explore active evidence grounding, upload a .TXT or .MD file or select an Indian legal sample.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: LawLens Interpretation Boundary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-2.5">
            <div className="flex items-center gap-1 bg-paper p-1 rounded-lg border border-border/70 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setWorkspaceMode("findings")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  workspaceMode === "findings"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-paper-contrast"
                }`}
              >
                <Sparkles className="size-3.5" />
                <span>Findings</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode("qa")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  workspaceMode === "qa"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-paper-contrast"
                }`}
              >
                <HelpCircle className="size-3.5" />
                <span>Q&A</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode("compare")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  workspaceMode === "compare"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-paper-contrast"
                }`}
              >
                <GitCompare className="size-3.5" />
                <span>Compare</span>
              </button>
              <button
                type="button"
                id="mode-tab-actions"
                onClick={() => setWorkspaceMode("actions")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  workspaceMode === "actions"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-paper-contrast"
                }`}
              >
                <Compass className="size-3.5" />
                <span>Actions</span>
              </button>
              <button
                type="button"
                id="mode-tab-prepare"
                onClick={() => setWorkspaceMode("prepare")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  workspaceMode === "prepare"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-paper-contrast"
                }`}
              >
                <Briefcase className="size-3.5" />
                <span>Prepare</span>
              </button>
              <button
                type="button"
                id="mode-tab-connect"
                onClick={() => setWorkspaceMode("connect")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  workspaceMode === "connect"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-paper-contrast"
                }`}
              >
                <ArrowUpRight className="size-3.5" />
                <span>Connect</span>
              </button>
            </div>

            <Badge
              variant={
                workspaceMode === "connect" || workspaceMode === "prepare" || workspaceMode === "actions" || workspaceMode === "compare" || workspaceMode === "qa"
                  ? "outline"
                  : analysisStatus === "ready"
                  ? "default"
                  : "outline"
              }
              size="sm"
              className="font-mono text-[10px]"
            >
              {workspaceMode === "connect"
                ? "Resource Handoff"
                : workspaceMode === "prepare"
                ? "Preparation Pack"
                : workspaceMode === "actions"
                ? "Action Map"
                : workspaceMode === "compare"
                ? "Dual Comparison"
                : workspaceMode === "qa"
                ? "Interactive Q&A"
                : analysisStatus === "ready"
                ? "Grounded Output"
                : analysisStatus === "loading"
                ? "Analyzing..."
                : "Workspace Ready"}
            </Badge>
          </div>

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
                setTimeout(() => {
                  const targetEl = lineRefs.current.get(params.startLine)
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                }, 50)
              }}
              onActiveViewerDocChange={setActiveViewerDoc}
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
                setTimeout(() => {
                  const targetEl = lineRefs.current.get(params.startLine)
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                }, 50)
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
            <div className="rounded-xl border border-border/80 bg-card p-6 md:p-8 space-y-6 shadow-xs">
              <div className="space-y-3 pb-4 border-b border-border/60">
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
                  className="w-full gap-2 shadow-xs font-semibold text-xs"
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

              {/* Security & Truthfulness Notice */}
              <div className="rounded-md bg-paper-contrast/40 border border-border/60 p-3 text-[11px] text-ink-muted flex items-start gap-2.5">
                <Info className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Strict Evidence Constraint:</strong> AI findings are verified against the original text before display. Unsupported claims are rejected to avoid hallucination.
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
              className="rounded-xl border border-red-200 bg-red-50/90 p-6 space-y-4 text-red-950 shadow-xs"
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

              <div className="pt-2 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartAnalysis}
                  className="gap-1.5 text-xs border-red-300 text-red-900 hover:bg-red-100"
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
                Your original document remains completely safe and accessible on the left.
              </div>
            </div>
          )}

          {analysisStatus === "ready" && analysisResult && (
            <FindingsPanel
              analysis={analysisResult}
              activeEvidence={activeEvidence}
              onSelectEvidence={handleSelectEvidence}
              onReanalyze={handleStartAnalysis}
            />
          )}
        </>
      )}
        </div>
      </div>
    </div>
  )
}
