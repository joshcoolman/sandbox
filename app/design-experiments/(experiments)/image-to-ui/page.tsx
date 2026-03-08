'use client'

import { useState } from 'react'
import { DM_Sans, DM_Mono } from 'next/font/google'
import RotarySelector from './components/RotarySelector'
import DurationSlider from './components/DurationSlider'
import ListSelector from './components/ListSelector'
import ModelSelector from './components/ModelSelector'
import LightingSelector from './components/LightingSelector'
import FilmStockSelector from './components/FilmStockSelector'
import type { LightingPreset } from './components/LightingSelector'
import type { FilmStockPreset } from './components/FilmStockSelector'
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
  { title: 'Blade Runner', lighting: 'Low-key neo-noir lighting, heavy volumetric fog, dramatic backlighting, neon practical light sources, wet pavement reflections', color_grade: 'Cyberpunk color grade, vibrant cyan and magenta neon hues, deep blue shadows, high contrast, cinematic teal-and-pink palette', filmStock: 'Kodak Vision3 500T, pushed one stop', lens: 'Anamorphic, horizontal flares, oval bokeh', prompt: 'Low-key neo-noir, heavy volumetric fog, neon practical lights, wet pavement reflections, shot on Kodak Vision3 500T pushed +1, anamorphic lens flare, cyan and magenta neon hues, deep blue shadows', palette: ['#0af5f5', '#1a1a3e', '#ff2d95'] },
  { title: 'The Godfather', lighting: 'Top-down overhead lighting, Gordon Willis style, deep eye-socket shadows, low-key chiaroscuro, minimal background illumination', color_grade: 'Vintage 1940s color grade, warm amber and sepia tones, deep ink-black shadows, desaturated earthy browns, classic film grain', filmStock: 'Kodak 5254, warm amber cast, heavy grain', lens: 'Cooke S4 50mm, warm skin tone roll-off', prompt: 'Gordon Willis overhead lighting, deep eye-socket shadows, chiaroscuro, minimal fill, shot on Kodak 5254, Cooke S4 lens, warm amber and sepia tones, ink-black shadows, classic film grain', palette: ['#c88b3a', '#3d2b1a', '#1a1008'] },
  { title: 'The Matrix', lighting: 'Cold industrial lighting, harsh overhead fluorescents, green-tinted shadows, sharp high-contrast illumination, clinical atmosphere', color_grade: 'Digital code color grade, heavy monochromatic green tint, neutralized skin tones, deep forest green shadows, high-tech dystopian look', filmStock: 'Kodak Vision 500T with green color grade', lens: '21mm wide-angle, deep depth of field', prompt: 'Cold industrial fluorescent lighting, green-tinted shadows, high-contrast, shot on Kodak Vision 500T, heavy green color grade, neutralized skin tones, 21mm wide-angle, clinical dystopian atmosphere', palette: ['#00ff41', '#0d3b0d', '#0a0a0a'] },
  { title: 'Mad Max: Fury Road', lighting: 'Harsh high-noon desert sunlight, intense heat haze, extreme high-key highlights, sharp defined shadows, day-for-night blue sequences', color_grade: 'Hyper-saturated color grade, aggressive orange and teal palette, vivid cobalt skies, burnt sienna sands, high dynamic range (HDR)', filmStock: 'Kodak Vision3 250D, pushed for saturation', lens: 'Panavision Primo 35mm, anamorphic squeeze', prompt: 'Harsh desert sunlight, heat haze, extreme high-key, shot on Kodak Vision3 250D pushed, Panavision anamorphic, aggressive orange and teal grade, vivid cobalt skies, burnt sienna, HDR', palette: ['#e8691a', '#0a5e7a', '#f5c842'] },
  { title: 'Apocalypse Now', lighting: 'Extreme high-contrast chiaroscuro, flickering warm firelight, hazy jungle smoke, long dramatic silhouettes, moody rim lighting', color_grade: 'Gritty 70s film grade, deep jungle greens, oversaturated fire oranges, high-contrast shadows, humid atmospheric haze', filmStock: 'Kodak Ektachrome slide film, cross-processed', lens: 'Zeiss Super Speed 85mm, shallow DOF', prompt: 'Chiaroscuro firelight, jungle smoke haze, dramatic silhouettes, rim lighting, shot on Kodak Ektachrome cross-processed, Zeiss 85mm f/1.4, deep greens, oversaturated fire oranges, 70s film grain', palette: ['#2d5a1e', '#e85a1a', '#1a1a0a'] },
  { title: '2001: A Space Odyssey', lighting: 'Soft white diffused lighting, sterile futuristic glow, clinical even illumination, bounce lighting, high-key sci-fi brightness', color_grade: 'Pristine white color grade, clean primary colors, high-fidelity clarity, sterile and clinical palette, minimal color bleeding', filmStock: 'Kodak Vision3 50D, ultra-fine grain, maximum clarity', lens: 'Zeiss Planar 50mm f/1.4, razor-sharp center', prompt: 'Soft diffused white lighting, sterile clinical glow, even bounce illumination, high-key, shot on Kodak Vision3 50D, Zeiss Planar 50mm, pristine clean primary colors, ultra-fine grain, maximum clarity', palette: ['#f0f0f5', '#cc2222', '#2244aa'] },
  { title: 'The Shining', lighting: 'Clinical cold fluorescent lighting, symmetrical interior illumination, uncanny high-key brightness, absence of shadows, unsettling clarity', color_grade: 'Ominous high-saturation palette, vibrant reds and oranges, cold blue-tinted whites, sterile hotel aesthetic, flat lighting profile', filmStock: 'Kodak 5247, saturated, Steadicam-era Kodak look', lens: '18mm wide-angle, deep focus, slight barrel distortion', prompt: 'Clinical fluorescent lighting, symmetrical framing, uncanny high-key brightness, no shadows, shot on Kodak 5247, 18mm wide-angle, vibrant reds, cold blue-tinted whites, sterile hotel aesthetic', palette: ['#cc2222', '#e8a035', '#c0d0e0'] },
  { title: 'Her', lighting: 'Soft natural window light, gentle morning glow, airy diffused illumination, low-contrast shadows, intimate and warm lighting', color_grade: 'Modern pastel color grade, soft salmon pinks and warm reds, sunny yellow highlights, nostalgic shallow depth of field, romantic haze', filmStock: 'Kodak Vision3 500T, warm-balanced, soft grain', lens: 'Leica Summilux 50mm f/1.4, Leica glow, creamy bokeh', prompt: 'Soft natural window light, morning glow, airy diffused, low-contrast, shot on Kodak Vision3 500T, Leica Summilux 50mm f/1.4, pastel salmon pinks, warm reds, sunny highlights, romantic haze, shallow DOF', palette: ['#e87070', '#f5c08a', '#f5e0d0'] },
  { title: 'Alien', lighting: 'Low-key industrial lighting, flickering cold blue practicals, high-contrast shadows, claustrophobic atmospheric depth, steam and haze', color_grade: 'Grimy industrial color grade, cold steel blues, deep shadows, desaturated greens, gritty metallic textures, dark sci-fi horror', filmStock: 'Kodak 5247, underexposed, pushed in processing', lens: 'Panavision Ultra Speed 35mm, wide-angle distortion', prompt: 'Low-key industrial lighting, flickering cold blue practicals, high-contrast, steam and haze, shot on Kodak 5247 underexposed pushed +1, Panavision 35mm, cold steel blues, desaturated greens, gritty metallic', palette: ['#4a6a8a', '#1a2a1a', '#0a0a0f'] },
  { title: 'Sin City', lighting: 'Hard-edged comic book lighting, extreme high-contrast noir, stark white highlights, pitch-black voids, sharp rim lighting', color_grade: 'Strict monochromatic black and white, high-contrast ink style, selective spot-color highlights, graphic novel aesthetic', filmStock: 'Ilford Delta 3200, extreme contrast, heavy grain', lens: '85mm f/1.4, sharp subject, black void background', prompt: 'Hard-edged noir lighting, extreme contrast, stark white highlights, pitch-black voids, sharp rim light, shot on Ilford Delta 3200, 85mm f/1.4, strict monochromatic black and white, graphic novel ink style', palette: ['#ffffff', '#333333', '#000000'] },
]

