'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import './styles.css'

export const dynamic = 'force-static'

const IMAGES = [
  '/ascii-reveal/face.jpg',
  '/ascii-reveal/hand.jpg',
  '/ascii-reveal/dance.jpg',
  '/ascii-reveal/skate.jpg',
  '/ascii-reveal/city.jpg',
  '/ascii-reveal/brutalist.jpg',
]

const VERT_SRC = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG_SRC = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexCurrent;
uniform sampler2D uTexNext;
uniform float uProgress;
uniform vec2 uOrigin;
uniform vec2 uResolution;
uniform float uAspectCurrent;
uniform float uAspectNext;
uniform float uRippleStrength;
uniform float uRippleFrequency;

// object-fit: contain — returns sampled color or black for letterbox area
vec4 sampleContain(sampler2D tex, vec2 uv, float imgAspect) {
  float canvasAspect = uResolution.x / uResolution.y;
  vec2 scale = vec2(1.0);
  if (imgAspect > canvasAspect) {
    scale.y = canvasAspect / imgAspect;
  } else {
    scale.x = imgAspect / canvasAspect;
  }
  vec2 fitUv = (uv - 0.5) / scale + 0.5;
  if (fitUv.x < 0.0 || fitUv.x > 1.0 || fitUv.y < 0.0 || fitUv.y > 1.0) {
    return vec4(0.0, 0.0, 0.0, 1.0);
  }
  return texture(tex, fitUv);
}

