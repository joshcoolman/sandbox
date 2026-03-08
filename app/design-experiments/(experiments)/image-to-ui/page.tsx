'use client'

import { useState } from 'react'
import { DM_Sans, DM_Mono } from 'next/font/google'
import RotarySelector from './components/RotarySelector'
import DurationSlider from './components/DurationSlider'
import ListSelector from './components/ListSelector'
import ModelSelector, { type ModelSection } from './components/ModelSelector'
import './styles.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--ui-font',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--ui-font-mono',
})

const AspectIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3.5" width="10" height="7" rx="1.5" />
  </svg>
)

const QualityIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 1.5L9.5 6L7 10.5L4.5 6Z" />
    <path d="M4.5 6L2 8.5L7 12.5L12 8.5L9.5 6" />
  </svg>
)

const MODEL_SECTIONS: ModelSection[] = [
  {
    title: 'Featured models',
    icon: 'sparkles',
    items: [
      {
        id: 'kling-3',
        label: 'Kling 3.0',
        icon: 'video',
        tags: [
          { label: '1080p', icon: 'resolution' },
          { label: '3s-15s', icon: 'duration' },
        ],
      },
      {
        id: 'kling-2.6',
        label: 'Kling 2.6',
        icon: 'volume2',
        tags: [
          { label: '1080p', icon: 'resolution' },
          { label: '5s-10s', icon: 'duration' },
        ],
      },
      {
        id: 'kling-2.5-turbo',
        label: 'Kling 2.5 Turbo',
        icon: 'zap',
        tags: [
          { label: '1080p', icon: 'resolution' },
          { label: '5s-10s', icon: 'duration' },
        ],
      },
      {
        id: 'seedance-1.5',
        label: 'Seedance 1.5 Pro',
        icon: 'activity',
        tags: [
          { label: '720p', icon: 'resolution' },
          { label: '4s-12s', icon: 'duration' },
        ],
      },
      {
        id: 'grok-imagine',
        label: 'Grok Imagine',
        icon: 'pen',
        tags: [
          { label: '720p', icon: 'resolution' },
          { label: '1s-15s', icon: 'duration' },
        ],
      },
    ],
  },
  {
    title: 'All models',
    icon: 'layers',
    items: [
      {
        id: 'minimax-hailuo',
        label: 'Minimax Hailuo',
        icon: 'activity',
        description: 'High-dynamic, VFX-ready, fastest and most affordable',
        children: [
          {
            id: 'hailuo-2.3-fast',
            label: 'Minimax Hailuo 2.3 Fast',
            tags: [
              { label: '1080p', icon: 'resolution' },
              { label: '6s-10s', icon: 'duration' },
            ],
          },
          {
            id: 'hailuo-2.3',
            label: 'Minimax Hailuo 2.3',
            tags: [
              { label: '1080p', icon: 'resolution' },
              { label: '6s-10s', icon: 'duration' },
            ],
          },
          {
            id: 'hailuo-02-fast',
            label: 'Minimax Hailuo 02 Fast',
            tags: [
              { label: '512p', icon: 'resolution' },
              { label: '6s-10s', icon: 'duration' },
            ],
          },
          {
            id: 'hailuo-02',
            label: 'Minimax Hailuo 02',
            tags: [
              { label: '1080p', icon: 'resolution' },
              { label: '6s-10s', icon: 'duration' },
            ],
          },
        ],
      },
      {
        id: 'kling-family',
        label: 'Kling',
        icon: 'video',
        description: 'Perfect motion with advanced video control',
        children: [
          {
            id: 'kling-3-sub',
            label: 'Kling 3.0',
                tags: [
              { label: '1080p', icon: 'resolution' },
              { label: '3s-15s', icon: 'duration' },
            ],
          },
          {
            id: 'kling-2.6-sub',
            label: 'Kling 2.6',
            tags: [
              { label: '1080p', icon: 'resolution' },
              { label: '5s-10s', icon: 'duration' },
            ],
          },
          {
            id: 'kling-motion',
            label: 'Kling Motion Control',
            tags: [
              { label: '1080p', icon: 'resolution' },
              { label: '3s-30s', icon: 'duration' },
            ],
          },
        ],
      },
      {
        id: 'wan',
        label: 'Wan',
        icon: 'image',
        description: 'Open-source video generation',
        children: [
          {
            id: 'wan-2.1',
            label: 'Wan 2.1',
            tags: [
              { label: '720p', icon: 'resolution' },
              { label: '5s', icon: 'duration' },
            ],
          },
          {
            id: 'wan-2.1-fast',
            label: 'Wan 2.1 Fast',
            tags: [
              { label: '480p', icon: 'resolution' },
              { label: '5s', icon: 'duration' },
            ],
          },
        ],
      },
    ],
  },
]

export default function ImageToUI() {
  const [lastOutput, setLastOutput] = useState<{
    component: string
    value: string
  } | null>(null)

  return (
    <div className={`page ${dmSans.variable} ${dmMono.variable}`}>
        <div className="page-components">
          <RotarySelector
            items={['Voiceover', 'Change Voice', 'Translate']}
            defaultIndex={0}
            onChange={(_i, label) =>
              setLastOutput({ component: 'RotarySelector', value: label })
            }
          />

          <ModelSelector
            sections={MODEL_SECTIONS}
            defaultValue="kling-3"
            onChange={(m) =>
              setLastOutput({ component: 'ModelSelector', value: m.label })
            }
          />

          {/* Parameter toolbar -- three selectors grouped */}
          <div className="param-toolbar component-card" style={{ width: 286, justifyContent: 'center' }}>
            <DurationSlider
              values={[3, 6, 9, 12, 15]}
              defaultValue={6}
              unit="s"
              onChange={(v) =>
                setLastOutput({ component: 'DurationSlider', value: `${v}s` })
              }
            />

            <div className="param-divider" />

            <ListSelector
              options={['16:9', '9:16', '1:1']}
              defaultValue="16:9"
              icon={AspectIcon}
              onChange={(v) =>
                setLastOutput({ component: 'ListSelector (Aspect)', value: v })
              }
            />

            <div className="param-divider" />

            <ListSelector
              options={[
                '720p',
                { label: '1080p', badge: 'Slow' },
              ]}
              defaultValue="1080p"
              icon={QualityIcon}
              onChange={(v) =>
                setLastOutput({ component: 'ListSelector (Quality)', value: v })
              }
            />
          </div>

          {lastOutput && (
            <div
              style={{
                fontFamily: 'var(--ui-font-mono)',
                fontSize: 12,
                color: 'var(--ui-text-muted)',
                background: 'var(--ui-bg-card)',
                border: '1px solid var(--ui-border-subtle)',
                borderRadius: 'var(--ui-radius-md)',
                padding: '6px 14px',
                minHeight: 50,
                display: 'flex',
                alignItems: 'center',
                width: 286,
                boxSizing: 'border-box',
                textAlign: 'left',
              }}
            >
              {lastOutput.component} &rarr; {lastOutput.value}
            </div>
          )}
        </div>
    </div>
  )
}
