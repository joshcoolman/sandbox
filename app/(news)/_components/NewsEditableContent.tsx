'use client'

import { useEffect, useRef, useState } from 'react'
import { useNewsEdit } from './NewsEditContext'
import styles from '../news.module.css'

const TRASH_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`

function extractId(s: string): string {
  const m = s.match(/(?:watch\?v=|\/vi\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : ''
}

interface Props {
  children: React.ReactNode
}

export default function NewsEditableContent({ children }: Props) {
  const { editing } = useNewsEdit()
  const ref = useRef<HTMLDivElement>(null)
  // id -> title, in click order; the source of truth for the prompt.
  const deleted = useRef<Map<string, string>>(new Map())
  const [toastMsg, setToastMsg] = useState('')
  const [toastNonce, setToastNonce] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)

  function buildPrompt(): string {
    const items = [...deleted.current.entries()]
    if (items.length === 0) return ''
    const lines = items.map(([id, title], i) => `${i + 1}. "${title}" (${id})`).join('\n')
    const noun = items.length === 1 ? 'entry' : 'entries'
    return [
      `Trim the AI news feed: delete the following ${items.length} video ${noun} and keep all the others.`,
      '',
      lines,
      '',
      'For each one:',
      '- In `news/feed.md`, remove its full block (the bold title/channel line, the description line, and the thumbnail line).',
      '- In `news/.ledger.json`, find the matching video id and set its `status` to "deleted" (keep the record — do not remove it).',
      '',
      'Leave the date dividers and everything else unchanged, even if a date ends up with fewer videos.',
    ].join('\n')
  }

  function fireToast(msg: string) {
    setToastMsg(msg)
    setToastNonce((n) => n + 1)
  }

  function toggle(p: HTMLElement) {
    const id = p.dataset.videoId
    if (!id) return
    const title = p.dataset.title || 'Untitled'
    if (p.dataset.deleted === 'true') {
      p.dataset.deleted = 'false'
      deleted.current.delete(id)
    } else {
      p.dataset.deleted = 'true'
      deleted.current.set(id, title)
    }
    const prompt = buildPrompt()
    navigator.clipboard?.writeText(prompt).catch(() => {})
    fireToast(deleted.current.size === 0 ? 'Edit cleared' : 'Edit recorded')
  }

  // Enhance the static markdown once after mount: tag each video entry with its
  // id/title and inject a trash toggle. Buttons stay hidden until edit mode is on.
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const entries = root.querySelectorAll<HTMLElement>('p')
    entries.forEach((p) => {
      const img = p.querySelector('img')
      if (!img) return
      const anchor = p.querySelector<HTMLAnchorElement>('a')
      const id = extractId(anchor?.getAttribute('href') || img.getAttribute('src') || '')
      if (!id) return
      p.dataset.videoId = id
      p.dataset.title = p.querySelector('strong')?.textContent?.trim() || 'Untitled'
      if (p.querySelector(`.${styles.trashBtn}`)) return
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = styles.trashBtn
      btn.setAttribute('aria-label', 'Toggle delete this video')
      btn.innerHTML = TRASH_SVG
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(p)
      })
      p.appendChild(btn)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (toastNonce === 0) return
    setToastVisible(true)
    const t = setTimeout(() => setToastVisible(false), 1600)
    return () => clearTimeout(t)
  }, [toastNonce])

  return (
    <div ref={ref} className={`${styles.editable} ${editing ? styles.editing : ''}`}>
      {children}
      <div
        className={`${styles.toast} ${toastVisible ? styles.toastVisible : ''}`}
        role="status"
        aria-live="polite"
      >
        <span className={styles.toastDot} />
        {toastMsg}
      </div>
    </div>
  )
}