void main() {
  float canvasAspect = uResolution.x / uResolution.y;

  // Aspect-corrected distance so ripple stays circular.
  vec2 d = vUv - uOrigin;
  d.x *= canvasAspect;
  float dist = length(d);

  // Wave moves outward over time; falloff guarantees clean start/end.
  float wave = sin(dist * uRippleFrequency - uProgress * 12.0);
  float falloff = sin(uProgress * 3.14159265);

  // Radial outward displacement scaled by wave + falloff.
  vec2 dir = normalize(vUv - uOrigin + 1e-5);
  vec2 distortion = dir * wave * uRippleStrength * falloff;

  vec2 uvCurrent = vUv + distortion * (1.0 - uProgress);
  vec2 uvNext    = vUv - distortion * uProgress;

  vec4 c0 = sampleContain(uTexCurrent, uvCurrent, uAspectCurrent);
  vec4 c1 = sampleContain(uTexNext,    uvNext,    uAspectNext);

  // Smooth radial blend front so the cross-fade tracks the wave.
  float blend = smoothstep(0.0, 1.0, uProgress);
  fragColor = mix(c0, c1, blend);
}`

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)
  if (!sh) throw new Error('createShader failed')
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) || 'shader compile error'
    gl.deleteShader(sh)
    throw new Error(log)
  }
  return sh
}

function createProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const p = gl.createProgram()
  if (!p) throw new Error('createProgram failed')
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p) || 'program link error'
    gl.deleteProgram(p)
    throw new Error(log)
  }
  return p
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export default function Page() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [index, setIndex] = useState(0)
  const [hintVisible, setHintVisible] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return

    const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: false })
    if (!gl) return

    let cancelled = false
    let raf = 0
    let program: WebGLProgram | null = null
    let vao: WebGLVertexArrayObject | null = null
    let quadBuffer: WebGLBuffer | null = null
    const textures: WebGLTexture[] = []
    const aspects: number[] = []

    // State refs — mutated by GSAP / click handler, read every frame.
    const state = {
      currentIdx: 0,
      nextIdx: 1,
      progress: 0,
      origin: [0.5, 0.5] as [number, number],
      animating: false,
      dirty: true,
    }

    let uniforms: {
      uTexCurrent: WebGLUniformLocation | null
      uTexNext: WebGLUniformLocation | null
      uProgress: WebGLUniformLocation | null
      uOrigin: WebGLUniformLocation | null
      uResolution: WebGLUniformLocation | null
      uAspectCurrent: WebGLUniformLocation | null
      uAspectNext: WebGLUniformLocation | null
      uRippleStrength: WebGLUniformLocation | null
      uRippleFrequency: WebGLUniformLocation | null
    }

    function resize() {
      if (!gl || !canvas) return
      const rect = stage!.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.floor(rect.width * dpr))
      const h = Math.max(1, Math.floor(rect.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
        state.dirty = true
      }
    }

    function render() {
      if (cancelled || !gl || !program) return
      if (state.dirty || state.animating) {
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(program)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, textures[state.currentIdx])
        gl.uniform1i(uniforms.uTexCurrent, 0)

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, textures[state.nextIdx])
        gl.uniform1i(uniforms.uTexNext, 1)

        gl.uniform1f(uniforms.uProgress, state.progress)
        gl.uniform2f(uniforms.uOrigin, state.origin[0], state.origin[1])
        gl.uniform2f(uniforms.uResolution, canvas!.width, canvas!.height)
        gl.uniform1f(uniforms.uAspectCurrent, aspects[state.currentIdx])
        gl.uniform1f(uniforms.uAspectNext, aspects[state.nextIdx])
        gl.uniform1f(uniforms.uRippleStrength, 0.18)
        gl.uniform1f(uniforms.uRippleFrequency, 38.0)

        gl.bindVertexArray(vao)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        state.dirty = false
      }
      raf = requestAnimationFrame(render)
    }

    async function init() {
      if (!gl) return
      const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC)
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
      program = createProgram(gl, vs, fs)
      gl.deleteShader(vs)
      gl.deleteShader(fs)

      uniforms = {
        uTexCurrent: gl.getUniformLocation(program, 'uTexCurrent'),
        uTexNext: gl.getUniformLocation(program, 'uTexNext'),
        uProgress: gl.getUniformLocation(program, 'uProgress'),
        uOrigin: gl.getUniformLocation(program, 'uOrigin'),
        uResolution: gl.getUniformLocation(program, 'uResolution'),
        uAspectCurrent: gl.getUniformLocation(program, 'uAspectCurrent'),
        uAspectNext: gl.getUniformLocation(program, 'uAspectNext'),
        uRippleStrength: gl.getUniformLocation(program, 'uRippleStrength'),
        uRippleFrequency: gl.getUniformLocation(program, 'uRippleFrequency'),
      }

      // Fullscreen quad
      vao = gl.createVertexArray()
      gl.bindVertexArray(vao)
      quadBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
      )
      const aPos = gl.getAttribLocation(program, 'aPos')
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
      gl.bindVertexArray(null)

      // Preload + upload all images.
      const imgs = await Promise.all(IMAGES.map(loadImage))
      if (cancelled) return
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      for (const img of imgs) {
        const tex = gl.createTexture()!
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        textures.push(tex)
        aspects.push(img.naturalWidth / img.naturalHeight)
      }

      resize()
      setReady(true)
      state.dirty = true
      raf = requestAnimationFrame(render)
    }

    init().catch((err) => {
      console.error('[ripple-cycle] init failed', err)
    })

    const ro = new ResizeObserver(resize)
    ro.observe(stage)

    function handlePointerDown(e: PointerEvent) {
      if (state.animating || textures.length < 2) return
      const rect = canvas!.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width
      // Flip Y because UVs are bottom-up (UNPACK_FLIP_Y_WEBGL set).
      const ny = 1 - (e.clientY - rect.top) / rect.height
      state.origin = [nx, ny]
      state.animating = true
      setHintVisible(false)

      const tween = { p: 0 }
      gsap.to(tween, {
        p: 1,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          state.progress = tween.p
          state.dirty = true
        },
        onComplete: () => {
          state.currentIdx = state.nextIdx
          state.nextIdx = (state.nextIdx + 1) % IMAGES.length
          state.progress = 0
          state.animating = false
          state.dirty = true
          setIndex(state.currentIdx)
        },
      })
    }

    canvas.addEventListener('pointerdown', handlePointerDown)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', handlePointerDown)
      for (const t of textures) gl.deleteTexture(t)
      if (quadBuffer) gl.deleteBuffer(quadBuffer)
      if (vao) gl.deleteVertexArray(vao)
      if (program) gl.deleteProgram(program)
    }
  }, [])

  return (
    <div className="ripple-stage" ref={stageRef}>
      <canvas ref={canvasRef} className="ripple-canvas" />
      {ready && (
        <span className="ripple-counter">
          {String(index + 1).padStart(2, '0')} / {String(IMAGES.length).padStart(2, '0')}
        </span>
      )}
      <span className="ripple-hint" data-visible={hintVisible && ready}>
        Click anywhere
      </span>
    </div>
  )
}
