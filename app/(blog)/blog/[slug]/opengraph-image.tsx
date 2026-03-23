import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
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

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0b0b0b',
          padding: '60px 72px',
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
          <div
            style={{
              fontFamily: 'Bitter',
              fontSize: title.length > 40 ? 48 : 56,
              fontWeight: 700,
              color: '#d5d0c8',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
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
                color: '#a09888',
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontFamily: 'Space Mono',
            fontSize: 16,
            color: '#706860',
          }}
        >
          <div style={{ display: 'flex', gap: 24 }}>
            {date && <span>{date}</span>}
            <span>{author}</span>
          </div>
          <span>joshcoolman.com</span>
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
