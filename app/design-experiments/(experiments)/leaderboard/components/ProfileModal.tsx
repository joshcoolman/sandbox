'use client'

import { motion } from 'motion/react'
import {
  Trophy, Medal, Flame, X,
  Rocket, Zap, Crown, Shield, Target, Award, MapPin, type LucideIcon,
} from 'lucide-react'
import type { BadgeKey, Player } from '../types'
import { SPRING, SPRINGY } from '../types'
import styles from './ProfileModal.module.css'

const BADGE_ICONS: Record<BadgeKey, LucideIcon> = {
  rocket: Rocket,
  zap: Zap,
  crown: Crown,
  shield: Shield,
  target: Target,
  award: Award,
  flame: Flame,
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2)
}

interface ProfileModalProps {
  player: Player
  rank: number
  onClose: () => void
}

export function ProfileModal({ player, rank, onClose }: ProfileModalProps) {
  const weekMax = Math.max(...player.weekly)

  return (
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={SPRINGY}
        onClick={e => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={2.4} />
        </button>

        <div className={styles.header}>
          <motion.div
            className={styles.avatar}
            style={{ background: player.gradient }}
            initial={{ scale: 0.25, rotate: -22 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 8, mass: 0.9, delay: 0.08 }}
          >
            {player.image
              ? <img className={styles.avatarImg} src={player.image} alt="" />
              : initials(player.name)}
            <motion.div
              className={styles.avatarRank}
              data-rank={rank}
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 11, delay: 0.55 }}
            >
              {rank === 1 ? <Trophy size={16} strokeWidth={2.5} fill="currentColor" /> :
                rank <= 3 ? <Medal size={15} strokeWidth={2.5} fill="currentColor" /> :
                  <span>#{rank}</span>}
            </motion.div>
          </motion.div>
          <div className={styles.nameBlock}>
            <h2 className={styles.name}>{player.name}</h2>
            <div className={styles.meta}>
              <span className={styles.city}>
                <MapPin size={12} strokeWidth={2.5} />
                {player.city}
              </span>
              <span className={styles.dot}>·</span>
              <span>Level {player.level}</span>
            </div>
            <p className={styles.tagline}>"{player.tagline}"</p>
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{player.score.toLocaleString()}</span>
            <span className={styles.statLabel}>Score</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {player.streak}
              <Flame size={14} strokeWidth={2.5} color="#ff7a59" fill="#ff7a59" fillOpacity={0.3} />
            </span>
            <span className={styles.statLabel}>Day streak</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{Math.round(player.winRate * 100)}%</span>
            <span className={styles.statLabel}>Win rate</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{player.bestRun}</span>
            <span className={styles.statLabel}>Best run</span>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>This week</span>
          <div className={styles.weekChart}>
            {player.weekly.map((v, i) => {
              const h = (v / weekMax) * 100
              const isPeak = v === weekMax
              return (
                <div className={styles.weekCol} key={i}>
                  <div className={styles.weekBarTrack}>
                    <motion.div
                      className={styles.weekBar}
                      data-peak={isPeak}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ ...SPRING, delay: 0.1 + i * 0.05 }}
                    />
                  </div>
                  <span className={styles.weekDay}>{DAYS[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Recent badges</span>
          <div className={styles.badges}>
            {player.badges.map((b, i) => {
              const Icon = BADGE_ICONS[b.icon]
              return (
                <motion.div
                  key={b.label}
                  className={styles.badge}
                  initial={{ opacity: 0, y: 10, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...SPRINGY, delay: 0.2 + i * 0.06 }}
                >
                  <Icon size={16} strokeWidth={2.4} />
                  <span>{b.label}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
