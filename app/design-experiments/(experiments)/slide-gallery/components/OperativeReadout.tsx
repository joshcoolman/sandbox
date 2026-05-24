'use client'

import { DecodeText } from '@/app/components/DecodeText'
import { getDossier } from '../data/operatives'

const ROW_BASE = 540
const ROW_STEP = 110

export function OperativeReadout({ src }: { src: string }) {
  const d = getDossier(src)
  if (!d) return null

  return (
    <div className="op-readout" aria-hidden="true">
      <div className="op-readout-inner">
        <div className="op-label">
          <DecodeText text={d.label} delay={150} />
          <span className="op-cursor" />
        </div>
        <div className="op-codename">
          <DecodeText text={d.codename} delay={300} />
        </div>
        <div className="op-class">
          <DecodeText text={d.classification} delay={420} />
        </div>
        <div className="op-rows">
          {d.rows.map((r, i) => (
            <div className="op-row" key={r.k}>
              <span className="op-k">
                <DecodeText text={r.k} delay={ROW_BASE + i * ROW_STEP} />
              </span>
              <span className="op-v">
                <DecodeText text={r.v} delay={ROW_BASE + i * ROW_STEP + 40} />
              </span>
            </div>
          ))}
        </div>
        <div className="op-ref">
          <DecodeText text={d.ref} delay={ROW_BASE + d.rows.length * ROW_STEP} />
        </div>
      </div>
    </div>
  )
}
