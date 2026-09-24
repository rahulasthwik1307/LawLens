"use client"

import * as React from "react"
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  FileCode,
  File,
  ArrowRight,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_EXTENSIONS,
  validateFileMetadata,
  processLocalFile,
  formatFileSize,
} from "@/lib/document-validation"
import { SAMPLE_DOCUMENTS } from "@/lib/sample-documents"
import { UploadedDocument, ValidationError } from "@/types/document"

interface DocumentUploadZoneProps {
  onDocumentReady: (doc: UploadedDocument) => void
  onProcessingStart: () => void
}

export function DocumentUploadZone({
  onDocumentReady,
  onProcessingStart,
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [validationError, setValidationError] = React.useState<ValidationError | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    setValidationError(null)

    // Pre-validate metadata
    const error = validateFileMetadata(file)
    if (error) {
      setValidationError(error)
      return
    }

    // Trigger intentional processing state
    onProcessingStart()

    // Process file
    const result = await processLocalFile(file, "India")
    if (result.isValid && result.document) {
      onDocumentReady(result.document)
    } else if (result.error) {
      setValidationError(result.error)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleSampleSelect = (sample: UploadedDocument) => {
    setValidationError(null)
    onProcessingStart()
    // Trigger intentional transition
    setTimeout(() => {
      onDocumentReady(sample)
    }, 600)
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Upload legal document. Drag and drop or press Enter to browse files."
        className={`relative group rounded-xl border-2 border-dashed p-8 md:p-12 text-center transition-all duration-150 ease-out cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 select-none ${
          isDragging
            ? "border-primary bg-primary/5 scale-[0.99]"
            : "border-border/90 bg-card hover:bg-paper-contrast/40 hover:border-primary/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,.docx"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          aria-hidden="true"
          tabIndex={-1}
        />

        <div className="flex flex-col items-center space-y-4 max-w-md mx-auto">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isDragging
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-ink-secondary group-hover:text-primary group-hover:bg-primary/10"
            }`}
          >
            <UploadCloud className="size-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-serif text-lg md:text-xl font-semibold text-ink-primary">
              Choose a legal document or drag & drop here
            </h3>
            <p className="text-xs md:text-sm text-ink-secondary leading-relaxed">
              Upload agreements, lease deeds, contracts, or statutory excerpts for evidence-grounded review.
            </p>
          </div>

          {/* Formats & Limitation badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <Badge variant="outline" size="sm">.TXT</Badge>
            <Badge variant="outline" size="sm">.MD</Badge>
            <Badge variant="outline" size="sm">.PDF</Badge>
            <Badge variant="outline" size="sm">.DOCX</Badge>
            <span className="text-[11px] text-ink-muted ml-1">
              (Max {MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB)
            </span>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              size="sm"
              className="pointer-events-none shadow-xs text-xs font-semibold"
            >
              Browse Local Files
            </Button>
          </div>
        </div>
      </div>

      {/* Validation Error Feedback */}
      {validationError && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50/90 p-4 text-red-900 flex items-start gap-3 transition-all"
        >
          <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-semibold text-red-950">{validationError.title}</p>
            <p className="text-red-800 leading-relaxed">{validationError.message}</p>
            <p className="text-red-700 font-medium pt-1">{validationError.suggestion}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setValidationError(null)
            }}
            className="ml-auto text-xs font-semibold text-red-800 hover:text-red-950 underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sample Documents Section — Immediate Review */}
      <div className="rounded-lg border border-border/70 bg-paper p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
              Or Load Authentic Indian Legal Agreements (1-Click Test)
            </span>
          </div>
          <Badge variant="jurisdiction" size="sm">India Context</Badge>
        </div>

        <p className="text-xs text-ink-secondary leading-relaxed">
          Test the document intake and workspace immediately with real legal instruments formatted for Indian jurisdiction standards:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSampleSelect(sample)}
              className="flex flex-col items-start p-3 rounded-md border border-border/80 bg-card hover:border-primary/40 hover:bg-paper-contrast/50 text-left transition-all duration-100 ease-out active:scale-[0.98] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-[11px] font-semibold text-primary">
                  {sample.extension.toUpperCase()}
                </span>
                <span className="text-[10px] text-ink-muted">
                  {formatFileSize(sample.size)}
                </span>
              </div>
              <span className="font-serif text-xs font-bold text-ink-primary group-hover:text-primary transition-colors line-clamp-1">
                {sample.name.replace(".txt", "").replace(/_/g, " ")}
              </span>
              <span className="text-[11px] text-ink-muted pt-1">
                {sample.lineCount} lines · {sample.wordCount} words
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Security & Untrusted Boundary Disclaimer */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-md border border-border/60 bg-paper-contrast/30 text-xs text-ink-muted">
        <ShieldCheck className="size-4 text-primary shrink-0" />
        <p className="leading-normal">
          <strong>Security Principle:</strong> Document text is handled as untrusted data.
          No file contents are executed, and no external AI calls are dispatched in Phase 2.
        </p>
      </div>
    </div>
  )
}
