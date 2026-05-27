'use client'

import { useStepSequencer } from '../hooks/useStepSequencer'

const ROW_HUES = [340, 320, 295, 270, 250, 230, 215, 200]
const ROW_LABELS = ['E5', 'D5', 'C5', 'A4', 'G4', 'E4', 'D4', 'C4']

export function Sequencer() {
  const { grid, toggleCell, clearAll, playing, setPlaying, bpm, setBpm, currentStep } =
    useStepSequencer()

  return (
    <div className="seq-stage">
      <div className="seq-device">
        <div className="seq-top">
          <span className="seq-label">STEP SEQUENCER · 16×8 · PENTATONIC</span>
        </div>

        <div className="seq-grid" role="grid" aria-label="Step sequencer grid">
          {grid.map((row, r) => (
            <div className="seq-row" role="row" key={r} style={{ ['--row-hue' as string]: ROW_HUES[r] }}>
              <span className="seq-row-label" aria-hidden>{ROW_LABELS[r]}</span>
              {row.map((on, c) => (
                <button
                  type="button"
                  key={c}
                  className={`seq-pad ${on ? 'is-on' : ''} ${c % 4 === 0 && c !== 0 ? 'is-bar-start' : ''}`}
                  data-current={currentStep === c ? 'true' : 'false'}
                  aria-pressed={on}
                  aria-label={`${ROW_LABELS[r]} step ${c + 1}`}
                  role="gridcell"
                  onClick={() => toggleCell(r, c)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="seq-transport">
          <button
            type="button"
            className={`seq-play ${playing ? 'is-playing' : ''}`}
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            <span aria-hidden>{playing ? '⏸' : '▶'}</span>
          </button>

          <button
            type="button"
            className="seq-clear"
            onClick={clearAll}
            aria-label="Clear all"
          >
            CLEAR
          </button>

          <label className="seq-bpm">
            <span className="seq-bpm-readout">{bpm}</span>
            <span className="seq-bpm-unit">BPM</span>
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
    </div>
  )
}
