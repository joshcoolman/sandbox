'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Flame } from 'lucide-react'
import type { Player } from '../types'
import { SPARKLE_COLORS, SPRING } from '../types'
import { RankBadge } from './RankBadge'
import styles from './LeaderboardRow.module.css'

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2)
}

function Sparkle({ index }: { index: number }) {
  const angle = (index / 8) * Math.PI * 2 + Math.random() * 0.4
  const distance = 60 + Math.random() * 30
  const x = Math.cos(angle) * distance
  const y = Math.sin(angle) * distance
  const color = SPARKLE_COLORS[index % SPARKLE_COLORS.length]
  return (
    <motion.span
      className={styles.sparkle}
      style={{ background: color, right: 32, top: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
      animate={{ x, y, opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    />
  )
}

interface LeaderboardRowProps {
  player: Player
  rank: number
  isHovered: boolean
  scorePop?: { id: number; amount: number }
  showSparkles: boolean
  onSelect: () => void
  onHoverStart: () => void
  onHoverEnd: () => void
}

export function LeaderboardRow({
  player,
  rank,
  isHovered,
  scorePop,
  showSparkles,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: LeaderboardRowProps) {
  return (
    <motion.li
      layout
      transition={SPRING}
      className={styles.row}
      data-rank={rank}
      data-hovered={isHovered}
      role="button"
      tabIndex={0}
      aria-label={`Open ${player.name} profile`}
      onClick={onSelect}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <RankBadge rank={rank} />
      <motion.div
        className={styles.avatar}
        style={{ background: player.gradient }}
        animate={{
          scale: isHovered ? 1.55 : 1,
          rotate: isHovered ? -8 : 0,
        }}
        transition={{ type: 'spring', stiffness: 480, damping: 11, mass: 0.7 }}
      >
        {player.image
          ? <img className={styles.avatarImg} src={player.image} alt="" />
          : initials(player.name)}
      </motion.div>
      <div className={styles.name}>
        <span className={styles.nameText}>{player.name}</span>
        <span className={styles.streak}>
          <Flame size={11} strokeWidth={2.5} color="#ff7a59" fill="#ff7a59" fillOpacity={0.3} />
          <strong>{player.streak}</strong> day streak
        </span>
      </div>
      <motion.div
        className={styles.score}
        layout
        key={player.score}
        initial={{ scale: 1 }}
        animate={{ scale: scorePop ? [1, 1.18, 1] : 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {player.score.toLocaleString()}
      </motion.div>
      <AnimatePresence>
        {scorePop && (
          <motion.div
            key={scorePop.id}
            className={styles.scorePop}
            initial={{ opacity: 0, y: 8, scale: 0.6 }}
            animate={{ opacity: 1, y: -32, scale: 1 }}
            exit={{ opacity: 0, y: -52, scale: 0.8 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            +{scorePop.amount}
          </motion.div>
        )}
      </AnimatePresence>
      {showSparkles && (
        <div className={styles.sparkles}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <Sparkle key={idx} index={idx} />
          ))}
        </div>
      )}
    </motion.li>
  )
}
