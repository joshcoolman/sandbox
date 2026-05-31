'use client'

import { useEffect, useRef, useState } from 'react'
import { useNewsEdit } from './NewsEditContext'
import styles from '../news.module.css'

const TRASH_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`
const BAN_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>`
const X_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`

// "**Title** — Channel (May 29)" → "Channel". The dash/date are stripped off the
// text node that follows the <strong> title.
function channelFrom(p: HTMLElement): string {
  const after = p.querySelector('strong')?.nextSibling?.textContent || ''
  return after
    .replace(/^\s*[—–-]\s*/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
}

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
  // id -> title, in click order; the source of truth for the delete prompt.
  const deleted = useRef<Map<string, string>>(new Map())
  // channel names to block from future runs, in click order.
  const blocked = useRef<Set<string>>(new Set())
  // videoId -> { entry title, resource URLs marked for targeted removal }.
  // Lets a single link be struck out without deleting the whole entry.
  const links = useRef<Map<string, { title: string; urls: Set<string> }>>(new Map())
  const [toastMsg, setToastMsg] = useState('')
  const [toastNonce, setToastNonce] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)

  // True when nothing is marked anywhere — used to label the toast.
  function isClear(): boolean {
    return deleted.current.size === 0 && blocked.current.size === 0 && links.current.size === 0
  }

  function buildPrompt(): string {
    const dels = [...deleted.current.entries()]
    const bans = [...blocked.current]
    const linkEntries = [...links.current.entries()]
    if (dels.length === 0 && bans.length === 0 && linkEntries.length === 0) return ''
    const sections: string[] = []

    if (dels.length > 0) {
      const lines = dels.map(([id, title], i) => `${i + 1}. "${title}" (${id})`).join('\n')
      const noun = dels.length === 1 ? 'entry' : 'entries'
      sections.push(
        [
          `Trim the AI news feed: delete the following ${dels.length} video ${noun} and keep all the others.`,
          '',
          lines,
          '',
          'For each one:',
          '- In `news/feed.md`, remove its full entry block (all of its lines, including the `Resources:` label and any URL lines).',
          '- In `news/.ledger.json`, find the matching video id and set its `status` to "deleted" (keep the record — do not remove it).',
          '',
          'Leave the date dividers and everything else unchanged, even if a date ends up with fewer videos.',
        ].join('\n'),
      )
    }

    if (bans.length > 0) {
      const lines = bans.map((c, i) => `${i + 1}. ${c}`).join('\n')
      const noun = bans.length === 1 ? 'channel' : 'channels'
      sections.push(
        [
          `Block the following ${bans.length} ${noun} from future AI news runs:`,
          '',
          lines,
          '',
          'For each one, add an entry to the `blockedChannels` array in `news/.ledger.json` with its `name` (add `channelId` only if you can readily determine it, else omit) and `since` set to today. Do NOT remove any current feed entries or change any video statuses — blocking only affects future runs.',
        ].join('\n'),
      )
    }

    if (linkEntries.length > 0) {
      const blocks = linkEntries
        .map(([id, { title, urls }]) => {
          const urlLines = [...urls].map((u) => `   - ${u}`).join('\n')
          return `"${title}" (${id})\n${urlLines}`
        })
        .join('\n\n')
      const urlCount = linkEntries.reduce((n, [, { urls }]) => n + urls.size, 0)
      const linkNoun = urlCount === 1 ? 'resource link' : 'resource links'
      const entryClause =
        linkEntries.length === 1
          ? 'this AI news entry, but keep the entry itself'
          : 'these AI news entries, but keep the entries themselves'
      sections.push(
        [
          `Remove the following ${linkNoun} from ${entryClause}:`,
          '',
          blocks,
          '',
          'For each link listed:',
          '- In `news/feed.md`, find the matching entry and delete only that URL line. If removing it leaves no resource links under that entry, also remove the now-empty `Resources:` label.',
          '- Do NOT remove the entry, its title, description, or thumbnail, and leave `news/.ledger.json` unchanged.',
        ].join('\n'),
      )
    }

    return sections.join('\n\n---\n\n')
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
    copyPrompt(isClear())
  }

  // Strike out a single resource link within an entry without deleting the
  // entry. Toggled state lives on the anchor via data-link-removed.
  function toggleLink(p: HTMLElement, a: HTMLAnchorElement, url: string) {
    const id = p.dataset.videoId
    if (!id) return
    const title = p.dataset.title || 'Untitled'
    if (a.dataset.linkRemoved === 'true') {
      a.dataset.linkRemoved = 'false'
      const rec = links.current.get(id)
      if (rec) {
        rec.urls.delete(url)
        if (rec.urls.size === 0) links.current.delete(id)
      }
    } else {
      a.dataset.linkRemoved = 'true'
      const rec = links.current.get(id) || { title, urls: new Set<string>() }
      rec.urls.add(url)
      links.current.set(id, rec)
    }
    copyPrompt(isClear())
  }

  // Block a channel from future runs. The entry is left untouched (future-only);
  // toggled state lives on the button via aria-pressed.
  function toggleBan(p: HTMLElement, btn: HTMLButtonElement) {
    const channel = p.dataset.channel
    if (!channel) return
    const on = btn.getAttribute('aria-pressed') === 'true'
    btn.setAttribute('aria-pressed', on ? 'false' : 'true')
    if (on) blocked.current.delete(channel)
    else blocked.current.add(channel)
    copyPrompt(isClear())
  }

  function copyPrompt(cleared: boolean) {
    const prompt = buildPrompt()
    navigator.clipboard?.writeText(prompt).catch(() => {})
    fireToast(cleared ? 'Edit cleared' : 'Edit recorded')
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
      // The thumbnail src is always the YouTube /vi/<id>/ image. Prefer it over
      // p.querySelector('a'), which now returns an auto-linked resource URL (the
      // bare URLs under "Resources:") rather than the thumbnail's watch link.
      const id =
        extractId(img.getAttribute('src') || '') ||
        extractId(img.closest('a')?.getAttribute('href') || '')
      if (!id) return
      p.dataset.videoId = id
      p.dataset.title = p.querySelector('strong')?.textContent?.trim() || 'Untitled'
      p.dataset.channel = channelFrom(p)
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

      const banBtn = document.createElement('button')
      banBtn.type = 'button'
      banBtn.className = styles.banBtn
      banBtn.setAttribute('aria-pressed', 'false')
      banBtn.setAttribute(
        'aria-label',
        p.dataset.channel ? `Block channel ${p.dataset.channel} from future runs` : 'Block this channel',
      )
      banBtn.innerHTML = BAN_SVG
      banBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleBan(p, banBtn)
      })
      p.appendChild(banBtn)

      // Inject an "x" after each resource link (anchors that aren't the
      // thumbnail) so a single link can be struck out and removed in isolation.
      p.querySelectorAll<HTMLAnchorElement>('a').forEach((a) => {
        if (a.querySelector('img')) return // skip the thumbnail's watch link
        const url = a.getAttribute('href') || ''
        if (!url) return
        if (a.nextElementSibling?.classList.contains(styles.linkBtn)) return
        const x = document.createElement('button')
        x.type = 'button'
        x.className = styles.linkBtn
        x.setAttribute('aria-label', `Remove link ${url}`)
        x.innerHTML = X_SVG
        x.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleLink(p, a, url)
        })
        a.insertAdjacentElement('afterend', x)
      })
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
