'use client'

import styles from './ParamSlider.module.css'

export interface ParamSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
  accent?: string
}

export function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => String(v),
  accent = 'var(--cr-text-dim)',
}: ParamSliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className={styles.slider}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value} style={{ color: accent }}>{format(value)}</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%`, background: accent }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className={styles.input}
        />
      </div>
    </div>
  )
}
