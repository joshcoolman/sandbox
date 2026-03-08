'use client'

import { useState } from 'react'
import { DM_Sans, DM_Mono } from 'next/font/google'
import RotarySelector from './components/RotarySelector'
import DurationSlider from './components/DurationSlider'
import ListSelector from './components/ListSelector'
import ModelSelector from './components/ModelSelector'
import LightingSelector from './components/LightingSelector'
import type { LightingPreset } from './components/LightingSelector'
import type { ModelSection } from './types'
import './tokens.css'
import styles from './page.module.css'

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

const LIGHTING_PRESETS: LightingPreset[] = [
  { title: 'Blade Runner', lighting: 'Low-key neo-noir lighting, heavy volumetric fog, dramatic backlighting, neon practical light sources, wet pavement reflections', color_grade: 'Cyberpunk color grade, vibrant cyan and magenta neon hues, deep blue shadows, high contrast, cinematic teal-and-pink palette', palette: ['#0af5f5', '#1a1a3e', '#ff2d95'] },
  { title: 'The Godfather', lighting: 'Top-down overhead lighting, Gordon Willis style, deep eye-socket shadows, low-key chiaroscuro, minimal background illumination', color_grade: 'Vintage 1940s color grade, warm amber and sepia tones, deep ink-black shadows, desaturated earthy browns, classic film grain', palette: ['#c88b3a', '#3d2b1a', '#1a1008'] },
  { title: 'The Matrix', lighting: 'Cold industrial lighting, harsh overhead fluorescents, green-tinted shadows, sharp high-contrast illumination, clinical atmosphere', color_grade: 'Digital code color grade, heavy monochromatic green tint, neutralized skin tones, deep forest green shadows, high-tech dystopian look', palette: ['#00ff41', '#0d3b0d', '#0a0a0a'] },
  { title: 'Mad Max: Fury Road', lighting: 'Harsh high-noon desert sunlight, intense heat haze, extreme high-key highlights, sharp defined shadows, day-for-night blue sequences', color_grade: 'Hyper-saturated color grade, aggressive orange and teal palette, vivid cobalt skies, burnt sienna sands, high dynamic range (HDR)', palette: ['#e8691a', '#0a5e7a', '#f5c842'] },
  { title: 'Apocalypse Now', lighting: 'Extreme high-contrast chiaroscuro, flickering warm firelight, hazy jungle smoke, long dramatic silhouettes, moody rim lighting', color_grade: 'Gritty 70s film grade, deep jungle greens, oversaturated fire oranges, high-contrast shadows, humid atmospheric haze', palette: ['#2d5a1e', '#e85a1a', '#1a1a0a'] },
  { title: '2001: A Space Odyssey', lighting: 'Soft white diffused lighting, sterile futuristic glow, clinical even illumination, bounce lighting, high-key sci-fi brightness', color_grade: 'Pristine white color grade, clean primary colors, high-fidelity clarity, sterile and clinical palette, minimal color bleeding', palette: ['#f0f0f5', '#cc2222', '#2244aa'] },
  { title: 'The Shining', lighting: 'Clinical cold fluorescent lighting, symmetrical interior illumination, uncanny high-key brightness, absence of shadows, unsettling clarity', color_grade: 'Ominous high-saturation palette, vibrant reds and oranges, cold blue-tinted whites, sterile hotel aesthetic, flat lighting profile', palette: ['#cc2222', '#e8a035', '#c0d0e0'] },
  { title: 'Her', lighting: 'Soft natural window light, gentle morning glow, airy diffused illumination, low-contrast shadows, intimate and warm lighting', color_grade: 'Modern pastel color grade, soft salmon pinks and warm reds, sunny yellow highlights, nostalgic shallow depth of field, romantic haze', palette: ['#e87070', '#f5c08a', '#f5e0d0'] },
  { title: 'Alien', lighting: 'Low-key industrial lighting, flickering cold blue practicals, high-contrast shadows, claustrophobic atmospheric depth, steam and haze', color_grade: 'Grimy industrial color grade, cold steel blues, deep shadows, desaturated greens, gritty metallic textures, dark sci-fi horror', palette: ['#4a6a8a', '#1a2a1a', '#0a0a0f'] },
  { title: 'Sin City', lighting: 'Hard-edged comic book lighting, extreme high-contrast noir, stark white highlights, pitch-black voids, sharp rim lighting', color_grade: 'Strict monochromatic black and white, high-contrast ink style, selective spot-color highlights, graphic novel aesthetic', palette: ['#ffffff', '#333333', '#000000'] },
]

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
    <div className={`${styles.page} ${dmSans.variable} ${dmMono.variable}`}>
      <div className={styles.pageColumns}>
        <div className={styles.pageComponents}>
          <RotarySelector
            items={['Standard', 'Pro', 'Turbo']}
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

          <LightingSelector
            presets={LIGHTING_PRESETS}
            defaultValue="Blade Runner"
            onChange={(p) =>
              setLastOutput({ component: 'LightingSelector', value: p.title })
            }
          />

          {/* Parameter toolbar -- three selectors grouped */}
          <div className={styles.paramToolbar} style={{ width: 286, justifyContent: 'center' }}>
            <DurationSlider
              values={[3, 6, 9, 12, 15]}
              defaultValue={6}
              unit="s"
              onChange={(v) =>
                setLastOutput({ component: 'DurationSlider', value: `${v}s` })
              }
            />

            <div className={styles.paramDivider} />

            <ListSelector
              options={['16:9', '9:16', '1:1']}
              defaultValue="16:9"
              icon={AspectIcon}
              onChange={(v) =>
                setLastOutput({ component: 'ListSelector (Aspect)', value: v })
              }
            />

            <div className={styles.paramDivider} />

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
            <div className={styles.output}>
              {lastOutput.component} &rarr; {lastOutput.value}
            </div>
          )}
        </div>

        <div className={styles.pageDescription}>
          <h1 className={styles.pageTitle}>Image to UI</h1>
          <p>
            These components were reverse-engineered from screenshots of a video generation UI. Starting from reference images, each element was rebuilt as an interactive, parameterized component through conversation -- describing what we saw, iterating on spacing, color, and behavior until the result felt right.
          </p>
          <p>
            The process was entirely collaborative: Josh Coolman provided screenshots, visual feedback, and design direction via voice and screen sharing, while Claude Code interpreted the images, wrote the components, and refined details across multiple rounds. No design files or specs were used -- just images and dialogue.
          </p>
        </div>
      </div>
    </div>
  )
}
