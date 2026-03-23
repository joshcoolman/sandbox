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
 * Layout items in a masonry grid, preserving each item's current size.
 * Column width is derived from the median item width.
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
    const col = colHeights.indexOf(Math.min(...colHeights))
    const x = originX - totalWidth / 2 + col * (effectiveColWidth + gap)
    const y = originY + colHeights[col]
    // Keep original dimensions — just reposition
    colHeights[col] += item.height + gap

    return { id: item.id, x, y, width: item.width, height: item.height }
  })
}
