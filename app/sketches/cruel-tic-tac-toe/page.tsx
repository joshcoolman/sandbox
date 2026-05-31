// sketch: Tic-tac-toe with a vengeful twist — get three in a row and the pieces explode while the overlay sneers "You Lose."
'use client';

import { useState, useRef } from 'react';
import './styles.css';

type Cell = 'X' | 'O' | null;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

// Taunts in the register of E.M. Cioran — a couple near his actual aphorisms,
// the rest adapted to the spirit of a defeat screen.
const WIN_TAUNTS = [
  'Mediocrity suits you.',
  'You are defeated eternally.',
  'You hoped. How quaint.',
  'Three steps toward the grave.',
  'The void was unimpressed.',
  'Winning: failure in costume.',
  'Congratulations on nothing.',
  'You peaked. Downhill now.',
];

const DRAW_TAUNTS = [
  'Nothing decided. As ever.',
  'You played. Pity.',
  'Both futile. How symmetrical.',
  'Nine squares, zero point.',
  'Not even a loser. Less.',
  'A tie that binds nothing.',
  'You endure. Barely.',
];

function pick(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

function findWin(board: Cell[]): { winner: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
}

export default function CruelTicTacToePage() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [doomed, setDoomed] = useState<number[] | null>(null);
  const [blown, setBlown] = useState(false);
  const [lost, setLost] = useState(false);
  const [taunt, setTaunt] = useState('');
  const [quaking, setQuaking] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const pid = useRef(0);

  function explode(indices: number[], board: Cell[]) {
    const cells = boardRef.current?.querySelectorAll('.cell');
    if (!cells) return;
    const burst: Particle[] = [];
    indices.forEach((idx) => {
      const color = board[idx] === 'X' ? '#ff4d6d' : '#4dd2ff';
      const rect = cells[idx].getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      for (let i = 0; i < 18; i++) {
        const angle = (Math.PI * 2 * i) / 18 + (idx * 0.3);
        const dist = 80 + (i % 5) * 40;
        burst.push({
          id: pid.current++,
          x: cx,
          y: cy,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: 6 + (i % 4) * 4,
          color,
        });
      }
    });
    setParticles(burst);
  }

  // win or draw, the ending is the same: flare, quake, blow up the pieces, lose.
  function doom(indices: number[], board: Cell[], message: string) {
    setDoomed(indices);
    setTaunt(message);
    setTimeout(() => {
      setQuaking(true);
      explode(indices, board);
      setBlown(true);
      setTimeout(() => setQuaking(false), 400);
      setTimeout(() => setLost(true), 250);
    }, 450);
  }

  function handleClick(idx: number) {
    if (board[idx] || doomed || lost) return;
    const next = [...board];
    next[idx] = turn;
    setBoard(next);

    const result = findWin(next);
    if (result) {
      doom(result.line, next, pick(WIN_TAUNTS));
      return;
    }
    if (next.every((c) => c !== null)) {
      // a draw — no winner, so the whole board pays the price
      doom([0, 1, 2, 3, 4, 5, 6, 7, 8], next, pick(DRAW_TAUNTS));
      return;
    }
    setTurn(turn === 'X' ? 'O' : 'X');
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setDoomed(null);
    setBlown(false);
    setLost(false);
    setTaunt('');
    setQuaking(false);
    setParticles([]);
  }

  return (
    <div className="stage">
      <div className="title">Tic · Tac · Doom</div>

      <div className="statusBar">
        {!doomed && (
          <>
            <span className={`turnDot ${turn.toLowerCase()}`} />
            <span>{turn}&rsquo;s turn</span>
          </>
        )}
      </div>

      <div ref={boardRef} className={`board ${quaking ? 'quaking' : ''}`}>
        {board.map((cell, idx) => {
          const isDoomed = doomed?.includes(idx);
          return (
            <button
              key={idx}
              className={`cell ${isDoomed ? 'winning' : ''} ${blown && isDoomed ? 'blown' : ''}`}
              onClick={() => handleClick(idx)}
              disabled={!!cell || !!doomed}
            >
              {cell && <span className={`mark ${cell.toLowerCase()}`}>{cell}</span>}
            </button>
          );
        })}
      </div>

      <div className="particleLayer">
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 12px ${p.color}`,
              ['--dx' as string]: `${p.dx}px`,
              ['--dy' as string]: `${p.dy}px`,
            }}
          />
        ))}
      </div>

      {lost && (
        <div className="overlay">
          <div className="youLose">{taunt}</div>
          <button className="againBtn" onClick={reset}>Lose Again</button>
        </div>
      )}
    </div>
  );
}
