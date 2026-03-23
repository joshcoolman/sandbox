import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const alt = 'Josh Coolman'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function loadFont(filename: string): Buffer {
  return readFileSync(join(process.cwd(), 'public', 'fonts', filename))
}

export default async function OGImage() {
  const bitter = loadFont('Bitter-Bold.ttf')
  const lora = loadFont('Lora-Regular.ttf')
  const spaceMono = loadFont('SpaceMono-Regular.ttf')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0b0b0b',
          padding: '60px 72px',
          gap: 24,
        }}
      >
        <div
          style={{
            width: 64,
            height: 4,
            backgroundColor: '#8FF7F9',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            fontFamily: 'Bitter',
            fontSize: 64,
            fontWeight: 700,
            color: '#d5d0c8',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          Josh Coolman
        </div>
        <div
          style={{
            fontFamily: 'Lora',
            fontSize: 28,
            fontStyle: 'italic',
            color: '#a09888',
            lineHeight: 1.4,
          }}
        >
          Design Experiments & Writing
        </div>
        <div
          style={{
            fontFamily: 'Space Mono',
            fontSize: 18,
            color: '#706860',
            marginTop: 16,
          }}
        >
          joshcoolman.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Bitter', data: bitter, weight: 700 as const, style: 'normal' as const },
        { name: 'Lora', data: lora, weight: 400 as const, style: 'normal' as const },
        { name: 'Space Mono', data: spaceMono, weight: 400 as const, style: 'normal' as const },
      ],
    }
  )
}
