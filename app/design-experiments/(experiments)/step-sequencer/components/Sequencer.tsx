'use client'

import { useStepSequencer, type SequencerController } from '../hooks/useStepSequencer'
import styles from './Sequencer.module.css'

const ROW_HUES = [340, 320, 295, 270, 250, 230, 215, 200]
const ROW_LABELS = ['E5', 'D5', 'C5', 'A4', 'G4', 'E4', 'D4', 'C4']

type Props = {
  controller?: SequencerController
}

export function Sequencer({ controller }: Props) {
  const internal = useStepSequencer()
  const ctrl = controller ?? internal
  const { grid, toggleCell, clearAll, randomize, playing, setPlaying, bpm, setBpm, currentStep } = ctrl

  return (
    <div className={styles.device}>
      <div className={styles.top}>
        <span className={styles.label}>STEP SEQUENCER · 16×8 · PENTATONIC</span>
      </div>

      <div className={styles.grid} role="grid" aria-label="Step sequencer grid">
        {grid.map((row, r) => (
          <div className={styles.row} role="row" key={r} style={{ ['--row-hue' as string]: ROW_HUES[r] }}>
            <span className={styles.rowLabel} aria-hidden>{ROW_LABELS[r]}</span>
            {row.map((on, c) => {
              const cls = [styles.pad]
              if (on) cls.push(styles.padOn)
              if (c % 4 === 0 && c !== 0) cls.push(styles.barStart)
              return (
                <button
                  type="button"
                  key={c}
                  className={cls.join(' ')}
                  data-current={currentStep === c ? 'true' : 'false'}
                  aria-pressed={on}
                  aria-label={`${ROW_LABELS[r]} step ${c + 1}`}
                  role="gridcell"
                  onClick={() => toggleCell(r, c)}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className={styles.transport}>
        <button
          type="button"
          className={`${styles.play} ${playing ? styles.playOn : ''}`}
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          <span aria-hidden>{playing ? '⏸' : '▶'}</span>
        </button>

        <button
          type="button"
          className={styles.generate}
          onClick={randomize}
          aria-label="Generate random pattern"
        >
          <span className={styles.generateGlyph} aria-hidden>✦</span>
          GENERATE
        </button>

        <button
          type="button"
          className={styles.clear}
          onClick={clearAll}
          aria-label="Clear all"
        >
          CLEAR
        </button>

        <label className={styles.bpm}>
          <span className={styles.bpmReadout}>{bpm}</span>
          <span className={styles.bpmUnit}>BPM</span>
          <input
            type="range"
            min={60}
            max={180}
            step={1}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            aria-label="Tempo in beats per minute"
          />
        </label>
      </div>
    </div>
  )
}
