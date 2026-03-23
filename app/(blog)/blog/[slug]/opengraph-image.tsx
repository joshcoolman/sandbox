import { ImageResponse } from 'next/og'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { getPostBySlug, getAllPosts } from '@/lib/blog/loadBlog'

export const runtime = 'nodejs'
export const alt = 'Blog post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

function loadFont(filename: string): Buffer {
  return readFileSync(join(process.cwd(), 'public', 'fonts', filename))
}

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

function loadHeroImage(imagePath: string | undefined): string | null {
  if (!imagePath) return null
  const fullPath = join(process.cwd(), 'public', imagePath)
  if (!existsSync(fullPath)) return null
  const ext = imagePath.substring(imagePath.lastIndexOf('.'))
  const mime = MIME[ext] || 'image/jpeg'
  const data = readFileSync(fullPath).toString('base64')
  return `data:${mime};base64,${data}`
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  const bitter = loadFont('Bitter-Bold.ttf')
  const lora = loadFont('Lora-Regular.ttf')
  const spaceMono = loadFont('SpaceMono-Regular.ttf')

  const title = post?.meta.title ?? 'Blog Post'
  const subtitle = post?.meta.subtitle ?? ''
  const date = post?.meta.date
    ? new Date(post.meta.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''
  const author = post?.meta.author ?? 'Josh Coolman'
  const heroSrc = loadHeroImage(post?.meta.image)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          backgroundColor: '#0b0b0b',
          position: 'relative',
        }}
      >
        {/* Hero image background */}
        {heroSrc && (
          <img
            src={heroSrc}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: heroSrc
              ? 'linear-gradient(to bottom, transparent 10%, rgba(11,11,11,0.6) 40%, rgba(11,11,11,0.92) 70%, rgb(11,11,11) 100%)'
              : 'transparent',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '60px 72px',
            position: 'relative',
            gap: 12,
            flex: 1,
          }}
        >
          {/* Accent line (only when no hero) */}
          {!heroSrc && (
            <div
              style={{
                width: 64,
                height: 4,
                backgroundColor: '#8FF7F9',
                borderRadius: 2,
                position: 'absolute',
                top: 60,
                left: 72,
              }}
            />
          )}

          <div
            style={{
              fontFamily: 'Bitter',
              fontSize: title.length > 40 ? 48 : 56,
              fontWeight: 700,
              color: heroSrc ? '#ffffff' : '#d5d0c8',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              textShadow: heroSrc ? '0 2px 12px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontFamily: 'Lora',
                fontSize: 24,
                fontStyle: 'italic',
                color: heroSrc ? 'rgba(240,237,232,0.8)' : '#a09888',
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              fontFamily: 'Space Mono',
              fontSize: 16,
              color: heroSrc ? 'rgba(240,237,232,0.6)' : '#706860',
              marginTop: 16,
            }}
          >
            <div style={{ display: 'flex', gap: 24 }}>
              {date && <span>{date}</span>}
              <span>{author}</span>
            </div>
            <span>joshcoolman.com</span>
          </div>
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
