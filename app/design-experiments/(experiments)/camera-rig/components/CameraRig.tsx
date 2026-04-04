'use client'

import { useState, useCallback } from 'react'
import type { CameraState } from '../types'
import { DEFAULT_CAMERA } from '../types'
import { Viewport3D } from './Viewport3D'
import { CameraView } from './CameraView'
import { ParamSlider } from './ParamSlider'
import styles from './CameraRig.module.css'

export interface CameraRigProps {
  /** Initial camera state. Defaults to `{ rotate: 41, vertical: 0, zoom: 5 }`. */
  initialCamera?: CameraState
  /** Called when the user clicks "Generate View". Receives the current camera state. */
  onGenerate?: (cam: CameraState) => void
  /** Duration (ms) of the generating animation. Default 2800. */
  generateDuration?: number
  /** Additional class name applied to root element. */
  className?: string
}

export function CameraRig({
  initialCamera = DEFAULT_CAMERA,
  onGenerate,
  generateDuration = 2800,
  className,
}: CameraRigProps) {
  const [cam, setCam] = useState<CameraState>(initialCamera)
  const [src, setSrc] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const update = useCallback((p: Partial<CameraState>) => setCam(c => ({ ...c, ...p })), [])

  const handleGenerate = () => {
    if (!src) return
    setGenerating(true)
    onGenerate?.(cam)
    setTimeout(() => setGenerating(false), generateDuration)
  }

  return (
    <div className={`${styles.root} ${className ?? ''}`}>
      <div className={styles.layout}>
        {/* Left: 3D viewport */}
        <div className={styles.main}>
          <Viewport3D cam={cam} onUpdate={update} sourceImage={src} />
        </div>

        {/* Right: stacked panels */}
        <div className={styles.sidebar}>
          {/* Camera View */}
          <div className={styles.sidePanel}>
            <div className={styles.panelLabel}>CAMERA VIEW</div>
            <CameraView src={src} cam={cam} generating={generating} onImage={setSrc} />
          </div>

          {/* Camera Parameters */}
          <div className={styles.sidePanel}>
            <div className={styles.panelLabel}>CAMERA PARAMETERS</div>
            <ParamSlider
              label="ROTATE" value={cam.rotate} min={-180} max={180} step={1}
              onChange={(v) => update({ rotate: v })}
              format={(v) => `${v >= 0 ? '+' : ''}${Math.round(v)}°`}
              accent="var(--cr-blue)"
            />
            <ParamSlider
              label="ANGLE" value={cam.vertical} min={-90} max={90} step={1}
              onChange={(v) => update({ vertical: v })}
              format={(v) => `${Math.round(v)}°`}
              accent="var(--cr-purple)"
            />
            <ParamSlider
              label="DISTANCE" value={cam.zoom} min={1} max={10} step={0.1}
              onChange={(v) => update({ zoom: v })}
              format={(v) => v.toFixed(1)}
              accent="var(--cr-text-dim)"
            />
          </div>

          {/* Output */}
          <div className={styles.sidePanel}>
            <div className={styles.panelLabel}>OUTPUT</div>
            <pre className={styles.json}>{JSON.stringify({
              rotate_deg: Math.round(cam.rotate),
              vertical_deg: Math.round(cam.vertical),
              distance: +cam.zoom.toFixed(1),
            }, null, 2)}</pre>
            <button
              className={`${styles.genBtn} ${generating ? styles.genBtnBusy : ''}`}
              disabled={!src || generating}
              onClick={handleGenerate}
            >
              {generating ? <><span className={styles.spin} /> GENERATING…</> : 'GENERATE VIEW'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
