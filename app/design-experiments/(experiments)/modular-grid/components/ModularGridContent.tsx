'use client'

import { useState, useEffect } from 'react'
import {
  GridProvider,
  useGrid,
  Section,
  Grid,
  Span,
  Divider,
  ThinDivider,
  Spacer,
  SectionLabel,
  GridOverlay,
  COLORS as C,
  FONT,
  TYPE,
  UNIT,
  u,
} from './ModularGrid'
import styles from '../page.module.css'

function ModularGridDemo() {
  const grid = useGrid()
  const [totalHeight, setTotalHeight] = useState(4000)

  useEffect(() => {
    const measure = () => {
      const el = document.getElementById('grid-page')
      if (el) setTotalHeight(el.offsetHeight)
    }
    requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const rows = Math.ceil(totalHeight / UNIT)
  const col = (span: number) => Math.min(span, grid.columns)

  return (
    <div
      className={styles.page}
      style={{ fontFamily: FONT.body, color: C.text }}
    >
      <div id="grid-page" style={{ position: 'relative', overflow: 'hidden' }}>
        <GridOverlay visible={true} rows={rows} />

        {/* HEADER */}
        <Section style={{ paddingTop: u(6) }}>
          <Grid>
            <Span n={4}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ ...TYPE.label, fontFamily: FONT.body, color: C.textMuted }}>
                  Digital Presentation Grid System
                </span>
                <span style={{ ...TYPE.caption, fontFamily: FONT.body, color: C.textMuted }}>
                  Format 16:9 &mdash; Four Column Modular
                </span>
              </div>
            </Span>
            <Divider style={{ marginTop: u(1.5), marginBottom: u(0) }} />
          </Grid>
        </Section>

        {/* TITLE BLOCK */}
        <Section style={{ paddingTop: u(6) }}>
          <Grid>
            <Span n={2}>
              <h1 style={{ ...TYPE.h1, fontFamily: FONT.display, margin: 0, paddingBottom: u(3) }}>
                Modular Grid
                <br />
                System for
                <br />
                Digital Surfaces
              </h1>
            </Span>
            <Span n={1}>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textSecondary }}>
                A systematic approach to vertical rhythm and horizontal alignment, translating
                the precision of Swiss print design into responsive web layouts. Every measurement
                derives from a single base unit.
              </p>
            </Span>
            <Span n={1}>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textSecondary }}>
                The grid enforces consistency across content sections through fixed row heights,
                proportional margins, and typographic snap points. Content flows within the
                structure without breaking it.
              </p>
            </Span>
          </Grid>
        </Section>

        {/* DIVIDER */}
        <Section style={{ paddingTop: u(6) }}>
          <Grid><Divider /></Grid>
        </Section>

        {/* 01 -- Vertical Rhythm */}
        <Section style={{ paddingTop: u(3) }}>
          <Grid>
            <SectionLabel>
              <p style={{ ...TYPE.label, fontFamily: FONT.body, color: C.textMuted, margin: 0, marginBottom: u(2) }}>
                01 &mdash; Vertical Rhythm
              </p>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textSecondary }}>
                Every element&apos;s total vertical footprint -- content height plus padding, margin, and border --
                must resolve to a multiple of the base unit.
                This discipline creates the invisible horizontal lines
                that give the layout its cohesion.
              </p>
            </SectionLabel>
            <div style={{ gridColumn: `span ${col(2)}` }}>
              <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                <img
                  src="/design-experiments/modular-grid/astronaut-helmet-red-glow.jpg"
                  alt="Astronaut helmet with red glow"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <p style={{ ...TYPE.caption, fontFamily: FONT.body, color: C.textMuted, marginTop: u(1), marginBottom: 0 }}>
                Fig. 1 -- Baseline grid overlay showing 8px increments across the full page height
              </p>
            </div>
            <Span n={grid.columns === 2 ? 2 : 1} style={{ marginTop: grid.columns === 2 ? u(3) : 0 }}>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textSecondary }}>
                Line-heights snap to the grid, not font sizes. A 13px body font at 20px line-height
                occupies 2.5 units. Headings at 38px use a 40px line-height -- exactly 5 units. The spacing
                between heading and body resolves the remaining offset.
              </p>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, marginTop: u(2.5), color: C.textSecondary }}>
                This is where most web implementations fail. They pick a type scale and let line-heights
                fall where they may. In print, this would be unacceptable.
              </p>
            </Span>
          </Grid>
        </Section>

        {/* DIVIDER */}
        <Section style={{ paddingTop: u(6) }}>
          <Grid><ThinDivider /></Grid>
        </Section>

        {/* 02 -- Column Structure */}
        <Section style={{ paddingTop: u(3) }}>
          <Grid>
            <SectionLabel>
              <p style={{ ...TYPE.label, fontFamily: FONT.body, color: C.textMuted, margin: 0, marginBottom: u(2) }}>
                02 &mdash; Column Structure
              </p>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textSecondary }}>
                Four columns with proportional gutters and generous outer margins create a flexible
                framework for placing content at different densities across the page.
              </p>
            </SectionLabel>
            <Span n={1}>
              <h2 style={{ ...TYPE.h2, fontFamily: FONT.display, margin: 0, marginBottom: u(2) }}>
                Outer margins are wider
                than column gutters
              </h2>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textSecondary }}>
                The page margin at 64px is roughly 2.7x the 24px column gutter. This creates a visual
                frame around the content area and prevents the grid from feeling like it runs edge-to-edge.
                Print designers call this &quot;generous margins&quot; -- the white space around the content is as
                important as the content itself.
              </p>
            </Span>
            <Span n={1}>
              <h2 style={{ ...TYPE.h2, fontFamily: FONT.display, margin: 0, marginBottom: u(2) }}>
                Gutters create the
                vertical channels
              </h2>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textSecondary }}>
                The 24px gutter between columns provides enough separation that adjacent text blocks
                don&apos;t bleed into each other visually, but narrow enough to maintain the feeling
                of a unified grid rather than isolated panels. The gutter width is 3 base units -- a
                deliberate, proportional choice.
              </p>
            </Span>
            <Span n={1} style={{ marginTop: grid.columns === 2 ? u(3) : 0 }}>
              <h2 style={{ ...TYPE.h2, fontFamily: FONT.display, margin: 0, marginBottom: u(2) }}>
                Content spans respond
                to information density
              </h2>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textSecondary }}>
                Headlines span 2 columns when they need room. Body text stays in single columns for
                comfortable line lengths. Images span 2-3 columns for impact. The grid enables
                these decisions without breaking rhythm.
              </p>
            </Span>
          </Grid>
        </Section>

        {/* DIVIDER */}
        <Section style={{ paddingTop: u(6) }}>
          <Grid><Divider /></Grid>
        </Section>

        {/* 03 -- Image Treatment */}
        <Section style={{ paddingTop: u(3) }}>
          <Grid>
            <SectionLabel>
              <p style={{ ...TYPE.label, fontFamily: FONT.body, color: C.textMuted, margin: 0, marginBottom: u(2) }}>
                03 &mdash; Image Treatment
              </p>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textSecondary }}>
                Images conform to the column grid horizontally and snap to the baseline grid vertically.
                Captions use the smallest type size in the system and align to the same baseline.
              </p>
            </SectionLabel>
            <div style={{ gridColumn: `span ${col(1)}` }}>
              <div style={{ width: '100%', ...(grid.columns === 2 ? { aspectRatio: '16/9' } : { height: u(24) }), overflow: 'hidden' }}>
                <img src="/design-experiments/modular-grid/astronaut-face-light-streaks.jpg" alt="Astronaut face with prismatic light streaks" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <p style={{ ...TYPE.caption, fontFamily: FONT.body, color: C.textMuted, marginTop: u(1), marginBottom: 0 }}>
                Fig. 2 -- Single column, fixed height
              </p>
            </div>
            <div style={{ gridColumn: `span ${col(grid.columns === 2 ? 1 : 2)}` }}>
              <div style={{ width: '100%', ...(grid.columns === 2 ? { aspectRatio: '16/9' } : { height: u(24) }), overflow: 'hidden' }}>
                <img src="/design-experiments/modular-grid/blade-runner-eye-reflection.jpg" alt="Blade Runner eye with galaxy reflection" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <p style={{ ...TYPE.caption, fontFamily: FONT.body, color: C.textMuted, marginTop: u(1), marginBottom: 0 }}>
                Fig. 3 -- Two columns, same fixed height
              </p>
            </div>
          </Grid>
        </Section>

        <Section style={{ paddingTop: u(3) }}>
          <Grid>
            <Spacer span={1} units={0} />
            <div style={{ gridColumn: 'span 1' }}>
              <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden' }}>
                <img src="/design-experiments/modular-grid/blade-runner-woman-portrait.jpg" alt="Blade Runner woman portrait" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <p style={{ ...TYPE.caption, fontFamily: FONT.body, color: C.textMuted, marginTop: u(1), marginBottom: 0 }}>Fig. 4 -- Portrait</p>
            </div>
            <div style={{ gridColumn: 'span 1' }}>
              <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden' }}>
                <img src="/design-experiments/modular-grid/man-profile-colored-lighting.jpeg" alt="Man profile in colored lighting" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <p style={{ ...TYPE.caption, fontFamily: FONT.body, color: C.textMuted, marginTop: u(1), marginBottom: 0 }}>Fig. 5 -- Portrait</p>
            </div>
            {grid.columns > 2 && (
              <div style={{ gridColumn: 'span 1' }}>
                <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden' }}>
                  <img src="/design-experiments/modular-grid/woman-red-background-silhouette.jpeg" alt="Woman silhouette on red background" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <p style={{ ...TYPE.caption, fontFamily: FONT.body, color: C.textMuted, marginTop: u(1), marginBottom: 0 }}>Fig. 6 -- Portrait</p>
              </div>
            )}
          </Grid>
        </Section>

        {/* DIVIDER */}
        <Section style={{ paddingTop: u(6) }}>
          <Grid><Divider /></Grid>
        </Section>

        {/* FULL-WIDTH STATEMENT */}
        <Section style={{ paddingTop: u(6) }}>
          <Grid>
            <Span n={3}>
              <h1 style={{ ...TYPE.h1, fontFamily: FONT.display, margin: 0, fontSize: 38 }}>
                The grid is not a limitation.
                <br />
                It is the structure that makes
                <br />
                freedom possible.
              </h1>
            </Span>
            <Span n={1} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textSecondary }}>
                Every decision within the system -- type size, image placement, section height -- is
                made easier by the constraints the grid provides. Rhythm replaces randomness.
              </p>
            </Span>
          </Grid>
        </Section>

        {/* DIVIDER */}
        <Section style={{ paddingTop: u(6) }}>
          <Grid><ThinDivider /></Grid>
        </Section>

        {/* 04 -- System Config */}
        <Section style={{ paddingTop: u(3), paddingBottom: u(8) }}>
          <Grid>
            <SectionLabel>
              <p style={{ ...TYPE.label, fontFamily: FONT.body, color: C.textMuted, margin: 0, marginBottom: u(2) }}>
                04 &mdash; System Config
              </p>
              <p style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textSecondary }}>
                The complete specification table. Every value traces back to the 8px base unit
                through simple multiplication -- no magic numbers.
              </p>
            </SectionLabel>
            <Span n={3}>
              {[
                ['Base Unit', '8px', 'All measurements derive from this value'],
                ['Columns', '4', 'Consistent horizontal division'],
                ['Column Gutter', '24px', '3 base units between columns'],
                ['Outer Margin', '64px', '8 base units -- wider than gutters'],
                ['H1 Line Height', '40px', '5 base units'],
                ['H2 Line Height', '24px', '3 base units'],
                ['Body Line Height', '20px', '2.5 base units'],
                ['Caption Line Height', '16px', '2 base units'],
                ['Section Ratio', '16:9', 'Proportional content modules'],
              ].map(([prop, value, note], i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 80px 1fr',
                    gap: grid.columnGap,
                    paddingTop: u(1),
                    paddingBottom: u(1),
                    borderBottom: `1px solid ${C.dividerSubtle}`,
                  }}
                >
                  <span style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, fontWeight: 500 }}>{prop}</span>
                  <span style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                  <span style={{ ...TYPE.body, fontFamily: FONT.body, margin: 0, color: C.textMuted }}>{note}</span>
                </div>
              ))}
            </Span>
          </Grid>
        </Section>

        {/* FOOTER */}
        <Section style={{ paddingTop: u(3), paddingBottom: u(3), borderTop: `1px solid ${C.divider}` }}>
          <Grid>
            <Span n={1}>
              <p style={{ ...TYPE.caption, fontFamily: FONT.body, color: C.textMuted, margin: 0 }}>
                Modular Grid System v1.0
              </p>
            </Span>
            <Span n={1}>
              <p style={{ ...TYPE.caption, fontFamily: FONT.body, color: C.textMuted, margin: 0 }}>
                Base Unit: {UNIT}px
              </p>
            </Span>
            <Span n={1}>
              <p style={{ ...TYPE.caption, fontFamily: FONT.body, color: C.textMuted, margin: 0 }}>
                Columns: {grid.columns} &mdash; Gutter: {grid.columnGap}px
              </p>
            </Span>
            <Span n={1} style={{ textAlign: 'right' }}>
              <p style={{ ...TYPE.caption, fontFamily: FONT.body, color: C.textMuted, margin: 0 }}>
                Margin: {grid.outerMargin}px
              </p>
            </Span>
          </Grid>
        </Section>
      </div>
    </div>
  )
}

export function ModularGridContent() {
  return (
    <GridProvider>
      <ModularGridDemo />
    </GridProvider>
  )
}
