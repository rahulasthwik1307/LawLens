"use client"

import * as React from "react"
import { Loader2, CheckCircle2, ShieldCheck, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { UploadedDocument } from "@/types/document"
import { formatFileSize } from "@/lib/document-validation"

interface ProcessingViewProps {
  document: UploadedDocument | null
  onComplete: () => void
  onCancel?: () => void
}

interface Step {
  id: string
  label: string
  subtext: string
}

const PROCESSING_STEPS: Step[] = [
  {
    id: "validate",
    label: "Validating file format and constraints",
    subtext: "Verified file extension, MIME boundary, and size threshold.",
  },
  {
    id: "read",
    label: "Reading document structure and stream",
    subtext: "Extracting plain text buffer without executing scripts or macros.",
  },
  {
    id: "boundary",
    label: "Establishing untrusted data boundary",
    subtext: "Isolating raw document content from application control layers.",
  },
  {
    id: "workspace",
    label: "Mounting document workspace",
    subtext: "Preparing dual-panel reading surface and metadata inspection.",
  },
]

export function ProcessingView({ document, onComplete, onCancel }: ProcessingViewProps) {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)

  React.useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReducedMotion) {
      // Complete immediately for reduced motion
      const timer = setTimeout(() => {
        onComplete()
      }, 300)
      return () => clearTimeout(timer)
    }

    // Step duration: 320ms per step
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < PROCESSING_STEPS.length - 1) {
          return prev + 1
        } else {
          clearInterval(interval)
          setTimeout(() => {
            onComplete()
          }, 350)
          return prev
        }
      })
    }, 320)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="max-w-xl mx-auto rounded-xl border border-border/80 bg-card p-6 md:p-8 space-y-6 shadow-xs animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Loader2 className="size-5 animate-spin motion-reduce:animate-none" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-ink-primary">
              Preparing Document
            </h3>
            <p className="text-xs text-ink-secondary">
              Ingesting document into the LawLens workspace environment
            </p>
          </div>
        </div>
        <Badge variant="outline" size="sm" className="font-mono">
          Document Intake
        </Badge>
      </div>

      {/* Target Document Details */}
      {document && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-paper-contrast/40 border border-border/60 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="size-4 text-primary shrink-0" />
            <span className="font-medium text-ink-primary truncate">
              {document.name}
            </span>
          </div>
          <span className="font-mono text-ink-muted shrink-0 ml-3">
            {formatFileSize(document.size)} · {document.extension.toUpperCase()}
          </span>
        </div>
      )}

      {/* Progress Steps List */}
      <div className="space-y-3.5">
        {PROCESSING_STEPS.map((step, idx) => {
          const isFinished = idx < currentStepIndex
          const isCurrent = idx === currentStepIndex
          const isPending = idx > currentStepIndex

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 transition-opacity duration-200 ${
                isPending ? "opacity-35" : "opacity-100"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isFinished ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="size-4 text-primary animate-spin motion-reduce:animate-none" />
                ) : (
                  <div className="size-4 rounded-full border border-border/80 bg-paper" />
                )}
              </div>
              <div className="space-y-0.5">
                <p
                  className={`text-xs font-semibold ${
                    isCurrent
                      ? "text-primary"
                      : isFinished
                      ? "text-ink-primary"
                      : "text-ink-muted"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-ink-muted leading-tight">
                  {step.subtext}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Honest Disclaimer */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-ink-muted">
          <ShieldCheck className="size-3.5 text-primary shrink-0" />
          <span>Local structure parsing only. No AI inference dispatched.</span>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-ink-muted hover:text-ink-primary transition-colors underline underline-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
