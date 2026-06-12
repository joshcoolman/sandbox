// One requestAnimationFrame loop drives every panel. Panels register draw
// callbacks; the scheduler hands them a shared virtual clock. The virtual
// clock PAUSES while the tab is hidden (epoch offset), so every scheduled
// event time (strike launchedAt, engagement engagedAt, channel nextAt) stays
// valid across tab switches — no event storm on return, no dt spikes.

export type Clock = { t: number; dt: number }
export type TickFn = (clock: Clock) => void

export type Scheduler = {
  /** Register a per-frame callback. Returns an unregister function. */
  add(fn: TickFn): () => void
  /** Current virtual time (ms). Safe to call from event handlers. */
  now(): number
  /** Wire up visibilitychange pause/resume. Returns a detach function. */
  attach(): () => void
}

export function createScheduler(): Scheduler {
  const fns = new Set<TickFn>()
  let rafId = 0
  let running = false
  let epoch = 0 // subtracted from performance.now() -> virtual time
  let last = 0 // last virtual t
  let hiddenAt = 0
  let hasTicked = false

  function frame(nowReal: number) {
    const t = nowReal - epoch
    const dt = hasTicked ? Math.min(t - last, 100) : 16.7
    hasTicked = true
    last = t
    const clock = { t, dt }
    for (const fn of fns) fn(clock)
    rafId = requestAnimationFrame(frame)
  }

  function start() {
    if (!running && fns.size > 0) {
      running = true
      rafId = requestAnimationFrame(frame)
    }
  }

  function stop() {
    running = false
    cancelAnimationFrame(rafId)
  }

  function onVisibility() {
    if (document.hidden) {
      hiddenAt = performance.now()
      stop()
    } else {
      epoch += performance.now() - hiddenAt // clock continuity across the gap
      start()
    }
  }

  return {
    add(fn) {
      fns.add(fn)
      start()
      return () => {
        fns.delete(fn)
        if (fns.size === 0) stop()
      }
    },
    now: () => last,
    attach() {
      document.addEventListener('visibilitychange', onVisibility)
      return () => {
        document.removeEventListener('visibilitychange', onVisibility)
        stop()
      }
    },
  }
}
