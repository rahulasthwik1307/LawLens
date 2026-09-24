"use client"

import * as React from "react"
import {
  HelpCircle,
  Search,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Info,
  CornerDownLeft,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DocumentQAResult,
  FindingEvidence,
  QAEvidenceItem,
} from "@/services/ai/types"
import { UploadedDocument } from "@/types/document"

interface DocumentQAPanelProps {
  document: UploadedDocument
  activeEvidence?: FindingEvidence | null
  onSelectEvidence: (evidence: FindingEvidence) => void
  qaHistory?: DocumentQAResult[]
  onQAHistoryChange?: (history: DocumentQAResult[]) => void
}

const DEFAULT_SUGGESTIONS = [
  "When can the agreement be terminated?",
  "What are the payment and rent obligations?",
  "Is there a refundable security deposit?",
  "Who is responsible for maintenance and repairs?",
  "Are there restrictions on assignment or subletting?",
  "Does this document specify a dispute resolution mechanism?",
]

export function DocumentQAPanel({
  document,
  activeEvidence,
  onSelectEvidence,
  qaHistory: externalHistory,
  onQAHistoryChange,
}: DocumentQAPanelProps) {
  const [question, setQuestion] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [loadingStep, setLoadingStep] = React.useState(0)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [internalHistory, setInternalHistory] = React.useState<DocumentQAResult[]>([])
  const history = externalHistory !== undefined ? externalHistory : internalHistory

  const handleClearHistory = React.useCallback(() => {
    if (onQAHistoryChange) {
      onQAHistoryChange([])
    } else {
      setInternalHistory([])
    }
  }, [onQAHistoryChange])

  const inputRef = React.useRef<HTMLInputElement>(null)

  // Loading steps animation
  React.useEffect(() => {
    if (!loading) {
      setLoadingStep(0)
      return
    }

    const t1 = setTimeout(() => setLoadingStep(1), 1200)
    const t2 = setTimeout(() => setLoadingStep(2), 3500)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [loading])

  const handleAsk = async (queryToAsk?: string) => {
    const q = (queryToAsk || question).trim()
    if (!q || loading) return

    if (q.length < 3) {
      setErrorMessage("Please enter a question with at least 3 characters.")
      return
    }

    if (q.length > 500) {
      setErrorMessage("Question exceeds maximum length of 500 characters.")
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const res = await fetch("/api/documents/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document,
          question: q,
          jurisdiction: document.jurisdiction || "India",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(
          data?.error || "Unable to answer your question. Please try again."
        )
        return
      }

      const result = data as DocumentQAResult
      // Prepend to history so latest question appears first
      const updatedHistory = [result, ...history]
      if (onQAHistoryChange) {
        onQAHistoryChange(updatedHistory)
      } else {
        setInternalHistory(updatedHistory)
      }
      setQuestion("")
    } catch {
      setErrorMessage(
        "Network connection failed while contacting the analysis service. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Overview Banner */}
      <div className="rounded-xl border border-border/80 bg-paper p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold text-ink-primary">
              Evidence-Grounded Legal Q&A
            </span>
            <Badge variant="subtle" size="sm" className="font-mono text-[10px]">
              Targeted Retrieval
            </Badge>
          </div>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="h-7 text-xs text-ink-muted hover:text-ink-primary gap-1"
            >
              <Trash2 className="size-3" />
              <span>Clear History</span>
            </Button>
          )}
        </div>

        <p className="text-xs md:text-sm text-ink-secondary leading-relaxed">
          Ask specific questions about this document. Every answer is retrieved from relevant clauses, verified against the source text, and mapped to exact line numbers.
        </p>

        {/* Disclaimer Notice */}
        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted bg-paper-contrast/60 px-3 py-1.5 rounded-md border border-border/50">
          <Info className="size-3.5 text-primary shrink-0" />
          <span>
            Answers provide document-grounded legal information, not legal advice or representation.
          </span>
        </div>
      </div>

      {/* Question Input Section */}
      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
        <label
          htmlFor="qa-question-input"
          className="text-xs font-semibold text-ink-primary uppercase tracking-wider block"
        >
          Ask a Question About This Document
        </label>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 text-ink-primary">
            <Search className="size-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="qa-question-input"
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || !document.isTextReadable}
              placeholder={
                document.isTextReadable
                  ? "e.g. When can the lessor terminate this agreement?"
                  : "Document text extraction required to ask questions."
              }
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm rounded-lg bg-paper border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <Button
            onClick={() => handleAsk()}
            disabled={loading || !question.trim() || !document.isTextReadable}
            className="gap-1.5 h-9 px-4 text-xs font-semibold shrink-0"
          >
            <span>Ask</span>
            <CornerDownLeft className="size-3.5" />
          </Button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-900 flex items-start gap-2"
          >
            <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
            <p className="flex-1 leading-normal">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-900 font-bold px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Suggested Question Chips */}
        {document.isTextReadable && (
          <div className="pt-1 space-y-1.5">
            <span className="text-[11px] font-medium text-ink-muted">
              Suggested questions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={loading}
                  className="text-[11px] text-ink-secondary bg-paper hover:bg-paper-contrast hover:text-ink-primary border border-border/80 px-2.5 py-1 rounded-md transition-colors text-left disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
            <Sparkles className="size-4 animate-spin text-primary" />
            <span>Analyzing Document Clauses</span>
          </div>

          <div className="space-y-2.5 text-xs text-ink-secondary">
            <div className="flex items-center gap-2">
              <div
                className={`size-2 rounded-full ${
                  loadingStep >= 0 ? "bg-primary" : "bg-border"
                }`}
              />
              <span className={loadingStep === 0 ? "font-semibold text-ink-primary" : ""}>
                Retrieving targeted clauses and surrounding context...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`size-2 rounded-full ${
                  loadingStep >= 1 ? "bg-primary" : "bg-border"
                }`}
              />
              <span className={loadingStep === 1 ? "font-semibold text-ink-primary" : ""}>
                Synthesizing evidence with Groq GPT-OSS...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`size-2 rounded-full ${
                  loadingStep >= 2 ? "bg-primary" : "bg-border"
                }`}
              />
              <span className={loadingStep === 2 ? "font-semibold text-ink-primary" : ""}>
                Verifying citations against original document lines...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Q&A Results List */}
      <div className="space-y-4">
        {history.map((result, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-xs"
          >
            {/* Question Header & Confidence */}
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <HelpCircle className="size-3.5 text-primary" />
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Question
                  </span>
                </div>
                <h3 className="font-serif text-base font-bold text-ink-primary">
                  {result.question}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {result.confidence === "clear_in_document" && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    <span>Clear in document</span>
                  </span>
                )}
                {result.confidence === "supported_by_source" && (
                  <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Supported by source
                  </span>
                )}
                {result.confidence === "needs_review" && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <AlertCircle className="size-3 text-amber-600" />
                    <span>Needs review</span>
                  </span>
                )}
                {result.confidence === "unclear_from_document" && (
                  <span className="text-[11px] font-medium text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Unclear from document
                  </span>
                )}

                <Badge variant="subtle" size="sm" className="font-mono text-[10px] text-ink-muted">
                  {result.metadata.modelName}
                </Badge>
              </div>
            </div>

            {/* Answer Body */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                Answer
              </span>
              <p className="text-xs md:text-sm text-ink-primary leading-relaxed">
                {result.answer}
              </p>
            </div>

            {/* Uncertainty Callout */}
            {result.uncertainty && (
              <div className="rounded-md bg-amber-50/90 border border-amber-200 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="size-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-normal">{result.uncertainty}</p>
              </div>
            )}

            {/* Evidence Citations */}
            {result.evidence && result.evidence.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-secondary">
                  <span className="text-[11px] uppercase tracking-wider">
                    Supporting Evidence ({result.stats.verifiedCount} of {result.stats.totalEvidenceCount} Verified)
                  </span>
                </div>

                <div className="space-y-2">
                  {result.evidence.map((item: QAEvidenceItem, evIdx: number) => {
                    const isCurrentActive =
                      activeEvidence &&
                      activeEvidence.startLine === item.startLine &&
                      activeEvidence.endLine === item.endLine

                    return (
                      <div
                        key={evIdx}
                        className={`rounded-lg p-3 space-y-2 border transition-colors ${
                          isCurrentActive
                            ? "bg-primary/5 border-primary shadow-xs"
                            : "bg-paper border-border/70"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-medium text-ink-secondary">
                            Lines {item.startLine}–{item.endLine}
                          </span>
                          <span
                            className={`text-[10px] font-semibold uppercase ${
                              item.verificationStatus === "verified"
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }`}
                          >
                            {item.verificationStatus === "verified"
                              ? "Verbatim Excerpt"
                              : "Unverified Quote"}
                          </span>
                        </div>

                        <blockquote className="font-serif text-xs text-ink-primary italic border-l-2 border-primary/60 pl-2.5 py-0.5 leading-relaxed bg-paper-contrast/30 rounded-r">
                          &ldquo;{item.sourceText}&rdquo;
                        </blockquote>

                        <div className="pt-1 flex justify-end">
                          <Button
                            variant={isCurrentActive ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              onSelectEvidence({
                                sourceText: item.sourceText,
                                startLine: item.startLine,
                                endLine: item.endLine,
                                verificationStatus: item.verificationStatus,
                              })
                            }
                            className="gap-1.5 h-7 text-xs font-medium"
                          >
                            <span>
                              {isCurrentActive ? "Viewing in Document" : "View in Document"}
                            </span>
                            <ChevronRight className="size-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-ink-muted italic py-1 border-t border-border/50 pt-2">
                No specific supporting clauses were cited in the document.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State when no questions have been asked */}
      {!loading && history.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/80 bg-paper/40 p-8 text-center space-y-3">
          <div className="size-10 rounded-full bg-secondary text-primary mx-auto flex items-center justify-center">
            <BookOpen className="size-5" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="font-serif text-sm font-bold text-ink-primary">
              No Questions Asked Yet
            </h4>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Ask any question above or choose a suggested question to inspect grounded legal evidence from this document.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
