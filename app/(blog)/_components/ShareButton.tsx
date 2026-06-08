'use client'

import { useState, useCallback } from 'react'
import { Share2, Check } from 'lucide-react'

export default function ShareButton({ title, text }: { title: string; text?: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, text: text || title, url })
      } catch {
        // User cancelled share sheet
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select from a temporary input
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [title, text])

  return (
    <button
      onClick={handleShare}
      aria-label={copied ? 'Link copied' : 'Share this post'}
      style={{
        all: 'unset',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        color: copied ? 'var(--accent)' : 'var(--text-faint)',
        fontSize: 13,
        lineHeight: 1,
        position: 'relative',
        top: 8,
        transition: 'color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!copied) e.currentTarget.style.color = 'var(--text-muted)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = copied ? 'var(--accent)' : 'var(--text-faint)'
      }}
    >
      {copied ? (
        <>
          <Check size={14} />
          <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11 }}>
            Copied
          </span>
        </>
      ) : (
        <Share2 size={14} />
      )}
    </button>
  )
}
