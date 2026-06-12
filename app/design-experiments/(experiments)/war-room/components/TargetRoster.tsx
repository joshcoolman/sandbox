'use client'

// The roster as a cycling surveillance wall: five slots, each on its own
// randomized timer, hard-cutting (no scroll) to a target not currently on
// screen — like a system flipping through camera feeds. An engaged slot
// never swaps out from under its dossier. Clicking a slot engages whatever
// feed it's showing.

import { useEffect, useRef, useState } from 'react'
import { useHud } from '../lib/context'
import { mulberry32 } from '../lib/rng'
import { TARGETS, type Target } from '../data/targets'

const SLOTS = 5

export function TargetRoster() {
  const { hud, scheduler } = useHud()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [slots, setSlots] = useState<readonly Target[]>(() => TARGETS.slice(0, SLOTS))
  const feedRef = useRef({
    slots: TARGETS.slice(0, SLOTS) as Target[],
    nextSwapAt: new Array<number>(SLOTS).fill(0),
  })

  useEffect(
    () => hud.subscribe(() => setActiveId(hud.getSnapshot().activeTargetId)),
    [hud],
  )

  useEffect(() => {
    const rng = mulberry32(0xfeed5)
    return scheduler.add(clock => {
      const feed = feedRef.current
      const engaged = hud.getSnapshot().activeTargetId
      let changed = false
      for (let i = 0; i < SLOTS; i++) {
        if (feed.nextSwapAt[i] === 0) {
          feed.nextSwapAt[i] = clock.t + 1200 + rng() * 4500
          continue
        }
        if (clock.t < feed.nextSwapAt[i]) continue
        feed.nextSwapAt[i] = clock.t + 2600 + rng() * 5800
        if (feed.slots[i].id === engaged) continue // never swap the live dossier
        const onScreen = new Set(feed.slots.map(t => t.id))
        const candidates = TARGETS.filter(t => !onScreen.has(t.id))
        if (candidates.length === 0) continue
        feed.slots[i] = candidates[Math.floor(rng() * candidates.length)]
        changed = true
      }
      if (changed) setSlots([...feed.slots])
    })
  }, [scheduler, hud])

  return (
    <div className="wr-roster">
      {slots.map((t, i) => (
        <button
          key={i}
          type="button"
          className={`wr-mug${activeId === t.id ? ' is-active' : ''}`}
          onClick={() => hud.engage(t, scheduler.now())}
          aria-label={`Engage target ${t.codename}`}
          aria-pressed={activeId === t.id}
        >
          {/* keyed per feed so each hard cut restarts the static-flicker animation */}
          <span className="wr-mug-feed" key={t.id}>
            {/* eslint-disable-next-line @next/next/no-img-element -- CSS-filtered placeholder portraits */}
            <img src={t.image} alt="" />
            <span className="wr-mug-code">{t.codename}</span>
            <span className="wr-mug-id">{t.id}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
