'use client'

// The signature interaction: the target dossier. Mounts (keyed per target,
// so re-clicks restart cleanly) when a roster mugshot is engaged. Brackets
// draw, the portrait re-renders itself as scanline raster behind a beam,
// fields decode in staggered, the threat bar fills — all phased off the one
// engagedAt timestamp shared with the map ping and globe rotation.

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { DecodeText } from '@/app/components/DecodeText'
import { useHud } from '../lib/context'
import { CIN } from '../lib/hud'
import { ScanPortrait } from './ScanPortrait'
import { makeDossier } from '../data/dossier'
import { TARGETS } from '../data/targets'

// When the portrait's scanline sweep finishes (ScanPortrait: 380ms lead-in
// + 1500ms sweep). The card's fields keep churning until then.
const SCAN_DONE = 1900

export function DossierPanel() {
  const { hud, scheduler } = useHud()
  const [activeId, setActiveId] = useState<string | null>(null)
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(
    () => hud.subscribe(() => setActiveId(hud.getSnapshot().activeTargetId)),
    [hud],
  )

  // Toggle the fade-out class from the shared clock (no setTimeout drift
  // against the virtual clock).
  useEffect(() => {
    if (!activeId) return
    return scheduler.add(clock => {
      const e = hud.frame.engagement
      const el = rootRef.current
      if (!e || !el) return
      el.classList.toggle('is-releasing', clock.t - e.engagedAt > CIN.RELEASE)
    })
  }, [activeId, scheduler, hud])

  // Click outside the card (or Escape) dismisses early — jump to RELEASE so
  // dossier, map crosshair, and globe fade together. Roster clicks are
  // exempt: they re-engage / switch targets.
  useEffect(() => {
    if (!activeId) return
    const dismiss = () => hud.releaseNow(scheduler.now())
    const onDown = (e: PointerEvent) => {
      const el = rootRef.current
      const target = e.target as Element | null
      if (!el || !target) return
      if (el.contains(target) || target.closest('.wr-mug')) return
      dismiss()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [activeId, hud, scheduler])

  const target = TARGETS.find(t => t.id === activeId)
  if (!target) return null
  const dossier = makeDossier(target)

  return (
    <aside
      key={target.id}
      ref={rootRef}
      className="wr-dossier"
      aria-label={`Dossier: ${target.codename}`}
    >
      <header className="wr-dossier-head">
        <DecodeText text={`TGT ${target.id} // ${target.codename}`} delay={100} speed={24} />
      </header>
      <ScanPortrait target={target} dossier={dossier} />
      <dl className="wr-dossier-fields">
        {dossier.fields.map((f, i) => (
          <div className="wr-dossier-row" key={f.k}>
            <dt>{f.k}</dt>
            <dd>
              {/* churn as scrambled ASCII until the portrait scan completes
                  (380ms lead-in + 1500ms sweep), then resolve sequentially */}
              <DecodeText text={f.v} delay={SCAN_DONE + i * 150} speed={22} />
            </dd>
          </div>
        ))}
      </dl>
      <div className="wr-threat">
        <span className="wr-threat-label">THREAT INDEX</span>
        <span
          className={`wr-threat-bar${dossier.threat > 85 ? ' is-critical' : ''}`}
          style={{ '--threat': dossier.threat / 100 } as CSSProperties}
        >
          <i />
        </span>
        <b>{dossier.threat}</b>
      </div>
      <footer className="wr-dossier-ref">{dossier.ref}</footer>
    </aside>
  )
}
