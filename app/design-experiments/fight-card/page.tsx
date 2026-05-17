'use client';
import { useState, useEffect } from 'react';
import './styles.css';

const STATS = ['Power', 'Speed', 'Endurance', 'Defense', 'Agility'] as const;
type StatKey = typeof STATS[number];

type Fighter = {
  name: string; city: string; image: string; tagline: string;
  gradient: string; color: string; record: string;
  stats: Record<StatKey, number>;
};

const matchups: { label: string; rounds: number; a: Fighter; b: Fighter }[] = [
  {
    label: 'MAIN EVENT', rounds: 5,
    a: {
      name: 'Maya Chen', city: 'Tokyo',
      image: '/leaderboard/avatars/01.jpg',
      tagline: 'Pace setter. Never blinks on a corner.',
      gradient: 'linear-gradient(135deg, #ff6b9d, #c044ff)',
      color: '#ff6b9d', record: '18–2',
      stats: { Power: 82, Speed: 94, Endurance: 78, Defense: 88, Agility: 91 },
    },
    b: {
      name: 'Jordan Park', city: 'Seoul',
      image: '/leaderboard/avatars/02.jpg',
      tagline: 'Calculated. Studies every track twice.',
      gradient: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
      color: '#22d3ee', record: '15–4',
      stats: { Power: 76, Speed: 82, Endurance: 85, Defense: 95, Agility: 79 },
    },
  },
  {
    label: 'CO-MAIN EVENT', rounds: 5,
    a: {
      name: 'Sam Voss', city: 'Austin',
      image: '/leaderboard/avatars/04.jpg',
      tagline: 'Pure aggression. Bold pass, no apologies.',
      gradient: 'linear-gradient(135deg, #fbbf24, #f97316)',
      color: '#fbbf24', record: '22–6',
      stats: { Power: 96, Speed: 88, Endurance: 71, Defense: 64, Agility: 85 },
    },
    b: {
      name: 'Rin Takeda', city: 'Osaka',
      image: '/leaderboard/avatars/05.jpg',
      tagline: 'Consistency machine. Has not missed a daily since February.',
      gradient: 'linear-gradient(135deg, #f472b6, #ec4899)',
      color: '#ec4899', record: '19–3',
      stats: { Power: 74, Speed: 77, Endurance: 97, Defense: 86, Agility: 76 },
    },
  },
  {
    label: 'FEATURED BOUT', rounds: 3,
    a: {
      name: 'Atlas Reyes', city: 'São Paulo',
      image: '/leaderboard/avatars/03.jpg',
      tagline: 'Late-bloom climber. Ruthless by Friday.',
      gradient: 'linear-gradient(135deg, #a3e635, #22c55e)',
      color: '#a3e635', record: '14–5',
      stats: { Power: 79, Speed: 75, Endurance: 88, Defense: 82, Agility: 84 },
    },
    b: {
      name: 'Wren Ito', city: 'Vancouver',
      image: '/leaderboard/avatars/07.jpg',
      tagline: 'Glass cannon. Flawless or face-down in lap one.',
      gradient: 'linear-gradient(135deg, #2dd4bf, #0ea5e9)',
      color: '#2dd4bf', record: '16–8',
      stats: { Power: 91, Speed: 95, Endurance: 61, Defense: 58, Agility: 92 },
    },
  },
];

function FighterProfile({ f, side }: { f: Fighter; side: 'a' | 'b' }) {
  return (
    <div className={`fighter-${side}`}>
      <div className="fighter-avatar-ring" style={{ background: f.gradient }}>
        <img src={f.image} alt={f.name} className="fighter-avatar" />
      </div>
      <div className="fighter-name">{f.name}</div>
      <div className="fighter-city">{f.city}</div>
      <div className="fighter-tagline">{f.tagline}</div>
      <div className="fighter-record-row">
        <span className="record-label">REC</span>
        <span className="record-value">{f.record}</span>
      </div>
    </div>
  );
}

function CompBars({ a, b }: { a: Fighter; b: Fighter }) {
  return (
    <div className="comp-bars">
      {STATS.map((stat, i) => (
        <div key={stat} className="comp-row">
          <span className="comp-val comp-val-a">{a.stats[stat]}</span>
          <div className="comp-track comp-track-a">
            <div
              className="comp-fill"
              style={{
                '--w': `${a.stats[stat]}%`,
                background: a.gradient,
                transitionDelay: `${i * 0.07}s`,
              } as React.CSSProperties}
            />
          </div>
          <span className="comp-label">{stat}</span>
          <div className="comp-track comp-track-b">
            <div
              className="comp-fill"
              style={{
                '--w': `${b.stats[stat]}%`,
                background: b.gradient,
                transitionDelay: `${i * 0.07}s`,
              } as React.CSSProperties}
            />
          </div>
          <span className="comp-val comp-val-b">{b.stats[stat]}</span>
        </div>
      ))}
    </div>
  );
}

export default function FightCardPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  return (
    <div className={`page${ready ? ' ready' : ''}`}>
      <div className="header">
        <div className="header-eyebrow">Season 3 · Championship Series</div>
        <div className="header-title">FIGHT CARD</div>
        <div className="header-divider" />
        <div className="header-sub">Three Matchups · Official Lineup</div>
      </div>

      <div className="matchups">
        {matchups.map((m, i) => (
          <div key={i} className="matchup">
            <div className="matchup-header">
              <span className="matchup-label">{m.label}</span>
              <div className="matchup-meta">
                <span className="matchup-series">Championship Series</span>
                <span className="matchup-rounds">{m.rounds} Rounds</span>
              </div>
            </div>
            <div className="matchup-body">
              <FighterProfile f={m.a} side="a" />
              <div className="center-col">
                <div className="vs-badge">
                  <span className="vs-text">VS</span>
                </div>
                <CompBars a={m.a} b={m.b} />
              </div>
              <FighterProfile f={m.b} side="b" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
