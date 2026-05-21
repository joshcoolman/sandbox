import type { Metadata } from 'next'
import Image from 'next/image'
import { Fraunces, JetBrains_Mono } from 'next/font/google'
import { experimentMetadata } from '@/lib/experiments/metadata'
import './styles.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
})

export const metadata: Metadata = experimentMetadata('staff-photos')

const staff = [
  { src: '/staff-photos/01.png', name: 'Aaliyah Brooks', role: 'Creative Director' },
  { src: '/staff-photos/02.png', name: 'Kenji Nakamura', role: 'Engineering Lead' },
  { src: '/staff-photos/03.png', name: 'Camila Reyes', role: 'Brand Strategist' },
  { src: '/staff-photos/04.png', name: 'Arjun Patel', role: 'Principal Designer' },
  { src: '/staff-photos/05.png', name: 'Saoirse O’Connor', role: 'Head of Operations' },
  { src: '/staff-photos/06.png', name: 'Omar Haddad', role: 'Senior Producer' },
]

export default function StaffPhotosExperiment() {
  return (
    <div className={`staff-page ${fraunces.variable} ${jetbrains.variable}`}>
      <header className="staff-header">
        <span className="staff-eyebrow">Studio · 2026</span>
        <h2 className="staff-title">The People</h2>
        <p className="staff-lede">
          Six made-up colleagues, generated end-to-end through the genzen MCP server. No
          stock photo library — just a prompt, a model, and six round-trips.
        </p>
      </header>

      <ul className="staff-grid">
        {staff.map((person) => (
          <li key={person.name} className="staff-card">
            <div className="staff-frame">
              <Image
                src={person.src}
                alt={person.name}
                width={600}
                height={600}
                className="staff-photo"
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 30vw, 280px"
              />
            </div>
            <div className="staff-meta">
              <span className="staff-name">{person.name}</span>
              <span className="staff-role">{person.role}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