const FILM_STOCK_PRESETS: FilmStockPreset[] = [
  { title: 'Kodak Portra 400', type: 'Color Negative', grain: 'Fine, organic grain structure with smooth tonal transitions', color: 'Warm, natural skin tones, soft highlight roll-off, slightly desaturated pastels', palette: ['#e8c4a0', '#c88b6a', '#7a5a40'], prompt: 'shot on Kodak Portra 400, warm natural skin tones, soft highlights, fine organic grain, slightly desaturated' },
  { title: 'Kodak Portra 800', type: 'Color Negative', grain: 'Moderate visible grain, textured but not harsh', color: 'Same warmth as Portra 400, slightly more contrast, better low-light rendering', palette: ['#d4a878', '#b07850', '#5a3a28'], prompt: 'shot on Kodak Portra 800, warm tones, visible film grain, low-light capable, natural skin rendering' },
  { title: 'Kodak Ektar 100', type: 'Color Negative', grain: 'Extremely fine grain, ultra-sharp, high resolution', color: 'Ultra-saturated, vivid, punchy primary colors with deep contrast', palette: ['#e83030', '#2277cc', '#22aa44'], prompt: 'shot on Kodak Ektar 100, ultra-saturated vivid colors, extremely fine grain, high contrast, punchy primaries' },
  { title: 'Kodak Gold 200', type: 'Color Negative', grain: 'Moderate consumer-grade grain, nostalgic texture', color: 'Warm golden cast, nostalgic consumer film tones, "memory" feeling', palette: ['#e8b84a', '#c89040', '#8a6830'], prompt: 'shot on Kodak Gold 200, warm golden cast, nostalgic consumer film, moderate grain, memory-like warmth' },
  { title: 'CineStill 800T', type: 'Cinema / Tungsten', grain: 'Moderate grain with distinctive halation glow around highlights', color: 'Red halation around bright lights, dreamy nighttime glow, tungsten-balanced blue shift', palette: ['#ff4444', '#2244aa', '#e8a040'], prompt: 'shot on CineStill 800T, red halation around bright lights, dreamy night glow, tungsten blue shift, cinema grain' },
  { title: 'Kodak Vision3 500T', type: 'Cinema / Tungsten', grain: 'Fine cinema grain, smooth gradations, professional', color: 'Blue-shifted under daylight, warm under tungsten, neutral skin tones', palette: ['#4a7aaa', '#e8b87a', '#3a3a4a'], prompt: 'shot on Kodak Vision3 500T, cinema tungsten film, blue shift in daylight, warm under tungsten, fine professional grain' },
  { title: 'Fuji Velvia 50', type: 'Slide / Transparency', grain: 'Ultra-fine grain, razor-sharp detail', color: 'Extreme saturation, deep blues, punchy greens, vivid reds. The landscape king', palette: ['#1a5aaa', '#22884a', '#cc2222'], prompt: 'shot on Fujifilm Velvia 50, extreme color saturation, deep rich blues, punchy greens, ultra-fine grain, slide film transparency' },
  { title: 'Kodak Ektachrome E100', type: 'Slide / Transparency', grain: 'Very fine grain, clean and precise', color: 'Vibrant but controlled, slightly cool cast, excellent color accuracy', palette: ['#3a8acc', '#44aa55', '#e8e0c8'], prompt: 'shot on Kodak Ektachrome E100, vibrant controlled colors, slightly cool cast, very fine grain, transparency sharpness' },
  { title: 'Fuji Pro 400H', type: 'Color Negative', grain: 'Fine grain with soft, smooth transitions', color: 'Soft dreamy pastels, ethereal airy quality, gentle highlight bloom', palette: ['#c8d8e8', '#e8d0c0', '#a8c0b8'], prompt: 'shot on Fujifilm Pro 400H, soft dreamy pastels, ethereal airy quality, gentle highlight bloom, fine grain' },
  { title: 'Kodak Tri-X 400', type: 'Black & White', grain: 'Strong visible grain, classic photojournalism texture', color: 'High contrast, deep blacks, bright highlights, full tonal range in B&W', palette: ['#e8e8e8', '#888888', '#1a1a1a'], prompt: 'shot on Kodak Tri-X 400, black and white, strong visible grain, high contrast, deep blacks, photojournalism aesthetic' },
  { title: 'Ilford HP5 Plus', type: 'Black & White', grain: 'Characteristic medium grain, good shadow detail', color: 'Rich tonal range, slightly softer contrast than Tri-X, documentary feel', palette: ['#d0d0d0', '#808080', '#2a2a2a'], prompt: 'shot on Ilford HP5 Plus 400, black and white, medium grain, rich tonal range, documentary aesthetic' },
  { title: 'Ilford Delta 3200', type: 'Black & White', grain: 'Extreme coarse grain, gritty, raw', color: 'High-ISO B&W, strong contrast, visible noise pattern, raw energy', palette: ['#c0c0c0', '#606060', '#0a0a0a'], prompt: 'shot on Ilford Delta 3200, black and white, extreme coarse grain, gritty raw texture, high contrast, pushed film' },
  { title: 'Kodachrome 64', type: 'Slide / Transparency', grain: 'Ultra-fine grain, legendary sharpness', color: 'Rich reds, deep blues, warm saturation, the iconic 1970s National Geographic look', palette: ['#cc3322', '#1a4488', '#e8a830'], prompt: 'shot on Kodachrome 64, rich reds, deep blues, warm iconic saturation, ultra-fine grain, 1970s National Geographic look' },
  { title: 'Fuji Superia 400', type: 'Color Negative', grain: 'Moderate consumer grain, slightly noisy', color: 'Cool undertones, slightly blue shadows, good contrast, everyday film', palette: ['#7a9ab0', '#88aa78', '#c8b898'], prompt: 'shot on Fujifilm Superia 400, cool undertones, blue shadows, moderate consumer grain, everyday film aesthetic' },
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

          <FilmStockSelector
            presets={FILM_STOCK_PRESETS}
            defaultValue="Kodak Portra 400"
            onChange={(p) =>
              setLastOutput({ component: 'FilmStockSelector', value: p.title })
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
