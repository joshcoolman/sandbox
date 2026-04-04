'use client'

import { useRef } from 'react'
import type { CameraState } from '../types'
import styles from './CameraView.module.css'

export interface CameraViewProps {
  src: string | null
  cam: CameraState
  generating?: boolean
  onImage: (src: string | null) => void
}

export function CameraView({ src, cam, generating = false, onImage }: CameraViewProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const load = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const rotRad = (cam.rotate * Math.PI) / 180
  const isFrontFacing = Math.cos(rotRad) > 0

  return (
    <div className={styles.cameraView}>
      <div className={`${styles.inner} ${generating ? styles.generating : ''}`}>
        {/* The plane: either showing image (front) or gray (back) */}
        <div
          className={styles.plane}
          style={{
            transform: `perspective(200px) rotateY(${cam.rotate}deg) rotateX(${-cam.vertical}deg) scale(${1.5 - (cam.zoom - 1) * 0.12})`,
          }}
        >
          {/* Front face */}
          <div className={`${styles.front} ${!isFrontFacing ? styles.faceHidden : ''}`}>
            {src ? (
              <img src={src} alt="Front" className={styles.faceImg} />
            ) : (
              <div className={styles.faceEmpty}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
          </div>
          {/* Back face */}
          <div className={`${styles.back} ${isFrontFacing ? styles.faceHidden : ''}`}>
            <div className={styles.backInner} />
          </div>
        </div>

        <div className={styles.grid} />

        {/* Upload / clear controls */}
        {src ? (
          <button className={styles.clearBtn} onClick={() => onImage(null)}>✕</button>
        ) : (
          <button className={styles.uploadBtn} onClick={() => inputRef.current?.click()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}

        {generating && (
          <div className={styles.scan}>
            <div className={styles.scanLine} />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && load(e.target.files[0])}
      />
      <div className={styles.readout}>
        {Math.round(cam.rotate)}° · {Math.round(cam.vertical)}° · ×{cam.zoom.toFixed(1)}
        {!isFrontFacing && <span className={styles.backLabel}> · BACK</span>}
      </div>
    </div>
  )
}
