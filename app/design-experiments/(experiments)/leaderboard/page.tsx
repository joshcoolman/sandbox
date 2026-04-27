'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sora } from 'next/font/google'
import {
  Trophy, Medal, Sparkles, Flame, X,
  Rocket, Zap, Crown, Shield, Target, Award, MapPin, type LucideIcon,
} from 'lucide-react'
import './styles.css'

const sora = Sora({ subsets: ['latin'], weight: ['400', '600', '700'] })

type BadgeKey = 'rocket' | 'zap' | 'crown' | 'shield' | 'target' | 'award' | 'flame'
const BADGE_ICONS: Record<BadgeKey, LucideIcon> = {
  rocket: Rocket, zap: Zap, crown: Crown, shield: Shield,
  target: Target, award: Award, flame: Flame,
}

type Player = {
  id: string
  name: string
  score: number
  streak: number
  gradient: string
  image?: string
  city: string
  level: number
  winRate: number
  bestRun: string
  tagline: string
  badges: { icon: BadgeKey; label: string }[]
  weekly: number[]
}

const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p1', name: 'Maya Chen', score: 4820, streak: 12,
    gradient: 'linear-gradient(135deg, #ff6b9d, #c044ff)',
    image: '/leaderboard/avatars/01.jpg',
    city: 'Tokyo', level: 84, winRate: 0.71, bestRun: '8:14',
    tagline: 'Pace setter. Never blinks on a corner.',
    badges: [{ icon: 'crown', label: 'Reigning Champ' }, { icon: 'rocket', label: 'Pace Setter' }, { icon: 'flame', label: '12-Day Streak' }],
    weekly: [620, 710, 580, 760, 690, 740, 720],
  },
  {
    id: 'p2', name: 'Jordan Park', score: 4655, streak: 8,
    gradient: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
    image: '/leaderboard/avatars/02.jpg',
    city: 'Seoul', level: 76, winRate: 0.66, bestRun: '8:22',
    tagline: 'Calculated. Studies every track twice before running it.',
    badges: [{ icon: 'shield', label: 'Iron Defense' }, { icon: 'target', label: 'Pinpoint' }, { icon: 'zap', label: 'Hot Lap' }],
    weekly: [580, 620, 700, 640, 680, 710, 725],
  },
  {
    id: 'p3', name: 'Atlas Reyes', score: 4520, streak: 5,
    gradient: 'linear-gradient(135deg, #a3e635, #22c55e)',
    image: '/leaderboard/avatars/03.jpg',
    city: 'São Paulo', level: 72, winRate: 0.62, bestRun: '8:31',
    tagline: 'Late-bloom climber. Quiet on Mondays, ruthless by Friday.',
    badges: [{ icon: 'rocket', label: 'Comeback Kid' }, { icon: 'award', label: 'Podium x14' }, { icon: 'target', label: 'Sniper' }],
    weekly: [420, 540, 600, 690, 720, 760, 790],
  },
  {
    id: 'p4', name: 'Sam Voss', score: 4310, streak: 3,
    gradient: 'linear-gradient(135deg, #fbbf24, #f97316)',
    image: '/leaderboard/avatars/04.jpg',
    city: 'Austin', level: 68, winRate: 0.58, bestRun: '8:44',
    tagline: 'Pure aggression. Will trade clean lines for a bold pass.',
    badges: [{ icon: 'flame', label: 'Risk Taker' }, { icon: 'zap', label: 'Lightning' }, { icon: 'rocket', label: 'Boost Master' }],
    weekly: [560, 590, 640, 610, 650, 660, 680],
  },
  {
    id: 'p5', name: 'Rin Takeda', score: 4180, streak: 14,
    gradient: 'linear-gradient(135deg, #f472b6, #ec4899)',
    image: '/leaderboard/avatars/05.jpg',
    city: 'Osaka', level: 81, winRate: 0.69, bestRun: '8:18',
    tagline: 'Consistency machine. Has not missed a daily since February.',
    badges: [{ icon: 'flame', label: '14-Day Streak' }, { icon: 'shield', label: 'Steady Hand' }, { icon: 'award', label: 'Veteran' }],
    weekly: [600, 590, 620, 610, 600, 620, 640],
  },
  {
    id: 'p6', name: 'Cleo Martin', score: 3980, streak: 2,
    gradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
    image: '/leaderboard/avatars/06.jpg',
    city: 'Berlin', level: 64, winRate: 0.54, bestRun: '8:51',
    tagline: 'Methodical. Every run is a study session for the next one.',
    badges: [{ icon: 'target', label: 'Analyst' }, { icon: 'shield', label: 'Tactical' }, { icon: 'award', label: 'Quiet Climber' }],
    weekly: [510, 540, 560, 580, 600, 590, 610],
  },
  {
    id: 'p7', name: 'Wren Ito', score: 3850, streak: 7,
    gradient: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
    image: '/leaderboard/avatars/07.jpg',
    city: 'Vancouver', level: 61, winRate: 0.51, bestRun: '8:58',
    tagline: 'Glass cannon. Either flawless or face-down in lap one.',
    badges: [{ icon: 'zap', label: 'Glass Cannon' }, { icon: 'rocket', label: 'High Variance' }, { icon: 'flame', label: 'Hot Streak' }],
    weekly: [410, 720, 380, 690, 540, 580, 530],
  },
  {
    id: 'p8', name: 'Kai Holloway', score: 3700, streak: 1,
    gradient: 'linear-gradient(135deg, #fb7185, #e11d48)',
    image: '/leaderboard/avatars/08.jpg',
    city: 'Lisbon', level: 58, winRate: 0.49, bestRun: '9:02',
    tagline: 'New blood. Joined two weeks ago and climbing fast.',
    badges: [{ icon: 'rocket', label: 'Newcomer' }, { icon: 'target', label: 'Quick Study' }, { icon: 'award', label: 'Rising' }],
    weekly: [320, 380, 420, 480, 510, 540, 580],
  },
]

