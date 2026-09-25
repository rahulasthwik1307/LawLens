"use client"

import * as React from "react"
import Link from "next/link"
import { Scale, ArrowLeft, ShieldCheck, FileCheck2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DocumentUploadZone } from "@/features/intake/document-upload-zone"
import { ProcessingView } from "@/features/intake/processing-view"
import { DocumentWorkspace } from "@/features/workspace/document-workspace"
import { UploadedDocument, DocumentLifecycleState } from "@/types/document"

export default function WorkspacePage() {
  const [lifecycleState, setLifecycleState] = React.useState<DocumentLifecycleState>("idle")
  const [currentDocument, setCurrentDocument] = React.useState<UploadedDocument | null>(null)
  const [pendingDoc, setPendingDoc] = React.useState<UploadedDocument | null>(null)

  // Handlers for workflow transitions
  const handleProcessingStart = (prelimDoc?: UploadedDocument) => {
    if (prelimDoc) {
      setPendingDoc(prelimDoc)
    }
    setLifecycleState("processing")
  }

  const handleProcessingError = () => {
    setPendingDoc(null)
    setLifecycleState("idle")
  }

  const handleDocumentReady = (doc: UploadedDocument) => {
    setPendingDoc(doc)
    setLifecycleState("processing")
  }

  const handleProcessingComplete = () => {
    if (pendingDoc && pendingDoc.isTextReadable) {
      setCurrentDocument(pendingDoc)
      setLifecycleState("ready")
    } else {
      setLifecycleState("idle")
    }
  }

  const handleSelectAnother = () => {
    setCurrentDocument(null)
    setPendingDoc(null)
    setLifecycleState("idle")
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground">
      {/* Shell Header */}
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb / Context Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-6 border-b border-border/60">
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Link
                href="/"
                className="hover:text-ink-primary transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="size-3" />
                <span>Overview</span>
              </Link>
              <span>/</span>
              <span className="text-ink-primary font-medium">Document Workspace</span>
              {currentDocument && (
                <>
                  <span>/</span>
                  <span className="font-mono text-ink-secondary truncate max-w-50">
                    {currentDocument.name}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="jurisdiction" size="sm">
                Jurisdiction: India (Active)
              </Badge>
              <Badge variant="outline" size="sm" className="hidden sm:inline-flex font-mono">
                Intake Workspace
              </Badge>
            </div>
          </div>

          {/* Workflow State Switcher */}
          {lifecycleState === "idle" && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
              {/* Intake Heading */}
              <div className="text-center space-y-2 max-w-xl mx-auto">
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-ink-primary">
                  Document Intake & Ingestion
                </h1>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Select or upload an Indian legal agreement, deed, or contract to load it into the isolated LawLens workspace.
                </p>
              </div>

              {/* Upload Zone & Samples */}
              <DocumentUploadZone
                onDocumentReady={handleDocumentReady}
                onProcessingStart={handleProcessingStart}
                onProcessingError={handleProcessingError}
              />
            </div>
          )}

          {lifecycleState === "processing" && (
            <div className="py-12">
              <ProcessingView
                document={pendingDoc}
                onComplete={handleProcessingComplete}
                onCancel={handleSelectAnother}
              />
            </div>
          )}

          {lifecycleState === "ready" && currentDocument && (
            <DocumentWorkspace
              document={currentDocument}
              onSelectAnother={handleSelectAnother}
            />
          )}
        </div>
      </main>

      {/* Shell Footer */}
      <Footer />
    </div>
  )
}
