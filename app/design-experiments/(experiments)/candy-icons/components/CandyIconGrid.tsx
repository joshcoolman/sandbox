'use client'

import { useState, useRef } from 'react'
import { motion } from 'motion/react'
import type { CandyIcon } from '../types'
import { defaultIcons, animalMap } from '../data'
import styles from './CandyIconGrid.module.css'

interface CandyIconGridProps {
  icons?: CandyIcon[]
  className?: string
}

export function CandyIconGrid({
  icons = defaultIcons,
  className,
}: CandyIconGridProps) {
  const [popped, setPopped] = useState<Record<number, boolean>>({})
  const [bounceKey, setBounceKey] = useState<Record<number, number>>({})
  const [hopKey, setHopKey] = useState<Record<number, number>>({})
  const hideTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  return (
    <div className={`${styles.grid}${className ? ` ${className}` : ''}`}>
      {icons.map((icon, i) => (
        <motion.div
          key={icon.label}
          className={styles.cell}
          whileHover="hover"
          onHoverStart={() => {
            clearTimeout(hideTimers.current[i])
            setPopped((prev) => ({ ...prev, [i]: true }))
            setBounceKey((prev) => ({ ...prev, [i]: (prev[i] || 0) + 1 }))
          }}
          onHoverEnd={() => {
            hideTimers.current[i] = setTimeout(() => {
              setPopped((prev) => ({ ...prev, [i]: false }))
            }, 300)
          }}
        >
          <motion.div
            className={styles.iconWrap}
            variants={{
              hover: { scale: 1.1 },
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 14 }}
            onClick={() => {
              if (popped[i]) {
                setHopKey((prev) => ({ ...prev, [i]: (prev[i] || 0) + 1 }))
              }
            }}
          >
            <motion.img
              key={`${bounceKey[i] || 0}-${hopKey[i] || 0}`}
              src={`/animals-svg/${animalMap[i]}`}
              className={styles.animal}
              alt=""
              animate={popped[i] ? (hopKey[i] && hopKey[i] > 0 ? {
                y: [-126, -156, -126],
              } : {
                y: [0, -156, -116, -136, -126],
              }) : { y: 0 }}
              transition={popped[i]
                ? (hopKey[i] && hopKey[i] > 0
                  ? { duration: 0.3, times: [0, 0.4, 1] }
                  : { duration: 0.6, times: [0, 0.3, 0.55, 0.75, 1] })
                : { type: 'spring', stiffness: 300, damping: 20 }
              }
            />
            <div
              className={styles.icon}
              style={{ '--hue': icon.hue } as React.CSSProperties}
            >
              <motion.svg
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
                variants={{ hover: { scale: 1.15 } }}
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 10,
                  delay: 0.07,
                }}
              >
                <defs>
                  <linearGradient
                    id={`g-${icon.label}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={`hsl(${icon.hue}, 20%, 98%)`}
                    />
                    <stop
                      offset="50%"
                      stopColor={`hsl(${icon.hue}, 22%, 97%)`}
                    />
                    <stop
                      offset="100%"
                      stopColor={`hsl(${icon.hue}, 55%, 87%)`}
                    />
                  </linearGradient>
                </defs>
                <g fill={`url(#g-${icon.label})`}>
                  <path d={icon.path} />
                </g>
              </motion.svg>
            </div>
          </motion.div>
          <motion.div
            className={styles.floorShadow}
            initial={{
              background:
                'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.07) 55%, transparent 100%)',
            }}
            variants={{
              hover: {
                scaleX: 1.4,
                scaleY: 1.4,
                opacity: 1,
                background:
                  'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.07) 72%, transparent 100%)',
              },
            }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 14,
              delay: 0.03,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}
