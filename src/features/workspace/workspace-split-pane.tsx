"use client"

import * as React from "react"
import { FileText, Sparkles, GripVertical } from "lucide-react"

interface WorkspaceSplitPaneProps {
  leftPane: React.ReactNode
  rightPane: React.ReactNode
  defaultSplit?: number
  minLeft?: number
  maxLeft?: number
  activeMobileTab: "document" | "ai"
  onMobileTabChange: (tab: "document" | "ai") => void
  className?: string
}

export function WorkspaceSplitPane({
  leftPane,
  rightPane,
  defaultSplit = 50,
  minLeft = 35,
  maxLeft = 65,
  activeMobileTab,
  onMobileTabChange,
  className = "",
}: WorkspaceSplitPaneProps) {
  const [splitPercent, setSplitPercent] = React.useState<number>(defaultSplit)
  const [isDragging, setIsDragging] = React.useState<boolean>(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Start dragging divider with pointer capture for smooth tracking across child panes
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary button (left click or touch)
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    if (rect.width <= 0) return

    const pointerOffset = e.clientX - rect.left
    const rawPercent = (pointerOffset / rect.width) * 100
    const clampedPercent = Math.min(maxLeft, Math.max(minLeft, rawPercent))
    setSplitPercent(Math.round(clampedPercent * 10) / 10)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // Safe fallback
      }
      setIsDragging(false)
    }
  }

  // Double click resets to default 50/50 split
  const handleDoubleClick = () => {
    setSplitPercent(defaultSplit)
  }

  // Accessible keyboard control
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      setSplitPercent((prev) => Math.max(minLeft, prev - 2))
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      setSplitPercent((prev) => Math.min(maxLeft, prev + 2))
    } else if (e.key === "Home" || e.key === "Enter") {
      e.preventDefault()
      setSplitPercent(defaultSplit)
    }
  }

  return (
    <div className={`flex flex-col w-full min-w-0 ${className}`}>
      {/* Mobile & Tablet Pane Switcher (< lg breakpoint) */}
      <div className="lg:hidden flex items-center justify-between pb-3 mb-2 border-b border-border/70">
        <div
          role="tablist"
          aria-label="Workspace View Mode"
          className="grid grid-cols-2 p-1 rounded-lg bg-paper-contrast/60 border border-border/70 w-full max-w-sm text-xs font-semibold"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMobileTab === "document"}
            onClick={() => onMobileTabChange("document")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md transition-all duration-150 ${
              activeMobileTab === "document"
                ? "bg-card text-ink-primary shadow-xs font-bold"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            <FileText className="size-3.5 text-primary" />
            <span>Document</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMobileTab === "ai"}
            onClick={() => onMobileTabChange("ai")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md transition-all duration-150 ${
              activeMobileTab === "ai"
                ? "bg-card text-ink-primary shadow-xs font-bold"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            <Sparkles className="size-3.5 text-primary" />
            <span>AI Workspace</span>
          </button>
        </div>
      </div>

      {/* Main Workstation Container */}
      <div
        ref={containerRef}
        style={
          {
            "--split-left": `${splitPercent}%`,
            height: "calc(100vh - 12rem)",
            minHeight: "640px",
            maxHeight: "920px",
          } as React.CSSProperties
        }
        className={`relative w-full min-w-0 flex flex-col lg:flex-row items-stretch rounded-xl border border-border/90 bg-background overflow-hidden ${
          isDragging ? "select-none cursor-col-resize" : ""
        }`}
      >
        {/* Left Pane: Original Document Reader */}
        <div
          className={`h-full min-w-0 flex-col overflow-hidden w-full lg:w-(--split-left) ${
            activeMobileTab === "document" ? "flex flex-1" : "hidden lg:flex"
          }`}
          data-pane="document"
        >
          {leftPane}
        </div>

        {/* Resizable Divider (Desktop lg+ only) */}
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-valuenow={Math.round(splitPercent)}
          aria-valuemin={minLeft}
          aria-valuemax={maxLeft}
          aria-label="Resize workspace panes. Use left and right arrow keys to adjust, or double click to reset to 50/50."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          title="Drag to resize panes · Double click to center"
          className={`hidden lg:flex shrink-0 items-center justify-center w-2 -mx-1 cursor-col-resize relative z-20 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isDragging ? "bg-primary/20" : "hover:bg-primary/10"
          }`}
        >
          {/* Subtle vertical rule */}
          <div
            className={`w-px h-full transition-colors ${
              isDragging
                ? "bg-primary"
                : "bg-border/90 group-hover:bg-primary/60"
            }`}
          />
          {/* Central tactile grab handle pill */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-7 rounded-full border border-border/80 bg-paper shadow-2xs flex items-center justify-center transition-all duration-150 group-hover:scale-105 group-hover:border-primary/50 ${
              isDragging ? "border-primary bg-primary text-paper" : "text-ink-muted group-hover:text-primary"
            }`}
          >
            <GripVertical className="size-2.5" />
          </div>
        </div>

        {/* Right Pane: AI Workspace */}
        <div
          className={`h-full min-w-0 flex-col overflow-hidden border-t lg:border-t-0 lg:border-l border-border/80 w-full lg:w-[calc(100%-var(--split-left))] ${
            activeMobileTab === "ai" ? "flex flex-1" : "hidden lg:flex"
          }`}
          data-pane="ai-workspace"
        >
          {rightPane}
        </div>
      </div>
    </div>
  )
}
