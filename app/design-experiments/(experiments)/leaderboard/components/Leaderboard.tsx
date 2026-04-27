'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Sparkles } from 'lucide-react'
import type { Player } from '../types'
import { LeaderboardRow } from './LeaderboardRow'
import { ProfileModal } from './ProfileModal'
import styles from './Leaderboard.module.css'

type Pop = { id: number; playerId: string; amount: number }

export interface LeaderboardProps {
  initialPlayers: Player[]
  title?: string
  showAwardButton?: boolean
  className?: string
}

export function Leaderboard({
  initialPlayers,
  title = 'Leaderboard',
  showAwardButton = true,
  className,
}: LeaderboardProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [pops, setPops] = useState<Pop[]>([])
  const [sparkleFor, setSparkleFor] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const sorted = [...players].sort((a, b) => b.score - a.score)
  const openPlayer = openId ? sorted.find(p => p.id === openId) : null
  const openRank = openId ? sorted.findIndex(p => p.id === openId) + 1 : 0

  useEffect(() => {
    if (!openId) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openId])

  function awardRandom() {
    const count = 1 + Math.floor(Math.random() * 3)
    const pool = [...players]
    const winners: { id: string; amount: number }[] = []
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      const [winner] = pool.splice(idx, 1)
      const amount = [100, 150, 200, 250, 300][Math.floor(Math.random() * 5)]
      winners.push({ id: winner.id, amount })
    }

    const baseId = Date.now()
    winners.forEach((w, i) => {
      const popId = baseId + i
      setTimeout(() => {
        setPlayers(prev => prev.map(p => p.id === w.id ? { ...p, score: p.score + w.amount } : p))
        setPops(prev => [...prev, { id: popId, playerId: w.id, amount: w.amount }])
        setSparkleFor(prev => prev.includes(w.id) ? prev : [...prev, w.id])

        setTimeout(() => setPops(prev => prev.filter(p => p.id !== popId)), 900)
        setTimeout(() => setSparkleFor(prev => prev.filter(id => id !== w.id)), 700)
      }, i * 220)
    })
  }

  return (
    <>
      <div className={[styles.shell, className].filter(Boolean).join(' ')}>
        {(title || showAwardButton) && (
          <header className={styles.header}>
            {title && <h1 className={styles.title}>{title}</h1>}
            {showAwardButton && (
              <button className={styles.actionBtn} onClick={awardRandom}>
                <Sparkles size={16} strokeWidth={2.5} />
                Award random points
              </button>
            )}
          </header>
        )}

        <section className={styles.board}>
          <ul className={styles.list}>
            {sorted.map((player, i) => {
              const rank = i + 1
              const pop = pops.find(p => p.playerId === player.id)
              return (
                <LeaderboardRow
                  key={player.id}
                  player={player}
                  rank={rank}
                  isHovered={hoveredId === player.id}
                  scorePop={pop ? { id: pop.id, amount: pop.amount } : undefined}
                  showSparkles={sparkleFor.includes(player.id)}
                  onSelect={() => setOpenId(player.id)}
                  onHoverStart={() => setHoveredId(player.id)}
                  onHoverEnd={() => setHoveredId(prev => prev === player.id ? null : prev)}
                />
              )
            })}
          </ul>
        </section>
      </div>

      <AnimatePresence>
        {openPlayer && (
          <ProfileModal
            key={openPlayer.id}
            player={openPlayer}
            rank={openRank}
            onClose={() => setOpenId(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
