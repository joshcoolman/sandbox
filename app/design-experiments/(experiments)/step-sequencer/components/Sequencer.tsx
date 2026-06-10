'use client'

import { useState } from 'react'
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
    grid, toggleCell, clearAll, randomize, ludicrous, playing, setPlaying, bpm, setBpm, currentStep,
    leadTone, bassTone, setLeadTone, setBassTone,
  } = ctrl

  const [bpmOpen, setBpmOpen] = useState(false)

  const commitBpm = (raw: string) => {
    const n = Number(raw)
    if (Number.isFinite(n)) setBpm(Math.max(60, Math.min(180, Math.round(n))))
  }

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
          aria-label="Generate random pattern and play"
        >
          <span className={styles.generateGlyph} aria-hidden>✦</span>
          GENERATE
        </button>

        <button
          type="button"
          className={styles.generate}
          onClick={ludicrous}
          aria-label="Generate a ludicrous random pattern and play"
        >
          LUDICROUS
        </button>

        <button
          type="button"
          className={styles.clear}
          onClick={clearAll}
          aria-label="Clear all"
        >
          CLEAR
        </button>

        <div className={styles.bpm}>
          <button
            type="button"
            className={styles.bpmButton}
            onClick={() => setBpmOpen(o => !o)}
            aria-haspopup="dialog"
            aria-expanded={bpmOpen}
            aria-label="Tempo in beats per minute"
          >
            <span className={styles.bpmReadout}>{bpm}</span>
            <span className={styles.bpmUnit}>BPM</span>
          </button>
          {bpmOpen && (
            <div className={styles.bpmPopover} role="dialog" aria-label="Set tempo">
              <input
                type="number"
                className={styles.bpmInput}
                min={60}
                max={180}
                step={1}
                defaultValue={bpm}
                autoFocus
                onFocus={e => e.currentTarget.select()}
                onChange={e => commitBpm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    commitBpm(e.currentTarget.value)
                    setBpmOpen(false)
                  } else if (e.key === 'Escape') {
                    setBpmOpen(false)
                  }
                }}
                onBlur={e => {
                  commitBpm(e.currentTarget.value)
                  setBpmOpen(false)
                }}
                aria-label="Tempo in beats per minute"
              />
              <span className={styles.bpmUnit}>BPM</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
