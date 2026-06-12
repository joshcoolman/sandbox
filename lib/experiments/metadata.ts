import type { Metadata } from 'next'
import { experiments } from './data'

/**
 * Per-experiment social/SEO metadata derived from the data.ts entry —
 * title, description, and the 1280x720 gallery screenshot as the
 * og:image / twitter:image. This is what makes a pasted experiment URL
 * unfurl into a thumbnail card on X, Discord, Slack, iMessage, etc.
 * Relative URLs resolve against metadataBase (app/layout.tsx).
 *
 * Server page shells export this directly. Experiments whose page.tsx is
 * a client component (and so can't export metadata) carry a tiny server
 * layout.tsx instead:
 *
 *   export const metadata: Metadata = experimentMetadata('my-slug')
 *   export default function Layout({ children }) { return children }
 */
export function experimentMetadata(slug: string): Metadata {
  const exp = experiments.find(e => e.slug === slug)
  if (!exp) return {}
  return {
    title: exp.title,
    description: exp.description,
    openGraph: {
      title: exp.title,
      description: exp.subtitle,
      url: `/design-experiments/${slug}`,
      type: 'website',
      images: exp.screenshot
        ? [
            {
              url: exp.screenshot,
              width: 1280,
              height: 720,
              alt: `${exp.title} — design experiment screenshot`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: exp.title,
      description: exp.subtitle,
      images: exp.screenshot ? [exp.screenshot] : undefined,
    },
  }
}
