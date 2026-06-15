'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './styles.css'

// The poster is an N-content-column grid with a 1-column margin on each
// side. Responsiveness is a REFLOW, not a resize: the content area goes
// 6 → 3 columns at the breakpoint and the text re-places into fewer
// columns at a fixed size. Cells are kept square by measuring the width
// and setting every row's height to the column width.

type Place = [col: string, row: string]

interface Layout {
  cols: number
  colTemplate: string // grid-template-columns
  colUnits: number // total fr units across the template (for square-cell row height)
  rows: number
  crossCols: number[]
  crossRows: number[]
  crossJustify: 'start' | 'center' // start = on the content line; center = mid-column

  spec: Place
  headerBar: Place
  code1: Place
  statusL: Place
  statusR: Place
  hero: Place
  heroImg: Place
  heroYear: Place
  para: Place
  restricted: Place
  feed: Place
  r1: Place
  clearance: Place
  unit: Place
  footerBar: Place
  code2: Place
}

// 8 columns (1 margin + 6 content + 1 margin). The body paragraph claims
// `p` whole rows (measured + snapped); everything below shifts down by it.
function buildWide(p: number): Layout {
  // 2 bar · 3 status · 4 empty · 5–7 hero · 8 empty · 9.. para
  const paraStart = 9
  const feed = paraStart + p
  const spacer = feed + 1
  const footer = spacer + 1
  const rows = footer + 1 // + bottom-margin row
  return {
    cols: 8,
    colTemplate: 'repeat(8, 1fr)',
    colUnits: 8,
    rows,
    crossCols: [2, 5, 8],
    crossRows: [3, 4, paraStart, spacer],
    crossJustify: 'start',
    spec: ['1', '2'],
    headerBar: ['2 / 8', '2'],
    code1: ['8', '2'],
    statusL: ['2 / 5', '3'],
    statusR: ['5 / 8', '3'],
    hero: ['2 / 8', '5 / 8'],
    heroImg: ['2 / 8', '5 / 8'],
    heroYear: ['2 / 8', '5 / 8'], // unused in wide (no separate year line)
    para: ['2 / 5', `${paraStart} / ${paraStart + p}`],
    restricted: ['5 / 8', `${paraStart}`],
    feed: ['2 / 4', `${feed}`],
    r1: ['4', `${feed}`],
    clearance: ['6 / 8', `${feed}`],
    unit: ['1', `${footer}`],
    footerBar: ['2 / 8', `${footer}`],
    code2: ['8', `${footer}`],
  }
}

// 5 columns (1 margin + 3 content + 1 margin). Same sections, reflowed:
// nation wraps America to a second line, the splits stay side-by-side, the
// body's paragraph snaps to `p` whole rows with restricted stacked below.
function buildNarrow(p: number): Layout {
  // 2 bar · 3 status · 4 empty · 5 hero (1 row, tight) · 6 empty · 7.. para
  const paraStart = 7
  const restricted = paraStart + p
  const feed = restricted + 1
  const clearance = feed + 1
  const footer = clearance + 2 // empty row between clearance and footer
  const rows = footer + 1
  return {
    cols: 5,
    // half-width side margins; the 3 content columns expand toward the edge
    colTemplate: '0.5fr 1fr 1fr 1fr 0.5fr',
    colUnits: 4,
    rows,
    crossCols: [1, 5], // the half-margin columns
    crossRows: [3, 4, paraStart, footer - 1],
    crossJustify: 'center', // centered inside the half-margin columns
    spec: ['1', '2'],
    headerBar: ['2 / 5', '2'],
    code1: ['5', '2'],
    statusL: ['2 / 4', '3'],
    statusR: ['4 / 5', '3'],
    hero: ['2 / 5', '5 / 6'],
    heroImg: ['2 / 5', '4 / 7'], // 3 cols × 3 rows = square photo; brackets stay on the 1-row hero box
    heroYear: ['2 / 5', '6'], // 2025 on the row below the hero box, over the photo
    para: ['2 / 5', `${paraStart} / ${paraStart + p}`],
    restricted: ['2 / 5', `${restricted}`],
    feed: ['2 / 4', `${feed}`],
    r1: ['4', `${feed}`],
    clearance: ['2 / 4', `${clearance}`],
    unit: ['1', `${footer}`],
    footerBar: ['2 / 5', `${footer}`],
    code2: ['5', `${footer}`],
  }
}

const BREAKPOINT = 600

function place([col, row]: Place): CSSProperties {
  return { gridColumn: col, gridRow: row }
}

function gridLines(cols: number, rows: number) {
  const v: { key: string; style: CSSProperties }[] = [
    ...Array.from({ length: cols }, (_, i) => ({
      key: `v${i}`,
      style: { gridColumn: `${i + 1}`, gridRow: '1 / -1', justifySelf: 'start' } as CSSProperties,
    })),
    { key: 'v-end', style: { gridColumn: `${cols}`, gridRow: '1 / -1', justifySelf: 'end' } },
  ]
  const h: { key: string; style: CSSProperties }[] = [
    ...Array.from({ length: rows }, (_, j) => ({
      key: `h${j}`,
      style: { gridColumn: '1 / -1', gridRow: `${j + 1}`, alignSelf: 'start' } as CSSProperties,
    })),
    { key: 'h-end', style: { gridColumn: '1 / -1', gridRow: `${rows}`, alignSelf: 'end' } },
  ]
  return { v, h }
}

