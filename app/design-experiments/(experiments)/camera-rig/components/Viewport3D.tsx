'use client'

import { useRef, useMemo } from 'react'
import type { CameraState } from '../types'
import { clamp } from '../types'
import styles from './Viewport3D.module.css'

export interface Viewport3DProps {
  cam: CameraState
  onUpdate: (partial: Partial<CameraState>) => void
  sourceImage?: string | null
}

/* ── 3D→2D Projection ─────────────────────── */
const VIEW_AZ = -0.4
const VIEW_EL = 0.55
const COS_AZ = Math.cos(VIEW_AZ), SIN_AZ = Math.sin(VIEW_AZ)
const COS_EL = Math.cos(VIEW_EL), SIN_EL = Math.sin(VIEW_EL)

function project(x: number, y: number, z: number): [number, number] {
  const rx = x * COS_AZ + z * SIN_AZ
  const rz = -x * SIN_AZ + z * COS_AZ
  return [rx, -(y * COS_EL - rz * SIN_EL)]
}

const CX = 400, CY = 300
const BASE_R = 60, MAX_R = 180

function orbitRadius(zoom: number) {
  return BASE_R + ((zoom - 1) / 9) * (MAX_R - BASE_R)
}

export function Viewport3D({ cam, onUpdate, sourceImage = null }: Viewport3DProps) {
  const dragging = useRef<'none' | 'rotate' | 'vertical'>('none')
  const lastPos = useRef({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  const onSphereDown = (which: 'rotate' | 'vertical') => (e: React.PointerEvent) => {
    e.stopPropagation()
    dragging.current = which
    lastPos.current = { x: e.clientX, y: e.clientY }
    svgRef.current?.setPointerCapture(e.pointerId)
  }
  const onSvgPointerMove = (e: React.PointerEvent) => {
    if (dragging.current === 'none') return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    if (dragging.current === 'rotate') {
      onUpdate({ rotate: Math.round(clamp(cam.rotate + dx * 0.8, -180, 180)) })
    } else {
      onUpdate({ vertical: Math.round(clamp(cam.vertical - dy * 0.5, -90, 90)) })
    }
  }
  const onSvgPointerUp = () => { dragging.current = 'none' }

  const R = orbitRadius(cam.zoom)
  const azRad = (cam.rotate * Math.PI) / 180
  const elRad = (cam.vertical * Math.PI) / 180

  // Grid (static)
  const gridLines = useMemo(() => {
    const lines: string[] = []
    const gridRange = 5, gridStep = 40
    for (let i = -gridRange; i <= gridRange; i++) {
      const p1 = project(i * gridStep, 0, -gridRange * gridStep)
      const p2 = project(i * gridStep, 0, gridRange * gridStep)
      lines.push(`M${CX + p1[0]},${CY + p1[1]} L${CX + p2[0]},${CY + p2[1]}`)
      const p3 = project(-gridRange * gridStep, 0, i * gridStep)
      const p4 = project(gridRange * gridStep, 0, i * gridStep)
      lines.push(`M${CX + p3[0]},${CY + p3[1]} L${CX + p4[0]},${CY + p4[1]}`)
    }
    return lines
  }, [])

  // Blue ring
  const blueRingPath = useMemo(() => {
    const pts: [number, number][] = []
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2
      const [sx, sy] = project(Math.sin(a) * R, 0, Math.cos(a) * R)
      pts.push([CX + sx, CY + sy])
    }
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z'
  }, [R])

  // Blue sphere
  const [blueSx, blueSy] = project(Math.sin(azRad) * R, 0, Math.cos(azRad) * R)
  const blueScreen = [CX + blueSx, CY + blueSy] as const

  // Purple half-circle
  const purpleArcPath = useMemo(() => {
    const pts: [number, number][] = []
    for (let i = 0; i <= 60; i++) {
      const a = ((i / 60) - 0.5) * Math.PI
      const [sx, sy] = project(0, Math.sin(a) * R, Math.cos(a) * R)
      pts.push([CX + sx, CY + sy])
    }
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  }, [R])

  // Purple sphere
  const [purpleSx, purpleSy] = project(0, Math.sin(elRad) * R, Math.cos(elRad) * R)
  const purpleScreen = [CX + purpleSx, CY + purpleSy] as const

  // Active purple segment
  const purpleActivePath = useMemo(() => {
    const pts: [number, number][] = []
    const steps = Math.max(4, Math.ceil(Math.abs(cam.vertical) / 2))
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * elRad
      const [sx, sy] = project(0, Math.sin(a) * R, Math.cos(a) * R)
      pts.push([CX + sx, CY + sy])
    }
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  }, [R, elRad, cam.vertical])

  // Image card
  const cardW = 40, cardH = 55
  const cardCorners = [
    project(-cardW / 2, cardH, 0),
    project(cardW / 2, cardH, 0),
    project(cardW / 2, 0, 0),
    project(-cardW / 2, 0, 0),
  ].map(([sx, sy]) => [CX + sx, CY + sy] as [number, number])

  const cardXs = cardCorners.map(c => c[0])
  const cardYs = cardCorners.map(c => c[1])
  const cardBBox = {
    x: Math.min(...cardXs), y: Math.min(...cardYs),
    w: Math.max(...cardXs) - Math.min(...cardXs),
    h: Math.max(...cardYs) - Math.min(...cardYs),
  }

  return (
    <div className={styles.viewport}>
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        className={styles.svg}
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp}
      >
        <defs>
          <radialGradient id="purple-grad" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#c4b0ff" />
            <stop offset="50%" stopColor="#8b6cf6" />
            <stop offset="100%" stopColor="#5a3db8" />
          </radialGradient>
          <radialGradient id="blue-grad" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#7bbfff" />
            <stop offset="50%" stopColor="#4a8ef7" />
            <stop offset="100%" stopColor="#2a5094" />
          </radialGradient>
          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="card-clip">
            <polygon points={cardCorners.map(p => p.join(',')).join(' ')} />
          </clipPath>
        </defs>

        {/* Grid floor */}
        <g opacity="0.15">
          {gridLines.map((d, i) => (
            <path key={i} d={d} stroke="var(--cr-blue)" strokeWidth="0.5" fill="none" />
          ))}
        </g>

        {/* Blue orbit ring */}
        <path d={blueRingPath} fill="none" stroke="var(--cr-blue)" strokeWidth="3" opacity="0.5" />
        <path d={blueRingPath} fill="none" stroke="var(--cr-blue)" strokeWidth="6" opacity="0.08" />

        {/* Image card */}
        {sourceImage ? (
          <g clipPath="url(#card-clip)">
            <image href={sourceImage} x={cardBBox.x} y={cardBBox.y}
              width={cardBBox.w} height={cardBBox.h} preserveAspectRatio="xMidYMid slice" />
          </g>
        ) : (
          <polygon points={cardCorners.map(p => p.join(',')).join(' ')}
            fill="var(--cr-surface-2)" stroke="var(--cr-border)" strokeWidth="1.5" />
        )}
        <polygon points={cardCorners.map(p => p.join(',')).join(' ')}
          fill="none" stroke={sourceImage ? 'rgba(255,255,255,0.15)' : 'var(--cr-border)'} strokeWidth="1.5" />
        {!sourceImage && (
          <g opacity="0.3">
            <rect x={CX - 12} y={CY - 30} width="24" height="18" rx="2"
              fill="none" stroke="var(--cr-text-dim)" strokeWidth="1" />
            <circle cx={CX - 5} cy={CY - 24} r="2" fill="none" stroke="var(--cr-text-dim)" strokeWidth="0.8" />
            <path d={`M${CX + 8},${CY - 18} L${CX + 2},${CY - 22} L${CX - 8},${CY - 14}`}
              fill="none" stroke="var(--cr-text-dim)" strokeWidth="0.8" />
          </g>
        )}

        {/* Purple half-circle */}
        <path d={purpleArcPath} fill="none" stroke="var(--cr-purple)" strokeWidth="3" opacity="0.3" />
        <path d={purpleArcPath} fill="none" stroke="var(--cr-purple)" strokeWidth="6" opacity="0.05" />
        <path d={purpleActivePath} fill="none" stroke="var(--cr-purple)" strokeWidth="4" opacity="0.7" strokeLinecap="round" />

        {/* Blue sphere — draggable */}
        <g className={styles.sphereHandle} onPointerDown={onSphereDown('rotate')}>
          <circle cx={blueScreen[0]} cy={blueScreen[1]} r="24" fill="transparent" />
          <circle cx={blueScreen[0]} cy={blueScreen[1]} r="12" fill="url(#blue-grad)" filter="url(#glow-blue)" />
        </g>

        {/* Purple sphere — draggable */}
        <g className={styles.sphereHandle} onPointerDown={onSphereDown('vertical')}>
          <circle cx={purpleScreen[0]} cy={purpleScreen[1]} r="24" fill="transparent" />
          <circle cx={purpleScreen[0]} cy={purpleScreen[1]} r="12" fill="url(#purple-grad)" filter="url(#glow-purple)" />
        </g>
      </svg>
    </div>
  )
}
