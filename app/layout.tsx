import { Inter } from 'next/font/google'
import './globals.css'
import BackButton from './components/BackButton'
import Sidebar from './components/Sidebar'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

export const metadata = {
  title: 'Design Experiments Sandbox',
  description: 'A sandbox for exploring visual design systems, widgets, and layouts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BackButton />
        <Sidebar />
        {children}
      </body>
    </html>
  )
}
