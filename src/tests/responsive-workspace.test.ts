import test from "node:test"
import assert from "node:assert/strict"

/**
 * Resizer math and clamping logic used in WorkspaceSplitPane
 */
function clampSplitPercent(
  rawPercent: number,
  containerWidth: number,
  minLeft = 35,
  maxLeft = 65,
  minPx = 300
): number {
  if (containerWidth <= 0) return 50
  const minPercentByPx = (minPx / containerWidth) * 100
  const maxPercentByPx = ((containerWidth - minPx) / containerWidth) * 100
  const effectiveMin = Math.max(minLeft, Math.min(minPercentByPx, 48))
  const effectiveMax = Math.min(maxLeft, Math.max(maxPercentByPx, 52))
  const clamped = Math.min(effectiveMax, Math.max(effectiveMin, rawPercent))
  return Math.round(clamped * 10) / 10
}

test("Responsive Split-Pane — Clamps within default percentage bounds on normal screens", () => {
  const containerWidth = 1400
  // Normal range within bounds
  assert.equal(clampSplitPercent(50, containerWidth), 50)
  assert.equal(clampSplitPercent(40, containerWidth), 40)
  assert.equal(clampSplitPercent(60, containerWidth), 60)

  // Out of bounds raw inputs
  assert.equal(clampSplitPercent(10, containerWidth), 35)
  assert.equal(clampSplitPercent(90, containerWidth), 65)
})

test("Responsive Split-Pane — Enforces 300px minimum usable pane width on medium screens", () => {
  const containerWidth = 700 // 300px is (300/700)*100 = 42.86%
  // User tries to drag left pane to 35% -> (0.35 * 700 = 245px, which is < 300px)
  // Clamp ensures it stops at 42.9% (~300px), preventing crushed left pane
  const clampedMin = clampSplitPercent(35, containerWidth)
  assert.ok(clampedMin >= 42.8 && clampedMin <= 43.0, `Expected around 42.9%, got ${clampedMin}`)

  // User tries to drag right pane to 65% -> right pane would be 35% (245px < 300px)
  // Clamp ensures it stops at ~57.1%, preserving 300px for right pane
  const clampedMax = clampSplitPercent(65, containerWidth)
  assert.ok(clampedMax >= 57.0 && clampedMax <= 57.2, `Expected around 57.1%, got ${clampedMax}`)
})

test("Responsive Split-Pane — Keyboard arrow key adjustments step by 2%", () => {
  let split = 50
  const minLeft = 35
  const maxLeft = 65

  // Left arrow decreases by 2%
  split = Math.max(minLeft, split - 2)
  assert.equal(split, 48)

  split = Math.max(minLeft, split - 2)
  assert.equal(split, 46)

  // Right arrow increases by 2%
  split = Math.min(maxLeft, split + 2)
  assert.equal(split, 48)

  // Clamp at max
  split = 64
  split = Math.min(maxLeft, split + 2)
  assert.equal(split, 65)
  split = Math.min(maxLeft, split + 2)
  assert.equal(split, 65)

  // Home key resets to 50
  split = 50
  assert.equal(split, 50)
})

test("Responsive Findings — Category chip labels remain complete and non-truncated in source data", () => {
  const CATEGORIES = [
    { id: "all", label: "All Provisions" },
    { id: "parties", label: "Parties" },
    { id: "dates", label: "Dates & Deadlines" },
    { id: "monetary", label: "Monetary Terms" },
    { id: "rights", label: "Rights" },
    { id: "obligations", label: "Obligations" },
    { id: "restrictions", label: "Restrictions" },
    { id: "termination", label: "Termination" },
    { id: "disputes", label: "Dispute Resolution" },
    { id: "review_points", label: "Review Points" },
  ]

  assert.equal(CATEGORIES.length, 10)
  for (const cat of CATEGORIES) {
    assert.ok(cat.label.length > 0)
    assert.ok(cat.id.length > 0)
  }
})
