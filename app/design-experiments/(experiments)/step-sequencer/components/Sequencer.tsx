'use client'

import { useStepSequencer, type SequencerController } from '../hooks/useStepSequencer'
import { ROW_DEFS } from '../lib/rows'
import { LEAD_TONES, BASS_TONES } from '../lib/voices'
import styles from './Sequencer.module.css'

type Props = {
  controller?: SequencerController
}

export function Sequencer({ controller }: Props) {
  const internal = useStepSequencer()
  const ctrl = controller ?? internal
  const {
    grid, toggleCell, clearAll, randomize, playing, setPlaying, bpm, setBpm, currentStep,
    leadTone, bassTone, setLeadTone, setBassTone, swing, setSwing,
  } = ctrl

  return (
    <div className={styles.device}>
      <div className={styles.top}>
        <span className={styles.label}>STEP SEQUENCER · 16×11 · TECHNO</span>
        <div className={styles.tones}>
          <div className={styles.segmented} role="radiogroup" aria-label="Lead tone">
            {LEAD_TONES.map(t => (
              <button
                type="button"
                key={t}
                role="radio"
                aria-checked={leadTone === t}
                className={`${styles.segment} ${styles.segmentLead} ${leadTone === t ? styles.segmentOn : ''}`}
                onClick={() => setLeadTone(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
          <div className={styles.segmented} role="radiogroup" aria-label="Bass tone">
            {BASS_TONES.map(t => (
              <button
                type="button"
                key={t}
                role="radio"
                aria-checked={bassTone === t}
                className={`${styles.segment} ${styles.segmentBass} ${bassTone === t ? styles.segmentOn : ''}`}
                onClick={() => setBassTone(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.grid} role="grid" aria-label="Step sequencer grid">
        {grid.map((row, r) => {
          const def = ROW_DEFS[r]
          if (!def) return null
          const rowCls = [styles.row]
          if (r > 0 && def.section !== ROW_DEFS[r - 1].section) rowCls.push(styles.sectionStart)
          return (
            <div className={rowCls.join(' ')} role="row" key={r} style={{ ['--row-hue' as string]: def.hue }}>
              <span className={styles.rowLabel} aria-hidden>{def.label}</span>
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
                    aria-label={`${def.label} step ${c + 1}`}
                    role="gridcell"
                    onClick={() => toggleCell(r, c)}
                  />
                )
              })}
            </div>
          )
        })}
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

        <label className={styles.swing}>
          <span className={styles.bpmReadout}>{Math.round(swing * 100)}</span>
          <span className={styles.bpmUnit}>SWING</span>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={Math.round(swing * 100)}
            onChange={e => setSwing(Number(e.target.value) / 100)}
            aria-label="Swing amount"
          />
        </label>

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
