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
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [blown, setBlown] = useState(false);
  const [lost, setLost] = useState(false);
  const [quaking, setQuaking] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const pid = useRef(0);

  function explode(line: number[], winner: Cell) {
    const color = winner === 'X' ? '#ff4d6d' : '#4dd2ff';
    const cells = boardRef.current?.querySelectorAll('.cell');
    if (!cells) return;
    const burst: Particle[] = [];
    line.forEach((idx) => {
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

  function handleClick(idx: number) {
    if (board[idx] || winLine || lost) return;
    const next = [...board];
    next[idx] = turn;
    setBoard(next);

    const result = findWin(next);
    if (result) {
      setWinLine(result.line);
      // flare, then quake + explode, then the cruel reveal
      setTimeout(() => {
        setQuaking(true);
        explode(result.line, result.winner);
        setBlown(true);
        setTimeout(() => setQuaking(false), 400);
        setTimeout(() => setLost(true), 250);
      }, 450);
      return;
    }
    setTurn(turn === 'X' ? 'O' : 'X');
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinLine(null);
    setBlown(false);
    setLost(false);
    setQuaking(false);
    setParticles([]);
  }

  return (
    <div className="stage">
      <div className="title">Tic · Tac · Doom</div>

      <div className="statusBar">
        {!winLine && (
          <>
            <span className={`turnDot ${turn.toLowerCase()}`} />
            <span>{turn}&rsquo;s turn</span>
          </>
        )}
      </div>

      <div ref={boardRef} className={`board ${quaking ? 'quaking' : ''}`}>
        {board.map((cell, idx) => {
          const isWinning = winLine?.includes(idx);
          return (
            <button
              key={idx}
              className={`cell ${isWinning ? 'winning' : ''} ${blown && isWinning ? 'blown' : ''}`}
              onClick={() => handleClick(idx)}
              disabled={!!cell || !!winLine}
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
          <div className="youLose">YOU LOSE</div>
          <div className="subtitle">Three in a row. Catastrophic. As predicted.</div>
          <button className="againBtn" onClick={reset}>Lose Again</button>
        </div>
      )}
    </div>
  );
}
