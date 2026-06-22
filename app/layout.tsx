import type { Metadata } from 'next'
import { Hanken_Grotesk, Fraunces, Space_Mono, Bitter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import './styles/house.css'

// Paper & Ink — Swiss grotesque for display/UI, high-contrast serif for prose.
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-hanken',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-fraunces',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-space-mono',
})

// Display title font (the one Hanken slot, now swapped to Bitter).
const bitter = Bitter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-bitter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.joshcoolman.com'),
  title: {
    default: 'Josh Coolman — Design Experiments & Writing',
    template: '%s | Josh Coolman',
  },
  description: 'Josh Coolman explores design through code — interactive experiments, visual systems, and writing about building with AI agents.',
  authors: [{ name: 'Josh Coolman' }],
  openGraph: {
    title: 'Josh Coolman — Design Experiments & Writing',
    description: 'Interactive design experiments, visual systems, and writing about building with AI agents.',
    siteName: 'Josh Coolman',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Josh Coolman',
    url: 'https://www.joshcoolman.com',
    sameAs: [
      'https://github.com/joshcoolman',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Josh Coolman',
    url: 'https://www.joshcoolman.com',
  },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${hanken.variable} ${fraunces.variable} ${spaceMono.variable} ${bitter.variable}`}
    >
      <head>
        {/* Apply saved theme before paint to avoid a flash of the wrong theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('site-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