const SPRING = { type: 'spring' as const, stiffness: 420, damping: 30, mass: 0.8 }
const SPRINGY = { type: 'spring' as const, stiffness: 500, damping: 18, mass: 0.7 }
const SPARKLE_COLORS = ['#ffb81c', '#22d3ee', '#f472b6', '#a3e635', '#c044ff']

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2)
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="row-rank-medal" data-rank="1">
        <Trophy size={26} strokeWidth={2.2} fill="currentColor" fillOpacity={0.15} />
      </div>
    )
  }
  if (rank === 2 || rank === 3) {
    return (
      <div className="row-rank-medal" data-rank={rank}>
        <Medal size={24} strokeWidth={2.2} fill="currentColor" fillOpacity={0.12} />
      </div>
    )
  }
  return <div className="row-rank">{rank}</div>
}

type Pop = { id: number; playerId: string; amount: number }

function Sparkle({ index }: { index: number }) {
  const angle = (index / 8) * Math.PI * 2 + Math.random() * 0.4
  const distance = 60 + Math.random() * 30
  const x = Math.cos(angle) * distance
  const y = Math.sin(angle) * distance
  const color = SPARKLE_COLORS[index % SPARKLE_COLORS.length]
  return (
    <motion.span
      className="sparkle"
      style={{ background: color, right: 32, top: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
      animate={{ x, y, opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    />
  )
}

function ProfileModal({ player, rank, onClose }: { player: Player; rank: number; onClose: () => void }) {
  const weekMax = Math.max(...player.weekly)
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={SPRINGY}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={2.4} />
        </button>

        <div className="modal-header">
          <motion.div
            className="modal-avatar"
            style={{ background: player.gradient }}
            initial={{ scale: 0.25, rotate: -22 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 8, mass: 0.9, delay: 0.08 }}
          >
            {player.image
              ? <img className="modal-avatar-img" src={player.image} alt="" />
              : initials(player.name)}
            <motion.div
              className="modal-avatar-rank"
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
          <div className="modal-name-block">
            <h2 className="modal-name">{player.name}</h2>
            <div className="modal-meta">
              <span className="modal-city">
                <MapPin size={12} strokeWidth={2.5} />
                {player.city}
              </span>
              <span className="modal-dot">·</span>
              <span>Level {player.level}</span>
            </div>
            <p className="modal-tagline">"{player.tagline}"</p>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat">
            <span className="stat-value">{player.score.toLocaleString()}</span>
            <span className="stat-label">Score</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {player.streak}
              <Flame size={14} strokeWidth={2.5} color="#ff7a59" fill="#ff7a59" fillOpacity={0.3} />
            </span>
            <span className="stat-label">Day streak</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round(player.winRate * 100)}%</span>
            <span className="stat-label">Win rate</span>
          </div>
          <div className="stat">
            <span className="stat-value">{player.bestRun}</span>
            <span className="stat-label">Best run</span>
          </div>
        </div>

        <div className="modal-section">
          <span className="modal-section-label">This week</span>
          <div className="week-chart">
            {player.weekly.map((v, i) => {
              const h = (v / weekMax) * 100
              const isPeak = v === weekMax
              return (
                <div className="week-col" key={i}>
                  <div className="week-bar-track">
                    <motion.div
                      className="week-bar"
                      data-peak={isPeak}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ ...SPRING, delay: 0.1 + i * 0.05 }}
                    />
                  </div>
                  <span className="week-day">{days[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="modal-section">
          <span className="modal-section-label">Recent badges</span>
          <div className="badges">
            {player.badges.map((b, i) => {
              const Icon = BADGE_ICONS[b.icon]
              return (
                <motion.div
                  key={b.label}
                  className="badge"
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

export default function LeaderboardSketch() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS)
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
    <div className={`lb-page ${sora.className}`}>
      <div className="lb-shell">
        <header className="lb-header">
          <h1 className="lb-title">Leaderboard</h1>
          <button className="action-btn" onClick={awardRandom}>
            <Sparkles size={16} strokeWidth={2.5} />
            Award random points
          </button>
        </header>

        <section className="board">
          <ul className="board-list">
            {sorted.map((player, i) => {
              const rank = i + 1
              const pop = pops.find(p => p.playerId === player.id)
              const showSparkles = sparkleFor.includes(player.id)
              return (
                <motion.li
                  key={player.id}
                  layout
                  transition={SPRING}
                  className="row"
                  data-rank={rank}
                  data-hovered={hoveredId === player.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${player.name} profile`}
                  onClick={() => setOpenId(player.id)}
                  onMouseEnter={() => setHoveredId(player.id)}
                  onMouseLeave={() => setHoveredId(prev => prev === player.id ? null : prev)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setOpenId(player.id)
                    }
                  }}
                >
                  <RankBadge rank={rank} />
                  <motion.div
                    className="avatar"
                    style={{ background: player.gradient }}
                    animate={{
                      scale: hoveredId === player.id ? 1.55 : 1,
                      rotate: hoveredId === player.id ? -8 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 480, damping: 11, mass: 0.7 }}
                  >
                    {player.image
                      ? <img className="avatar-img" src={player.image} alt="" />
                      : initials(player.name)}
                  </motion.div>
                  <div className="row-name">
                    <span className="row-name-text">{player.name}</span>
                    <span className="row-streak">
                      <Flame size={11} strokeWidth={2.5} color="#ff7a59" fill="#ff7a59" fillOpacity={0.3} />
                      <strong>{player.streak}</strong> day streak
                    </span>
                  </div>
                  <motion.div
                    className="row-score"
                    layout
                    key={player.score}
                    initial={{ scale: 1 }}
                    animate={{ scale: pop ? [1, 1.18, 1] : 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    {player.score.toLocaleString()}
                  </motion.div>
                  <AnimatePresence>
                    {pop && (
                      <motion.div
                        key={pop.id}
                        className="score-pop"
                        initial={{ opacity: 0, y: 8, scale: 0.6 }}
                        animate={{ opacity: 1, y: -32, scale: 1 }}
                        exit={{ opacity: 0, y: -52, scale: 0.8 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                      >
                        +{pop.amount}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {showSparkles && (
                    <div className="sparkles">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <Sparkle key={idx} index={idx} />
                      ))}
                    </div>
                  )}
                </motion.li>
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
    </div>
  )
}
