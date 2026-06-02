'use client'

import { useState } from 'react'
import { useIsLocal } from '@/app/(news)/_components/NewsEditContext'
import { tweetIntentUrl } from '@/lib/x/intent'
import { X_CHAR_LIMIT, type XQueueItem, type XPostedItem } from '@/lib/x/types'
import styles from './x.module.css'

interface Snapshot {
  queue: XQueueItem[]
  posted: XPostedItem[]
  postsPerDay: number
  postedToday: number
}

interface Props {
  initialQueue: XQueueItem[]
  initialPosted: XPostedItem[]
  initialPostsPerDay: number
  initialPostedToday: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Deterministic (no Date/locale) so SSR and client markup match — see the
// hydration-badge lesson.
function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}` : ''
}

export default function XAdmin({
  initialQueue,
  initialPosted,
  initialPostsPerDay,
  initialPostedToday,
}: Props) {
  const isLocal = useIsLocal()
  const [snap, setSnap] = useState<Snapshot>({
    queue: initialQueue,
    posted: initialPosted,
    postsPerDay: initialPostsPerDay,
    postedToday: initialPostedToday,
  })
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [gearOpen, setGearOpen] = useState(false)
  const [draft, setDraft] = useState('')

  async function act(payload: Record<string, unknown>) {
    setBusy(true)
    try {
      const res = await fetch('/api/x/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = (await res.json()) as {
          state: { postsPerDay: number }
          queue: XQueueItem[]
          posted: XPostedItem[]
          postedToday: number
        }
        setSnap({
          queue: data.queue,
          posted: data.posted,
          postsPerDay: data.state.postsPerDay,
          postedToday: data.postedToday,
        })
      }
    } finally {
      setBusy(false)
    }
  }

  async function addNote() {
    const content = draft.trim()
    if (!content || busy) return
    await act({ action: 'createNote', content })
    setDraft('')
  }

  function doPost(item: XQueueItem) {
    window.open(tweetIntentUrl(item.content), '_blank', 'noopener,noreferrer')
    act({ action: 'markPosted', noteId: item.id })
    setConfirmId(null)
  }

  function onPostClick(item: XQueueItem) {
    const limited = snap.postsPerDay > 0 && snap.postedToday >= snap.postsPerDay
    if (limited) setConfirmId(item.id)
    else doPost(item)
  }

  const draftChars = [...draft.trim()].length
  const confirmItem = snap.queue.find((i) => i.id === confirmId) ?? null

  if (!isLocal) {
    return (
      <main className={styles.wrap}>
        <p className={styles.localOnly}>
          This is a local-only tool. Run the site on localhost to manage your X queue.
        </p>
      </main>
    )
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>X Broadcast</h1>
          <p className={styles.sub}>
            {snap.postedToday} {snap.postedToday === 1 ? 'post' : 'posts'} to X today
          </p>
        </div>
        <div className={styles.gearWrap}>
          <button
            className={styles.gearBtn}
            aria-label="Daily constraint"
            aria-expanded={gearOpen}
            onClick={() => setGearOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          {gearOpen && (
            <>
              <div className={styles.backdrop} onClick={() => setGearOpen(false)} />
              <div className={styles.popover}>
                <span className={styles.constraintLabel}>Daily constraint</span>
                <div className={styles.segmented}>
                  {[1, 3, 0].map((n) => (
                    <button
                      key={n}
                      className={snap.postsPerDay === n ? styles.segActive : styles.seg}
                      disabled={busy}
                      onClick={() => {
                        act({ action: 'setPostsPerDay', postsPerDay: n })
                        setGearOpen(false)
                      }}
                    >
                      {n === 0 ? 'No limit' : `${n}/day`}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <section className={styles.compose}>
        <textarea
          className={styles.composeInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              addNote()
            }
          }}
          placeholder="Capture a thought — it lands in the queue, ready to post."
          rows={3}
        />
        <div className={styles.composeFoot}>
          <span className={draftChars > X_CHAR_LIMIT ? styles.over : styles.chars}>
            {draftChars}/{X_CHAR_LIMIT}
          </span>
          <button
            className={styles.addBtn}
            disabled={busy || !draft.trim()}
            onClick={addNote}
          >
            Add note
          </button>
        </div>
      </section>

      <div className={styles.columns}>
      <section>
        <h2 className={styles.sectionTitle}>
          Queued <span className={styles.count}>{snap.queue.length}</span>
        </h2>
        {snap.queue.length === 0 ? (
          <p className={styles.empty}>Nothing queued. Every note you write lands here automatically.</p>
        ) : (
          <ul className={styles.list}>
            {snap.queue.map((item) => (
              <li key={item.id} className={styles.item}>
                <div className={styles.itemBody}>
                  <p className={styles.itemText}>{item.content}</p>
                  <div className={styles.meta}>
                    <span className={item.overLimit ? styles.over : styles.chars}>
                      {item.charCount}/{X_CHAR_LIMIT}
                      {item.overLimit ? ' — trim in composer' : ''}
                    </span>
                    <span className={styles.date}>{formatDate(item.date)}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button className={styles.postBtn} disabled={busy} onClick={() => onPostClick(item)}>
                    Post
                  </button>
                  <button
                    className={styles.removeBtn}
                    disabled={busy}
                    onClick={() => act({ action: 'remove', noteId: item.id })}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className={styles.sectionTitle}>
          Posted <span className={styles.count}>{snap.posted.length}</span>
        </h2>
        {snap.posted.length === 0 ? (
          <p className={styles.empty}>Nothing posted yet.</p>
        ) : (
          <ul className={styles.list}>
            {snap.posted.map((item) => (
              <li key={item.id} className={`${styles.item} ${styles.postedItem}`}>
                <div className={styles.itemBody}>
                  <p className={styles.itemText}>{item.content}</p>
                  <div className={styles.meta}>
                    <span className={styles.date}>posted {formatDate(item.at)}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.removeBtn}
                    disabled={busy}
                    onClick={() => act({ action: 'unpost', noteId: item.id })}
                  >
                    Undo
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>

      {confirmItem && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmId(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Already posted today</h3>
            <p className={styles.modalText}>
              You&rsquo;ve hit your daily constraint of {snap.postsPerDay}
              {snap.postsPerDay === 1 ? ' post' : ' posts'}. Post this anyway?
            </p>
            <p className={styles.modalNote}>{confirmItem.content}</p>
            <div className={styles.modalActions}>
              <button
                className={styles.removeBtn}
                disabled={busy}
                onClick={() => setConfirmId(null)}
              >
                Cancel
              </button>
              <button className={styles.postBtn} disabled={busy} onClick={() => doPost(confirmItem)}>
                Post anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