export function AdaptiveGrid() {
  const ref = useRef<HTMLDivElement>(null)
  const paraRef = useRef<HTMLParagraphElement>(null)
  const [width, setWidth] = useState(0)
  const [paraRows, setParaRows] = useState(2)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const narrow = width > 0 && width < BREAKPOINT
  const L = narrow ? buildNarrow(paraRows) : buildWide(paraRows)
  const cell = width > 0 ? width / L.colUnits : 0
  const { v, h } = gridLines(L.cols, L.rows)

  // Snap the body paragraph to a whole number of square cells: measure its
  // natural height, round up to the nearest cell, and the sections below
  // shift down by that — so it can never overlap the feed row.
  useEffect(() => {
    const el = paraRef.current
    if (!el || cell <= 0) return
    const needed = Math.max(1, Math.ceil(el.scrollHeight / cell))
    setParaRows((prev) => (prev === needed ? prev : needed))
  }, [width, narrow, cell])

  const sheetStyle: CSSProperties = {
    gridTemplateColumns: L.colTemplate,
    gridTemplateRows: `repeat(${L.rows}, ${cell || 1}px)`,
  }

  return (
    <div className="ag-stage">
      <div className="ag-poster" data-narrow={narrow} ref={ref}>
        <div className="ag-sheet" style={sheetStyle}>
          {/* Layer 01 — grid lines, rendered as grid tracks */}
          {v.map((l) => (
            <span key={l.key} className="ag-gridline ag-vline" style={l.style} aria-hidden />
          ))}
          {h.map((l) => (
            <span key={l.key} className="ag-gridline ag-hline" style={l.style} aria-hidden />
          ))}

          {/* ── Header bar ──────────────────────────── */}
          {!narrow && (
            <span className="ag-corner t" style={place(L.spec)}>SPEC</span>
          )}
          <div className="ag-bar block" style={place(L.headerBar)}>
            <span className="t">Adaptive systems for changing landscapes</span>
          </div>
          {!narrow && (
            <span className="ag-corner ag-corner--r t" style={place(L.code1)}>07.4</span>
          )}

          {/* ── Status row ──────────────────────────── */}
          <p className="ag-status t" style={place(L.statusL)}>
            June 12–14
            <br />
            Portland, Oregon
          </p>
          <p className="ag-status ag-status--r t" style={place(L.statusR)}>
            Registration
            <br />
            Now Open
          </p>

          {/* ── Hero ────────────────────────────────── */}
          <div className="ag-hero-img" style={place(L.heroImg)} aria-hidden />
          <div className="ag-brackets marks" style={place(L.hero)} aria-hidden>
            <i className="b tl" />
            <i className="b tr" />
            <i className="b bl" />
            <i className="b br" />
          </div>
          <h1 className="ag-hero t" style={place(L.hero)}>
            {narrow ? (
              <>
                <span>FIELD</span>
                <span>ECOLOGY</span>
              </>
            ) : (
              ['FLD', '20', 'ECO', '25'].map((w, i) => <span key={i}>{w}</span>)
            )}
          </h1>
          {narrow && (
            <span className="ag-hero-year t" style={place(L.heroYear)}>2025</span>
          )}

          {/* ── Body row ────────────────────────────── */}
          <p className="ag-para t" ref={paraRef} style={place(L.para)}>
            A three-day gathering of field researchers, restoration
            practitioners, and land stewards. Talks, workshops, and guided
            field sessions trace how living systems respond to a shifting
            climate — from soil and canopy to watershed and the movement of
            species — and the long, patient work of reading and restoring the
            land.
          </p>
          <p className="ag-restricted t" style={place(L.restricted)}>
            KEYNOTES
            <br />
            WORKSHOPS
            <br />
            FIELD SESSIONS
          </p>

          {/* ── Feed / clearance row ────────────────── */}
          <p className="ag-feed t" style={place(L.feed)}>
            Visit
            <br />
            fieldecology.org
          </p>
          <span className="ag-r1 t" style={place(L.r1)}>R1</span>
          <span className="ag-clearance block" style={place(L.clearance)}>
            <span className="t">Full Access</span>
          </span>

          {/* ── Footer bar ──────────────────────────── */}
          {!narrow && (
            <span className="ag-corner t" style={place(L.unit)}>UNIT</span>
          )}
          <div className="ag-bar block" style={place(L.footerBar)}>
            <span className="t">Built for the long work of reading the land</span>
          </div>
          {!narrow && (
            <span className="ag-corner ag-corner--r t" style={place(L.code2)}>AD–47</span>
          )}

          {/* Layer 02 — crosshair markings */}
          {L.crossRows.map((r) =>
            L.crossCols.map((c) => (
              <span
                key={`${c}-${r}`}
                className="ag-plus marks"
                style={{ gridColumn: `${c}`, gridRow: `${r}`, justifySelf: L.crossJustify }}
                aria-hidden
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
