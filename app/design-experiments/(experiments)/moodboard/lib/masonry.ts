export interface MasonryItem {
  id: string
  width: number
  height: number
}

export interface MasonryResult {
  id: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * Layout items in a masonry grid. All items are scaled to the column width
 * (preserving aspect ratio). Column width defaults to the median item width
 * if not provided, so arrange/group uses the current scale of images on canvas.
 */
export function layoutMasonry(
  items: MasonryItem[],
  columns: number,
  originX: number,
  originY: number,
  colWidth?: number,
  gap = 16,
): MasonryResult[] {
  const cols = Math.min(columns, items.length)

  // Use provided colWidth, or derive from median of actual widths
  const effectiveColWidth = colWidth ?? (() => {
    const widths = items.map(i => i.width).sort((a, b) => a - b)
    return widths[Math.floor(widths.length / 2)]
  })()

  const totalWidth = cols * effectiveColWidth + (cols - 1) * gap
  const colHeights = new Array(cols).fill(0)

  return items.map(item => {
    const displayW = effectiveColWidth
    const displayH = (item.height / item.width) * effectiveColWidth
    const col = colHeights.indexOf(Math.min(...colHeights))
    const x = originX - totalWidth / 2 + col * (effectiveColWidth + gap)
    const y = originY + colHeights[col]
    colHeights[col] += displayH + gap

    return { id: item.id, x, y, width: displayW, height: displayH }
  })
}
