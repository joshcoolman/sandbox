import type { Metadata } from 'next'
import { Karla, Bitter, Lora, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const karla = Karla({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

const bitter = Bitter({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-bitter',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-lora',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-space-mono',
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
    <html lang="en" className={`${bitter.variable} ${lora.variable} ${spaceMono.variable}`}>
      <body className={karla.className}>
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
