'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNewsEdit } from './NewsEditContext'
import { parseFeed, type FeedEntry } from '@/lib/news/parseFeed'
import styles from '../news.module.css'

function buildPrompt(ids: string[], titles: Map<string, string>): string {
  if (ids.length === 0) return ''
  const lines = ids.map((id, i) => `${i + 1}. "${titles.get(id) || 'Untitled'}" (${id})`).join('\n')
  const noun = ids.length === 1 ? 'entry' : 'entries'
  return [
    `Remove the following ${ids.length} ${noun} from the AI news page (\`news/feed.md\`):`,
    '',
    lines,
    '',
    'For each: delete its full entry block (the bold title line, the description line, and the thumbnail line). If a `## <date>` divider is left with no entries beneath it, remove the divider too. Leave everything else unchanged.',
  ].join('\n')
}

function Entry({
  entry,
  editing,
  marked,
  onToggle,
}: {
  entry: FeedEntry
  editing: boolean
  marked: boolean
  onToggle: (id: string) => void
}) {
  return (
    <article className={`${styles.entry} ${marked ? styles.entryMarked : ''}`}>
      <div className={styles.entryLeft}>
        <a className={styles.thumb} href={entry.watchUrl} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={entry.thumbUrl} alt="" loading="lazy" />
        </a>
        <div className={styles.thumbMeta}>
          <span className={styles.metaDate}>{entry.published}</span>
          {entry.durationMin != null && (
            <a className={styles.metaDur} href={entry.watchUrl} target="_blank" rel="noopener noreferrer">
              {entry.durationMin} min
            </a>
          )}
        </div>
      </div>

      <div className={styles.entryBody}>
        <h3 className={styles.entryTitle}>{entry.title}</h3>
        <div className={styles.entryChannel}>{entry.channel}</div>
        {entry.description && <p className={styles.entryDesc}>{entry.description}</p>}
      </div>

      {editing && (
        <button
          type="button"
          className={styles.removeBtn}
          aria-pressed={marked}
          aria-label={marked ? `Undo remove ${entry.title}` : `Remove ${entry.title} from the feed`}
          onClick={() => onToggle(entry.id)}
        >
          {marked ? 'Marked for removal' : 'Remove'}
        </button>
      )}
    </article>
  )
}

export default function NewsFeedView({ content }: { content: string }) {
  const sections = useMemo(() => parseFeed(content), [content])
  const { editing } = useNewsEdit()

  const titles = useMemo(() => {
    const m = new Map<string, string>()
    sections.forEach((s) => s.entries.forEach((e) => m.set(e.id, e.title)))
    return m
  }, [sections])

  // Marked-for-removal ids, kept in click order so the copied prompt is stable.
  const [marked, setMarked] = useState<string[]>([])
  const [toastMsg, setToastMsg] = useState('')
  const [toastNonce, setToastNonce] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)

  const toggle = useCallback(
    (id: string) => {
      setMarked((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        navigator.clipboard?.writeText(buildPrompt(next, titles)).catch(() => {})
        setToastMsg(next.length === 0 ? 'Selection cleared' : 'Remove prompt copied')
        setToastNonce((n) => n + 1)
        return next
      })
    },
    [titles],
  )

  useEffect(() => {
    if (toastNonce === 0) return
    setToastVisible(true)
    const t = setTimeout(() => setToastVisible(false), 1600)
    return () => clearTimeout(t)
  }, [toastNonce])

  const markedSet = useMemo(() => new Set(marked), [marked])

  return (
    <div className={`${styles.editable} ${editing ? styles.editing : ''}`}>
      {sections.map((section, si) => (
        <section key={si} className={styles.section}>
          {section.date && <h2 className={styles.dateDivider}>{section.date}</h2>}
          {section.entries.map((entry) => (
            <Entry
              key={entry.id}
              entry={entry}
              editing={editing}
              marked={markedSet.has(entry.id)}
              onToggle={toggle}
            />
          ))}
        </section>
      ))}

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
