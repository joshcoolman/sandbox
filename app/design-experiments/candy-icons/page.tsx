'use client'

import './styles.css'
import { motion } from 'motion/react'

interface Icon {
  label: string
  hue: number
  path: React.ReactNode
}

const icons: Icon[] = [
  {
    label: 'Heart',
    hue: 340,
    path: (
      <path d="M32 56.5C18 44.5 8 37 8 26a14 14 0 0 1 24-9.8A14 14 0 0 1 56 26c0 11-10 18.5-24 30.5z" />
    ),
  },
  {
    label: 'Star',
    hue: 45,
    // Redrawn: centered at (32,33), outer r=27, inner r=11 — fills viewbox evenly
    path: (
      <path d="M32 6L38 24 58 25 42 36 48 55 32 44 16 55 22 36 6 25 26 24Z" />
    ),
  },
  {
    label: 'Bolt',
    hue: 268,
    path: <path d="M36 4L16 34h16l-4 26 22-32H34z" />,
  },
  {
    label: 'Play',
    hue: 208,
    path: <path d="M20 10a4 4 0 0 0-4 4.5v35a4 4 0 0 0 6 3.5l28-17.5a4 4 0 0 0 0-7L22 11a4 4 0 0 0-2-1z" />,
  },
  {
    label: 'Flame',
    hue: 18,
    path: <path d="M32 6C22 20 14 30 14 40a18 18 0 0 0 36 0C50 30 42 20 32 6z" />,
  },
]

export default function CandyIconsPage() {
  return (
    <main className="candy-page">
      <div className="candy-grid">
        {icons.map((icon) => (
          <motion.div key={icon.label} className="candy-cell" whileHover="hover">
            <motion.div
              className="candy-icon"
              style={{ '--hue': icon.hue } as React.CSSProperties}
              variants={{
                hover: { scale: 1.1 },
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 14 }}
            >
              <motion.svg
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
                variants={{ hover: { scale: 1.15 } }}
                transition={{ type: 'spring', stiffness: 320, damping: 10, delay: 0.07 }}
              >
                <defs>
                  <linearGradient id={`g-${icon.label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={`hsl(${icon.hue}, 20%, 98%)`} />
                    <stop offset="50%" stopColor={`hsl(${icon.hue}, 22%, 97%)`} />
                    <stop offset="100%" stopColor={`hsl(${icon.hue}, 55%, 87%)`} />
                  </linearGradient>
                </defs>
                <g fill={`url(#g-${icon.label})`}>{icon.path}</g>
              </motion.svg>
            </motion.div>
            <motion.div
              className="candy-floor-shadow"
              initial={{
                background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.07) 55%, transparent 100%)',
              }}
              variants={{
                hover: {
                  scaleX: 1.4,
                  scaleY: 1.4,
                  opacity: 1,
                  background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.07) 72%, transparent 100%)',
                },
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.03 }}
            />
          </motion.div>
        ))}
      </div>
    </main>
  )
}
