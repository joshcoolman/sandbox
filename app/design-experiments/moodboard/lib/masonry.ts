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

export function layoutMasonry(
  items: MasonryItem[],
  columns: number,
  originX: number,
  originY: number,
  colWidth = 300,
  gap = 16,
): MasonryResult[] {
  const cols = Math.min(columns, items.length)
  const totalWidth = cols * colWidth + (cols - 1) * gap
  const colHeights = new Array(cols).fill(0)

  return items.map(item => {
    const displayW = colWidth
    const displayH = (item.height / item.width) * colWidth
    const col = colHeights.indexOf(Math.min(...colHeights))
    const x = originX - totalWidth / 2 + col * (colWidth + gap)
    const y = originY + colHeights[col]
    colHeights[col] += displayH + gap

    return { id: item.id, x, y, width: displayW, height: displayH }
  })
}
