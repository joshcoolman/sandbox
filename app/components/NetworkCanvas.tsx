'use client'

import { useEffect, useRef } from 'react'

interface NetworkCanvasProps {
  className?: string
}

interface CanvasNode {
  baseX: number
  baseY: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  noiseOffsetX: number
  noiseOffsetY: number
  mass: number
  affectedByBlast: boolean
  lastBlastTime: number
  recoveryDelay: number
}

interface Organism {
  centerX: number
  centerY: number
  baseX: number
  baseY: number
  nodes: CanvasNode[]
  vx: number
  vy: number
  connections: number[][]
  noiseSeed: number
  lastNoiseChange: number
  noiseChangeInterval: number
}

interface BlastAnimation {
  x: number
  y: number
  startTime: number
  radius: number
  maxRadius: number
  duration: number
  blastForce: number
  blastDelay: number
  blastSpeed: number
}

export default function NetworkCanvas({ className }: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasElement = canvasRef.current
    if (!canvasElement) return

    const maybeCtx = canvasElement.getContext('2d')
    if (!maybeCtx) return
    const ctx: CanvasRenderingContext2D = maybeCtx

    let width = window.innerWidth
    let height = window.innerHeight
    let animationFrameId: number
    let animations: BlastAnimation[] = []

    function resize() {
      if (!canvasElement) return
      width = window.innerWidth
      height = window.innerHeight
      canvasElement.width = width
      canvasElement.height = height
    }

    function noise(x: number, y: number, seed = 0) {
      x = x * 0.01 + seed
      y = y * 0.01 + seed
      return (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
    }

    window.addEventListener('resize', resize)
    resize()

    const organisms: Organism[] = []
    const NUM_ORGANISMS = 9
    const NODES_PER_ORGANISM = 57
    const CLUSTER_RADIUS = 500
    const rotationSpeed = 0.0001745

    const gridSize = Math.ceil(Math.sqrt(NUM_ORGANISMS))
    const cellWidth = width / gridSize
    const cellHeight = height / gridSize

    for (let i = 0; i < NUM_ORGANISMS; i++) {
      const gridX = i % gridSize
      const gridY = Math.floor(i / gridSize)
      const centerX = cellWidth * (gridX + 0.3 + Math.random() * 0.4)
      const centerY = cellHeight * (gridY + 0.3 + Math.random() * 0.4)

      const nodes: CanvasNode[] = []
      for (let j = 0; j < NODES_PER_ORGANISM; j++) {
        const angle = Math.random() * 2 * Math.PI
        const radius = Math.random() * CLUSTER_RADIUS
        const baseX = radius * Math.cos(angle)
        const baseY = radius * Math.sin(angle)

        nodes.push({
          baseX,
          baseY,
          x: centerX + baseX,
          y: centerY + baseY,
          vx: 0,
          vy: 0,
          size: 1.5 + Math.random() * 2,
          noiseOffsetX: Math.random() * 2000,
          noiseOffsetY: Math.random() * 2000,
          mass: 2.0,
          affectedByBlast: false,
          lastBlastTime: 0,
          recoveryDelay: 33 + Math.random() * 133
        })
      }

      const connections: number[][] = []
      for (let k = 0; k < nodes.length; k++) {
        for (let l = k + 1; l < nodes.length; l++) {
          if (Math.random() < 0.2) connections.push([k, l])
        }
      }

      organisms.push({
        centerX,
        centerY,
        baseX: centerX,
        baseY: centerY,
        nodes,
        vx: 0.1 * (Math.random() * 2 - 1),
        vy: 0.1 * (Math.random() * 2 - 1),
        connections,
        noiseSeed: Math.random() * 1000,
        lastNoiseChange: 0,
        noiseChangeInterval: 800 + Math.random() * 1000
      })
    }

    function handleClick(e: MouseEvent) {
      animations.push({
        x: e.clientX,
        y: e.clientY,
        startTime: performance.now(),
        radius: 0,
        maxRadius: 437,
        duration: 1333,
        blastForce: 12.5,
        blastDelay: 125,
        blastSpeed: 0.85
      })
    }

    document.addEventListener('click', handleClick)

    let startTime = 0
    const MAX_DISTANCE = 190
    const MAX_DISTANCE_SQ = MAX_DISTANCE * MAX_DISTANCE
    const EDGE_THRESHOLD = 10
    const EDGE_THRESHOLD_SQ = EDGE_THRESHOLD * EDGE_THRESHOLD
    const fixedSpeed = 0.12
    const TWO_PI = 2 * Math.PI
    const INV_MASS = 1 / 2.0

    function animate(timestamp: number) {
      if (startTime === 0) startTime = timestamp

      const rotationAngle = (timestamp * rotationSpeed) % TWO_PI
      const cosRot = Math.cos(rotationAngle)
      const sinRot = Math.sin(rotationAngle)
      const screenCenterX = width / 2
      const screenCenterY = height / 2

      ctx.clearRect(0, 0, width, height)

      // --- Update organisms and draw intra-organism edges ---
      ctx.strokeStyle = "#8FD0FFFF"
      ctx.lineWidth = 0.5

      for (const org of organisms) {
        if (timestamp - org.lastNoiseChange > org.noiseChangeInterval) {
          org.noiseSeed = Math.random() * 4000000
          org.lastNoiseChange = timestamp
          org.noiseChangeInterval = 5000 + Math.random() * 100000
        }

        const noiseX = noise(org.noiseSeed, timestamp * 0.0005 * fixedSpeed)
        const noiseY = noise(org.noiseSeed + 1000, timestamp * 0.0005 * fixedSpeed)
        const desiredVx = (noiseX * 2 - 1) * 1.5 * fixedSpeed
        const desiredVy = (noiseY * 2 - 1) * 1.5 * fixedSpeed

        org.vx += (desiredVx - org.vx) * 0.05
        org.vy += (desiredVy - org.vy) * 0.05

        if (Math.abs(org.vx) < 0.1) org.vx = org.vx < 0 ? -0.1 : 0.1
        if (Math.abs(org.vy) < 0.1) org.vy = org.vy < 0 ? -0.1 : 0.1

        const edgeBuffer = width * 0.3
        if (org.baseX < edgeBuffer) org.vx += 0.1 * fixedSpeed
        else if (org.baseX > width - edgeBuffer) org.vx -= 0.1 * fixedSpeed
        if (org.baseY < edgeBuffer) org.vy += 0.1 * fixedSpeed
        else if (org.baseY > height - edgeBuffer) org.vy -= 0.1 * fixedSpeed

        org.vx *= 0.98
        org.vy *= 0.98

        org.baseX += org.vx
        org.baseY += org.vy

        const padding = 100
        if (org.baseX < padding) {
          org.vx = Math.abs(org.vx) * 1.5
          org.baseX = padding
        } else if (org.baseX > width - padding) {
          org.vx = -Math.abs(org.vx) * 1.5
          org.baseX = width - padding
        }
        if (org.baseY < padding) {
          org.vy = Math.abs(org.vy) * 1.5
          org.baseY = padding
        } else if (org.baseY > height - padding) {
          org.vy = -Math.abs(org.vy) * 1.5
          org.baseY = height - padding
        }

        // Apply global rotation
        const vx = org.baseX - screenCenterX
        const vy = org.baseY - screenCenterY
        org.centerX = screenCenterX + vx * cosRot - vy * sinRot
        org.centerY = screenCenterY + vx * sinRot + vy * cosRot

        // Update nodes
        for (const node of org.nodes) {
          const nodeNoiseX = noise(node.noiseOffsetX + timestamp * 0.001 * fixedSpeed, 0)
          const nodeNoiseY = noise(node.noiseOffsetY + timestamp * 0.001 * fixedSpeed, 0)

          const targetX = org.centerX + node.baseX + (nodeNoiseX * 2 - 1) * 50
          const targetY = org.centerY + node.baseY + (nodeNoiseY * 2 - 1) * 50

          const timeSinceBlast = node.affectedByBlast ? timestamp - node.lastBlastTime : Infinity

          let springForce = 0.05
          let damping = 0.95

          if (timeSinceBlast < node.recoveryDelay) {
            const stunRecoveryFactor = timeSinceBlast / node.recoveryDelay
            springForce = springForce * stunRecoveryFactor * 0.6
            damping = 0.97

            if (timeSinceBlast >= node.recoveryDelay) {
              node.affectedByBlast = false
            }
          } else {
            const velocityMagnitude = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
            springForce = springForce * (1 + Math.min(2, velocityMagnitude / 5)) * 3.0
          }

          springForce = springForce * INV_MASS

          const dx = targetX - node.x
          const dy = targetY - node.y
          const distSq = dx * dx + dy * dy

          if (distSq > 0) {
            const dist = Math.sqrt(distSq)
            const recoveryMultiplier = Math.min(3, Math.max(1, dist / 100))
            const invDist = 1 / dist
            node.vx += dx * invDist * springForce * recoveryMultiplier
            node.vy += dy * invDist * springForce * recoveryMultiplier
          }

          node.vx *= damping
          node.vy *= damping
          node.x += node.vx
          node.y += node.vy
        }

        // Batch intra-organism edges by opacity bucket (10 buckets)
        const buckets: { ax: number; ay: number; bx: number; by: number }[][] = []
        for (let b = 0; b < 10; b++) buckets.push([])

        for (const [i, j] of org.connections) {
          const nodeA = org.nodes[i]
          const nodeB = org.nodes[j]
          const dx = nodeA.x - nodeB.x
          const dy = nodeA.y - nodeB.y
          const distSq = dx * dx + dy * dy
          if (distSq >= MAX_DISTANCE_SQ) continue
          const distance = Math.sqrt(distSq)
          const opacity = 1 - distance / MAX_DISTANCE
          const bucket = Math.min(9, Math.floor(opacity * 10))
          buckets[bucket].push({ ax: nodeA.x, ay: nodeA.y, bx: nodeB.x, by: nodeB.y })
        }

        for (let b = 0; b < 10; b++) {
          const edges = buckets[b]
          if (edges.length === 0) continue
          ctx.globalAlpha = (b + 0.5) / 10
          ctx.beginPath()
          for (const edge of edges) {
            ctx.moveTo(edge.ax, edge.ay)
            ctx.lineTo(edge.bx, edge.by)
          }
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
      }

      // --- Inter-organism edges (only check neighboring organisms) ---
      ctx.strokeStyle = "#4094D0FF"
      ctx.lineWidth = 0.5

      const interPath = new Path2D()
      let hasInterEdges = false

      for (let i = 0; i < organisms.length; i++) {
        const orgA = organisms[i]
        for (let j = i + 1; j < organisms.length; j++) {
          const orgB = organisms[j]

          // Skip organism pairs whose centers are too far apart
          const cdx = orgA.centerX - orgB.centerX
          const cdy = orgA.centerY - orgB.centerY
          const centerDistSq = cdx * cdx + cdy * cdy
          const maxPairDist = CLUSTER_RADIUS + EDGE_THRESHOLD
          if (centerDistSq > maxPairDist * maxPairDist) continue

          for (const nodeA of orgA.nodes) {
            for (const nodeB of orgB.nodes) {
              const dx = nodeA.x - nodeB.x
              const dy = nodeA.y - nodeB.y
              const distSq = dx * dx + dy * dy
              if (distSq < EDGE_THRESHOLD_SQ) {
                interPath.moveTo(nodeA.x, nodeA.y)
                interPath.lineTo(nodeB.x, nodeB.y)
                hasInterEdges = true
              }
            }
          }
        }
      }

      if (hasInterEdges) {
        ctx.globalAlpha = 0.5
        ctx.stroke(interPath)
        ctx.globalAlpha = 1.0
      }

      // --- Draw all nodes in a single batched path ---
      ctx.fillStyle = "#8FF7F9FF"
      ctx.beginPath()
      for (const org of organisms) {
        for (const node of org.nodes) {
          const radius = node.size / 3
          if (radius > 0) {
            ctx.moveTo(node.x + radius, node.y)
            ctx.arc(node.x, node.y, radius, 0, TWO_PI)
          }
        }
      }
      ctx.fill()

      // --- Blast animations ---
      const currentAnimations = [...animations]
      animations = []

      for (const anim of currentAnimations) {
        const elapsed = timestamp - anim.startTime
        const progress = Math.min(1, elapsed / anim.duration)

        const easedProgress = 1 - Math.pow(1 - progress, 3)
        const currentRadius = anim.maxRadius * easedProgress
        const halfRadiusProgress = currentRadius / anim.maxRadius >= 0.5

        const opacityProgress = Math.min(1, progress / 0.8)
        const opacity = 0.2 * (1 - opacityProgress)

        if (opacity > 0 && currentRadius > 0) {
          ctx.beginPath()
          ctx.arc(anim.x, anim.y, Math.max(0, currentRadius), 0, TWO_PI)
          ctx.fillStyle = `rgba(64, 148, 208, ${opacity})`
          ctx.fill()
        }

        if (elapsed > anim.blastDelay) {
          const blastElapsed = elapsed - anim.blastDelay
          const blastProgress = Math.min(1, blastElapsed / (anim.duration * anim.blastSpeed))
          const blastEasedProgress = 1 - Math.pow(1 - blastProgress, 3)
          const blastRadius = anim.maxRadius * blastEasedProgress * 0.5
          const blastWaveWidth = 30
          const blastForceMultiplier = Math.max(0, 1 - blastProgress * 1.2)

          for (const org of organisms) {
            for (const node of org.nodes) {
              const dx = node.x - anim.x
              const dy = node.y - anim.y
              const distSq = dx * dx + dy * dy

              if (distSq === 0) continue

              const distanceFromBlast = Math.sqrt(distSq)
              const distFromWaveEdge = distanceFromBlast - blastRadius

              if (distFromWaveEdge < 0 && distFromWaveEdge > -blastWaveWidth) {
                const invDist = 1 / distanceFromBlast
                const directionX = dx * invDist
                const directionY = dy * invDist
                const waveDepthFactor = 1 - Math.abs(distFromWaveEdge) / blastWaveWidth
                const blastStrength = anim.blastForce * waveDepthFactor * blastForceMultiplier
                const massAdjustedForce = blastStrength * INV_MASS

                node.vx += directionX * massAdjustedForce
                node.vy += directionY * massAdjustedForce
                node.affectedByBlast = true

                if (halfRadiusProgress) {
                  node.lastBlastTime = timestamp
                } else {
                  node.lastBlastTime = timestamp + 1000000
                }
              }

              if (halfRadiusProgress && node.affectedByBlast && node.lastBlastTime > timestamp) {
                node.lastBlastTime = timestamp
              }
            }
          }
        }

        if (progress < 1) {
          animations.push({
            ...anim,
            radius: currentRadius
          })
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate(0)

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('click', handleClick)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className={className}></canvas>
}
