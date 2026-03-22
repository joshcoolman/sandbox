'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import hotkeys from 'hotkeys-js'
import type { CanvasImage, Transform, DragMode } from '../types'
import { loadPersistedState, savePersistedState, fileToDataUrl } from '../lib/persistence'
import styles from './InfiniteCanvas.module.css'

interface InfiniteCanvasProps {
  storageKey?: string
  className?: string
}

const MIN_SCALE = 0.02
const MAX_SCALE = 1.0
const DEFAULT_SCALE = 0.5

function getBounds(imgs: CanvasImage[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const img of imgs) {
    x0 = Math.min(x0, img.x)
    y0 = Math.min(y0, img.y)
    x1 = Math.max(x1, img.x + img.width)
    y1 = Math.max(y1, img.y + img.height)
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

export function InfiniteCanvas({ storageKey = 'canvas', className }: InfiniteCanvasProps) {
  const [images, setImages] = useState<CanvasImage[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: DEFAULT_SCALE })
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tRef = useRef(transform)
  const iRef = useRef(images)
  const sRef = useRef(selected)
  const spaceRef = useRef(false)
  const pasteTargetRef = useRef<{ x: number; y: number } | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragRef = useRef<{ mode: DragMode; sx: number; sy: number; moved: boolean }>({
    mode: null, sx: 0, sy: 0, moved: false,
  })

  useEffect(() => { tRef.current = transform }, [transform])
  useEffect(() => { iRef.current = images }, [images])
  useEffect(() => { sRef.current = selected }, [selected])

  /* ── Load persisted state ── */

  useEffect(() => {
    loadPersistedState(storageKey).then(state => {
      if (state) {
        setImages(state.images)
        setTransform(state.transform)
        tRef.current = state.transform
        iRef.current = state.images
      }
      setLoaded(true)
    })
  }, [storageKey])

  /* ── Save state (debounced) ── */

  useEffect(() => {
    if (!loaded) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      savePersistedState({ images, transform }, storageKey)
    }, 500)
  }, [images, transform, loaded, storageKey])

  /* ── Coordinates ── */

  const screenToCanvas = useCallback((sx: number, sy: number) => {
    const r = containerRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    const t = tRef.current
    return { x: (sx - r.left - t.x) / t.scale, y: (sy - r.top - t.y) / t.scale }
  }, [])

  const viewportCenter = useCallback(() => {
    const r = containerRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    return screenToCanvas(r.left + r.width / 2, r.top + r.height / 2)
  }, [screenToCanvas])

  const getPasteTarget = useCallback(() => {
    return pasteTargetRef.current ?? viewportCenter()
  }, [viewportCenter])

  /* ── Image loading ── */

  const addImagesFromFiles = useCallback(async (files: FileList | File[], cx: number, cy: number) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const loaded = await Promise.all(imageFiles.map(async file => {
      const dataUrl = await fileToDataUrl(file)
      return new Promise<{ dataUrl: string; w: number; h: number }>(resolve => {
        const img = new Image()
        img.onload = () => resolve({ dataUrl, w: img.naturalWidth, h: img.naturalHeight })
        img.onerror = () => resolve({ dataUrl, w: 300, h: 300 })
        img.src = dataUrl
      })
    }))

    const maxCols = Math.min(6, loaded.length)
    const colWidth = 300
    const gap = 16
    const totalWidth = maxCols * colWidth + (maxCols - 1) * gap
    const colHeights = new Array(maxCols).fill(0)

    const newImages: CanvasImage[] = loaded.map(({ dataUrl, w, h }) => {
      const displayW = colWidth
      const displayH = (h / w) * colWidth
      const col = colHeights.indexOf(Math.min(...colHeights))
      const x = cx - totalWidth / 2 + col * (colWidth + gap)
      const y = cy + colHeights[col]
      colHeights[col] += displayH + gap

      return {
        id: crypto.randomUUID(),
        src: dataUrl,
        x, y,
        width: displayW,
        height: displayH,
      }
    })

    const newIds = new Set(newImages.map(img => img.id))
    setImages(prev => [...prev, ...newImages])
    setSelected(newIds)
    sRef.current = newIds
  }, [])

  const addImageFromDataUrl = useCallback((dataUrl: string, cx: number, cy: number) => {
    const img = new Image()
    img.onload = () => {
      const id = crypto.randomUUID()
      setImages(prev => [...prev, {
        id,
        src: dataUrl,
        x: cx - img.naturalWidth / 2,
        y: cy - img.naturalHeight / 2,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }])
      const sel = new Set([id])
      setSelected(sel)
      sRef.current = sel
    }
    img.src = dataUrl
  }, [])

  /* ── Zoom ── */

  const zoomAt = useCallback((newScale: number, sx: number, sy: number) => {
    setTransform(prev => {
      const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale))
      const r = s / prev.scale
      return { x: sx - (sx - prev.x) * r, y: sy - (sy - prev.y) * r, scale: s }
    })
  }, [])

  const zoomCenter = useCallback((newScale: number) => {
    const r = containerRef.current?.getBoundingClientRect()
    if (!r) return
    zoomAt(newScale, r.left + r.width / 2, r.top + r.height / 2)
  }, [zoomAt])

  const fitBounds = useCallback((bounds: { x: number; y: number; w: number; h: number }) => {
    const r = containerRef.current?.getBoundingClientRect()
    if (!r || bounds.w === 0 || bounds.h === 0) return
    const pad = 60
    const s = Math.min(Math.max(Math.min((r.width - pad * 2) / bounds.w, (r.height - pad * 2) / bounds.h), MIN_SCALE), MAX_SCALE)
    setTransform({
      x: r.width / 2 - (bounds.x + bounds.w / 2) * s,
      y: r.height / 2 - (bounds.y + bounds.h / 2) * s,
      scale: s,
    })
  }, [])

  /* ── Wheel zoom ── */

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const t = tRef.current
      const sensitivity = e.ctrlKey ? 0.01 : 0.002
      const delta = -e.deltaY * sensitivity
      const ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * (1 + delta)))
      const r = ns / t.scale
      const nt = { x: e.clientX - (e.clientX - t.x) * r, y: e.clientY - (e.clientY - t.y) * r, scale: ns }
      tRef.current = nt
      setTransform(nt)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  /* ── Space key for pan mode ── */

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        spaceRef.current = true
        setSpaceHeld(true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceRef.current = false
        setSpaceHeld(false)
      }
    }
    document.addEventListener('keydown', down)
    document.addEventListener('keyup', up)
    return () => { document.removeEventListener('keydown', down); document.removeEventListener('keyup', up) }
  }, [])

  /* ── Paste ── */

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      let handled = false
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (!file) continue
          const c = getPasteTarget()
          addImagesFromFiles([file], c.x, c.y)
          handled = true
        }
      }
      if (!handled) {
        const text = e.clipboardData?.getData('text/plain')
        if (text?.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i)) {
          e.preventDefault()
          const c = getPasteTarget()
          fetch(text).then(r => r.blob()).then(blob => fileToDataUrl(blob)).then(dataUrl => {
            addImageFromDataUrl(dataUrl, c.x, c.y)
          }).catch(() => {
            addImageFromDataUrl(text, c.x, c.y)
          })
        }
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [addImagesFromFiles, addImageFromDataUrl, getPasteTarget])

  /* ── Drop ── */

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const pos = screenToCanvas(e.clientX, e.clientY)

    if (e.dataTransfer.files.length > 0) {
      addImagesFromFiles(e.dataTransfer.files, pos.x, pos.y)
      return
    }

    const html = e.dataTransfer.getData('text/html')
    if (html) {
      const match = html.match(/<img[^>]+src="([^"]+)"/)
      if (match?.[1]) {
        fetch(match[1]).then(r => r.blob()).then(blob => fileToDataUrl(blob)).then(dataUrl => {
          addImageFromDataUrl(dataUrl, pos.x, pos.y)
        }).catch(() => addImageFromDataUrl(match[1], pos.x, pos.y))
        return
      }
    }

    const text = e.dataTransfer.getData('text/plain')
    if (text?.startsWith('http')) {
      fetch(text).then(r => r.blob()).then(blob => fileToDataUrl(blob)).then(dataUrl => {
        addImageFromDataUrl(dataUrl, pos.x, pos.y)
      }).catch(() => addImageFromDataUrl(text, pos.x, pos.y))
    }
  }, [screenToCanvas, addImagesFromFiles, addImageFromDataUrl])

  /* ── Pointer events ── */

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest(`.${styles.toolbar}`)) return
    const target = (e.target as HTMLElement).closest('[data-image-id]')
    const imageId = target?.getAttribute('data-image-id')

    if (imageId && !spaceRef.current) {
      if (e.shiftKey) {
        setSelected(prev => {
          const next = new Set(prev)
          next.has(imageId) ? next.delete(imageId) : next.add(imageId)
          sRef.current = next
          return next
        })
      } else if (!sRef.current.has(imageId)) {
        const next = new Set([imageId])
        setSelected(next)
        sRef.current = next
      }
      dragRef.current = { mode: 'move', sx: e.clientX, sy: e.clientY, moved: false }
    } else if (spaceRef.current) {
      dragRef.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, moved: false }
    } else {
      dragRef.current = { mode: 'marquee', sx: e.clientX, sy: e.clientY, moved: false }
    }

    containerRef.current?.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d.mode) return
    if (!d.moved && Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 3) d.moved = true
    if (!d.moved) return

    if (d.mode === 'pan') {
      const t = tRef.current
      const nt = { x: t.x + e.clientX - d.sx, y: t.y + e.clientY - d.sy, scale: t.scale }
      tRef.current = nt
      setTransform(nt)
      d.sx = e.clientX
      d.sy = e.clientY
    } else if (d.mode === 'move') {
      const t = tRef.current
      const dx = (e.clientX - d.sx) / t.scale
      const dy = (e.clientY - d.sy) / t.scale
      setImages(prev => prev.map(img => sRef.current.has(img.id) ? { ...img, x: img.x + dx, y: img.y + dy } : img))
      d.sx = e.clientX
      d.sy = e.clientY
    } else if (d.mode === 'marquee') {
      setMarquee({ x1: d.sx, y1: d.sy, x2: e.clientX, y2: e.clientY })
    }
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    if (d.mode === 'marquee' && d.moved) {
      const c1 = screenToCanvas(d.sx, d.sy)
      const c2 = screenToCanvas(e.clientX, e.clientY)
      const left = Math.min(c1.x, c2.x), top = Math.min(c1.y, c2.y)
      const right = Math.max(c1.x, c2.x), bottom = Math.max(c1.y, c2.y)
      const hit = new Set<string>()
      for (const img of iRef.current) {
        if (img.x + img.width >= left && img.x <= right && img.y + img.height >= top && img.y <= bottom) {
          hit.add(img.id)
        }
      }
      if (e.shiftKey) {
        setSelected(prev => { const m = new Set(prev); hit.forEach(id => m.add(id)); sRef.current = m; return m })
      } else {
        setSelected(hit)
        sRef.current = hit
      }
      setMarquee(null)
    } else if (d.mode === 'marquee' && !d.moved) {
      pasteTargetRef.current = screenToCanvas(e.clientX, e.clientY)
      setSelected(new Set())
      sRef.current = new Set()
      setMarquee(null)
    }
    dragRef.current = { mode: null, sx: 0, sy: 0, moved: false }
  }, [screenToCanvas])

  /* ── Hotkeys ── */

  useEffect(() => {
    hotkeys.filter = () => true

    hotkeys('command+=,command+plus', e => { e.preventDefault(); zoomCenter(tRef.current.scale * 1.25) })
    hotkeys('command+-', e => { e.preventDefault(); zoomCenter(tRef.current.scale / 1.25) })

    hotkeys('command+0', e => {
      e.preventDefault()
      const sel = sRef.current, imgs = iRef.current
      const targets = sel.size > 0 ? imgs.filter(i => sel.has(i.id)) : imgs
      if (targets.length === 0) return
      // Fit selection to 75% of viewport (comfortable focus, not edge-to-edge)
      const b = getBounds(targets)
      const r = containerRef.current?.getBoundingClientRect()
      if (!r) return
      const fill = 0.75
      const s = Math.min(Math.max(Math.min((r.width * fill) / b.w, (r.height * fill) / b.h), MIN_SCALE), MAX_SCALE)
      setTransform({
        x: r.width / 2 - (b.x + b.w / 2) * s,
        y: r.height / 2 - (b.y + b.h / 2) * s,
        scale: s,
      })
    })

    hotkeys('command+shift+0', e => {
      e.preventDefault()
      if (iRef.current.length === 0) return
      fitBounds(getBounds(iRef.current))
    })

    hotkeys('backspace,delete', e => {
      e.preventDefault()
      if (sRef.current.size === 0) return
      const sel = sRef.current
      setImages(prev => prev.filter(img => !sel.has(img.id)))
      setSelected(new Set())
      sRef.current = new Set()
    })

    hotkeys('command+a', e => {
      e.preventDefault()
      const all = new Set(iRef.current.map(i => i.id))
      setSelected(all)
      sRef.current = all
    })

    hotkeys('escape', () => { setSelected(new Set()); sRef.current = new Set() })

    return () => {
      hotkeys.unbind('command+=,command+plus')
      hotkeys.unbind('command+-')
      hotkeys.unbind('command+0')
      hotkeys.unbind('command+shift+0')
      hotkeys.unbind('backspace,delete')
      hotkeys.unbind('command+a')
      hotkeys.unbind('escape')
    }
  }, [zoomCenter, fitBounds])

  /* ── File input ── */

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const c = getPasteTarget()
    addImagesFromFiles(e.target.files, c.x, c.y)
    e.target.value = ''
  }, [addImagesFromFiles, getPasteTarget])

  /* ── Render ── */

  const zoomPct = Math.round(transform.scale * 100)
  const rootClass = [styles.canvas, spaceHeld && styles.panMode, className].filter(Boolean).join(' ')
  const isMultiSelect = selected.size > 1

  // Group bounding box for multi-select
  const groupBounds = isMultiSelect
    ? getBounds(images.filter(img => selected.has(img.id)))
    : null

  return (
    <div
      ref={containerRef}
      className={rootClass}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDragOver={onDragOver}
      onDrop={onDrop}
      tabIndex={0}
    >
      <div
        className={styles.inner}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {images.map(img => (
          <div
            key={img.id}
            data-image-id={img.id}
            className={`${styles.image}${selected.has(img.id) && !isMultiSelect ? ` ${styles.selected}` : ''}`}
            style={{ left: img.x, top: img.y, width: img.width, height: img.height }}
          >
            <img src={img.src} alt="" draggable={false} />
          </div>
        ))}

        {groupBounds && (
          <div
            className={styles.groupBounds}
            style={{
              left: groupBounds.x - 6,
              top: groupBounds.y - 6,
              width: groupBounds.w + 12,
              height: groupBounds.h + 12,
            }}
          />
        )}
      </div>

      {marquee && (
        <div
          className={styles.marquee}
          style={{
            left: Math.min(marquee.x1, marquee.x2),
            top: Math.min(marquee.y1, marquee.y2),
            width: Math.abs(marquee.x2 - marquee.x1),
            height: Math.abs(marquee.y2 - marquee.y1),
          }}
        />
      )}

      {images.length === 0 && (
        <div className={styles.empty}>
          <p>Drop images here, paste from clipboard, or use the + button</p>
          <p className={styles.emptyHint}>
            Click to set paste target &middot; Scroll to zoom &middot; Space+drag to pan
          </p>
        </div>
      )}

      <div className={styles.toolbar}>
        <button onClick={() => fileInputRef.current?.click()} title="Select image files">
          + Images
        </button>
        <span className={styles.zoom}>{zoomPct}%</span>
      </div>

      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={onFileChange} hidden />
    </div>
  )
}
