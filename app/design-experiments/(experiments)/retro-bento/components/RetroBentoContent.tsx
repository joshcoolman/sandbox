'use client';

import { useState, useCallback, ReactNode } from 'react';
import { DM_Mono, Archivo_Narrow } from 'next/font/google';
import { motion } from 'motion/react';
import { TemporalGauge } from './TemporalGauge';
import { FluxCapacitor } from './FluxCapacitor';
import { SpectralAnalyzer } from './SpectralAnalyzer';
import { NeuralGrid } from './NeuralGrid';
import { EntropyEngine } from './EntropyEngine';
import { PhaseScope } from './PhaseScope';
import { MemoryBank } from './MemoryBank';
import { ResonanceMonitor } from './ResonanceMonitor';
import { StasisChamber } from './StasisChamber';
import styles from '../page.module.css';

const dmMono = DM_Mono({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-mono' });
const archivoNarrow = Archivo_Narrow({ subsets: ['latin'], weight: ['700'], variable: '--font-display' });

/* ── Animated entrance wrapper ── */

function AnimatedCard({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const [key, setKey] = useState(0);
  const replay = useCallback(() => setKey((k) => k + 1), []);
  const isReplay = key > 0;

  return (
    <motion.div
      key={key}
      className={className}
      style={{ height: '100%' }}
      onClick={replay}
      initial={isReplay ? { scale: 0.96 } : { opacity: 0, y: 14 }}
      animate={isReplay ? { scale: 1 } : { opacity: 1, y: 0 }}
      transition={
        isReplay
          ? { type: 'spring', damping: 12, stiffness: 300 }
          : { type: 'spring', damping: 20, stiffness: 200, delay }
      }
    >
      {children}
    </motion.div>
  );
}

/* ── Content ── */

export function RetroBentoContent() {
  return (
    <div className={`${styles.page} ${dmMono.variable} ${archivoNarrow.variable}`}>
      <div className={styles.grid}>
        <AnimatedCard delay={0}><TemporalGauge /></AnimatedCard>
        <AnimatedCard delay={0.08}><FluxCapacitor /></AnimatedCard>
        <AnimatedCard delay={0.16}><SpectralAnalyzer /></AnimatedCard>
        <AnimatedCard delay={0.24}><NeuralGrid /></AnimatedCard>
        <AnimatedCard delay={0.32}><EntropyEngine /></AnimatedCard>
        <AnimatedCard delay={0.40}><PhaseScope /></AnimatedCard>
        <AnimatedCard delay={0.48}><MemoryBank /></AnimatedCard>
        <AnimatedCard delay={0.56}><ResonanceMonitor /></AnimatedCard>
        <AnimatedCard delay={0.64}><StasisChamber /></AnimatedCard>
      </div>
    </div>
  );
}
