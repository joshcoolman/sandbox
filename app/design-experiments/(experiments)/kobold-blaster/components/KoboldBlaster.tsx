'use client'
import { useRef, useEffect } from 'react'
import styles from './KoboldBlaster.module.css'

// ─── Vec2 ────────────────────────────────────────────────────────
type V2 = { x: number; y: number }
const v2 = (x = 0, y = 0): V2 => ({ x, y })
const add  = (a: V2, b: V2): V2 => v2(a.x + b.x, a.y + b.y)
const sub  = (a: V2, b: V2): V2 => v2(a.x - b.x, a.y - b.y)
const scl  = (a: V2, s: number): V2 => v2(a.x * s, a.y * s)
const lenV = (a: V2) => Math.hypot(a.x, a.y)
const norm = (a: V2): V2 => { const l = lenV(a) || 1; return v2(a.x / l, a.y / l) }
const dist = (a: V2, b: V2) => lenV(sub(a, b))

// ─── Sprite sheet layout ─────────────────────────────────────────
// Crops are absolute [sx, sy, sw, sh] coords in the source image,
// derived by scanning non-transparent pixel bounding boxes per cell.
// Using tight crops means zero bleed from adjacent frames.

type Crop = [number, number, number, number]  // [sx, sy, sw, sh] absolute

// CARL v2 (carl-sprite-v2-t.png — 1254×1254, 4 cols, 4 rows, clean gutters)
const CARL_CROPS: (Crop | null)[][] = [
  // row 0 — walk (4 frames)
  [[98,60,152,199], [407,60,127,199], [694,63,150,196], [1013,61,127,198]],
  // row 1 — idle (0-2) + hurt (3)
  [[94,358,143,212], [398,358,143,213], [704,361,145,210], [1008,362,155,209]],
  // row 2 — throw (3 frames, col 3 empty)
  [[94,667,155,201], [381,676,160,192], [705,667,149,200], null],
  // row 3 — dead (col 0 only)
  [[94,1056,185,83], null, null, null],
]

// KOBOLD (kobold-sprite-t.png — 1254×1254, character fills full cell)
const KOBOLD_CROPS: (Crop | null)[][] = [
  // row 0 — run (4 frames)
  [[13,14,291,293], [324,14,291,293], [636,14,291,293], [948,14,291,293]],
  // row 1 — idle (0-2) + hurt (3)
  [[13,324,291,294], [324,324,291,294], [636,324,291,294], [948,324,291,294]],
  // row 2 — attack (3 frames, col 3 may be empty)
  [[13,636,291,294], [324,636,291,294], [636,636,291,294], null],
  // row 3 — dead (col 0 only)
  [[13,947,291,291], null, null, null],
]

const KOBOLD_ANIMS: Record<AnimName, AnimDef> = {
  walk:   { row: 0, cols: [0,1,2,3], fps: 8,  loop: true  },
  idle:   { row: 1, cols: [0,1,2],   fps: 4,  loop: true  },
  hurt:   { row: 1, cols: [3],       fps: 6,  loop: false },
  attack: { row: 2, cols: [0,1,2],   fps: 10, loop: false },
  dead:   { row: 3, cols: [0],       fps: 1,  loop: false },
  throw:  { row: 0, cols: [0,1,2,3], fps: 8,  loop: true  },
  sleep:  { row: 3, cols: [0],       fps: 1,  loop: true  },
}

// PRINCESS v2 (princess-sprite-v2-t.png — 1254×1254, clean gutters)
const DONUT_CROPS: (Crop | null)[][] = [
  // row 0 — walk (4 frames)
  [[58,101,207,171], [370,101,196,171], [668,101,195,171], [972,101,166,171]],
  // row 1 — idle (0-2) + hurt (3)
  [[65,376,187,194], [370,376,191,194], [674,376,186,194], [972,382,166,188]],
  // row 2 — attack (3 frames, col 3 empty)
  [[58,678,207,185], [370,692,196,159], [668,695,195,168], null],
  // row 3 — dead/sleep (col 0 only)
  [[58,1044,207,119], null, null, null],
]

type AnimName = 'idle' | 'walk' | 'throw' | 'hurt' | 'dead' | 'attack' | 'sleep'
interface AnimDef { row: number; cols: number[]; fps: number; loop: boolean }

const CARL_ANIMS: Record<AnimName, AnimDef> = {
  walk:   { row: 0, cols: [0,1,2,3], fps: 8,  loop: true  },
  idle:   { row: 1, cols: [0,1,2],   fps: 3,  loop: true  },
  throw:  { row: 2, cols: [0,1,2],   fps: 10, loop: false },
  hurt:   { row: 1, cols: [3],       fps: 6,  loop: false },
  dead:   { row: 3, cols: [0],       fps: 1,  loop: false },
  attack: { row: 2, cols: [0,1,2],   fps: 10, loop: false },
  sleep:  { row: 1, cols: [0],       fps: 1,  loop: true  },
}
const DONUT_ANIMS: Record<AnimName, AnimDef> = {
  walk:   { row: 0, cols: [0,1,2,3], fps: 8,  loop: true  },
  idle:   { row: 1, cols: [0,1,2],   fps: 2,  loop: true  },
  attack: { row: 2, cols: [0,1,2],   fps: 10, loop: false },
  sleep:  { row: 3, cols: [0],       fps: 1,  loop: true  },
  throw:  { row: 2, cols: [0,1,2],   fps: 10, loop: false },
  hurt:   { row: 1, cols: [3],       fps: 6,  loop: false },
  dead:   { row: 3, cols: [0],       fps: 1,  loop: false },
}

interface AnimState { name: AnimName; frame: number; t: number; done: boolean }

function makeAnim(name: AnimName): AnimState { return { name, frame: 0, t: 0, done: false } }

function tickAnim(a: AnimState, defs: Record<AnimName, AnimDef>, dt: number): AnimState {
  const def = defs[a.name]
  const dur = 1 / def.fps
  let t = a.t + dt, frame = a.frame, done = a.done
  while (t >= dur) {
    t -= dur
    frame++
    if (frame >= def.cols.length) {
      if (def.loop) frame = 0
      else { frame = def.cols.length - 1; done = true }
    }
  }
  return { ...a, frame, t, done }
}

function setAnim(a: AnimState, name: AnimName, defs: Record<AnimName, AnimDef>): AnimState {
  if (a.name === name) return a
  const cur = defs[a.name]
  if (!cur.loop && !a.done && name !== 'dead') return a
  return makeAnim(name)
}

// Remove magenta background from a sprite sheet via canvas pixel manipulation
function chromaKey(img: HTMLImageElement, fuzz = 60): HTMLCanvasElement {
  const oc = document.createElement('canvas')
  oc.width = img.naturalWidth
  oc.height = img.naturalHeight
  const octx = oc.getContext('2d')!
  octx.drawImage(img, 0, 0)
  const data = octx.getImageData(0, 0, oc.width, oc.height)
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2]
    if (r > 180 - fuzz && g < 80 + fuzz && b > 180 - fuzz && r > g + 80 && b > g + 80) {
      d[i + 3] = 0
    }
  }
  octx.putImageData(data, 0, 0)
  return oc
}

// Draws a sprite frame using absolute source crop coords, centered on (cx, cy).
// `pad` extends the source rect outward (into the transparent gutter) to catch
// artwork that reaches past the tight crop box on action frames (throwing arms,
// attack swings). On-screen sprite size is unchanged — only the visible halo grows.
function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  anims: Record<AnimName, AnimDef>,
  crops: (Crop | null)[][],
  anim: AnimState,
  cx: number, cy: number,
  renderH: number,
  flipX: boolean,
  pad = 0,
) {
  const def  = anims[anim.name]
  const col  = def.cols[anim.frame]
  const crop = crops[def.row][col]
  if (!crop) return
  const [sx, sy, sw, sh] = crop
  const psx = sx - pad, psy = sy - pad
  const psw = sw + pad * 2, psh = sh + pad * 2
  const scale = renderH / sh
  const drw = psw * scale
  const drh = psh * scale
  ctx.save()
  ctx.translate(cx, cy)
  if (flipX) ctx.scale(-1, 1)
  ctx.drawImage(img, psx, psy, psw, psh, -drw / 2, -drh / 2, drw, drh)
  ctx.restore()
}

// DEATH SPRITE (death-sprite.png — 1672×941, 5 cols × 4 rows, uniform grid)
const DEATH_COLS     = 5
const DEATH_ROWS     = 4
const DEATH_CELL_W   = 1672 / DEATH_COLS
const DEATH_CELL_H   = 941  / DEATH_ROWS
const DEATH_RENDER_H = 90
const DEATH_FPS      = 10
const DEATH_HOLD_DUR = 0.3
const DEATH_FADE_DUR = 0.5

// ─── Game constants ───────────────────────────────────────────────
const CARL_SPEED   = 190
const DONUT_SPEED  = 170
const KOBOLD_SPEED = 78
const BOMB_SPEED   = 480
const BOMB_CD      = 0.18
const BOMB_LIFE    = 0.7
const EXPLODE_R    = 90
const EXPLODE_DUR  = 0.38
const DONUT_RANGE  = 130
const DONUT_CD     = 0.6
const CARL_MAX_HP  = 5
const HURT_CD      = 1.2
const COMBO_FADE   = 2.5

type GameState = 'idle' | 'playing' | 'wave_clear' | 'game_over'

interface Kobold   { id: number; pos: V2; speed: number; anim: AnimState; flipX: boolean }
interface Bomb     { id: number; pos: V2; vel: V2; timer: number }
interface Expl     { id: number; pos: V2; t: number }
interface Particle { id: number; pos: V2; vel: V2; life: number; color: string }
interface Splat     { id: number; pos: V2; alpha: number; size: number }
interface DeathAnim { id: number; pos: V2; row: number; frame: number; t: number; done: boolean; fadeTimer: number; alpha: number }

interface G {
  state: GameState
  carl:  { pos: V2; vel: V2; hp: number; hurtCd: number; face: V2; bombCd: number; anim: AnimState; flipX: boolean }
  donut: { pos: V2; vel: V2; attackCd: number; anim: AnimState; flipX: boolean }
  kobolds: Kobold[]; bombs: Bomb[]; explosions: Expl[]
  particles: Particle[]; splats: Splat[]; deathAnims: DeathAnim[]
  wave: number; spawnLeft: number; spawnCd: number
  score: number; combo: number; comboCd: number
  notif: string | null; notifT: number; waveDelay: number
  uid: number; keys: Set<string>; mouse: V2; mouseDown: boolean
  vw: number; vh: number  // viewport size for no-scroll world
}

const NOTIFS = [
  'SYSTEM NOTIFICATION\n"First wave. Disappointing." — Princess Donut',
  'WAVE COMPLETE\nDungeon Skill Unlocked: Kobold Crusher I',
  'SYSTEM NOTIFICATION\nDonut leveled up: Tiara of Carnage +2',
  'DUNGEON ALERT\nThe Kobold Queen has noticed you.',
  'SYSTEM NOTIFICATION\n"I have leveled up. Whatever." — Carl',
  'WAVE COMPLETE\n"They smell worse up close." — Donut',
  'DUNGEON ALERT\nAchievement Unlocked: Bomb Enthusiast',
  'SYSTEM NOTIFICATION\nDonut: "Stop letting them touch you."',
]

function spawnCount(wave: number) { return wave * 3 + 5 }

function initG(vw: number, vh: number): G {
  return {
    state: 'idle',
    carl: {
      pos: v2(vw / 2, vh / 2), vel: v2(), hp: CARL_MAX_HP,
      hurtCd: 0, face: v2(1, 0), bombCd: 0,
      anim: makeAnim('idle'), flipX: false,
    },
    donut: {
      pos: v2(vw / 2 - 70, vh / 2 + 50), vel: v2(),
      attackCd: 0, anim: makeAnim('idle'), flipX: false,
    },
    kobolds: [], bombs: [], explosions: [], particles: [], splats: [], deathAnims: [],
    wave: 0, spawnLeft: 0, spawnCd: 0,
    score: 0, combo: 0, comboCd: 0,
    notif: null, notifT: 0, waveDelay: 0,
    uid: 10, keys: new Set(), mouse: v2(vw / 2, vh / 2), mouseDown: false,
    vw, vh,
  }
}

function startWave(g: G) {
  g.wave++
  g.spawnLeft = spawnCount(g.wave)
  g.spawnCd = 0
}

function spawnKobold(g: G) {
  const edge = Math.floor(Math.random() * 4)
  let pos: V2
  if      (edge === 0) pos = v2(Math.random() * g.vw, -50)
  else if (edge === 1) pos = v2(g.vw + 50, Math.random() * g.vh)
  else if (edge === 2) pos = v2(Math.random() * g.vw, g.vh + 50)
  else                 pos = v2(-50, Math.random() * g.vh)
  g.kobolds.push({ id: g.uid++, pos, speed: KOBOLD_SPEED + (g.wave - 1) * 4 + Math.random() * 18, anim: makeAnim('walk'), flipX: false })
}

function throwBomb(g: G, target: V2) {
  if (g.carl.bombCd > 0) return
  const dir = norm(sub(target, g.carl.pos))
  g.bombs.push({ id: g.uid++, pos: { ...g.carl.pos }, vel: scl(dir, BOMB_SPEED), timer: BOMB_LIFE })
  g.carl.bombCd = BOMB_CD
  g.carl.face = dir
  g.carl.flipX = dir.x < 0
  g.carl.anim = makeAnim('throw')
  // Muzzle flash
  for (let i = 0; i < 4; i++) {
    const spread = (Math.random() - 0.5) * 0.6
    const a = Math.atan2(dir.y, dir.x) + spread
    g.particles.push({ id: g.uid++, pos: { ...g.carl.pos }, vel: v2(Math.cos(a)*(180+Math.random()*80), Math.sin(a)*(180+Math.random()*80)), life: 0.12+Math.random()*0.08, color: Math.random()<0.5?'#ffe066':'#ffffff' })
  }
}

function explode(g: G, pos: V2) {
  g.explosions.push({ id: g.uid++, pos: { ...pos }, t: EXPLODE_DUR })
  const killed: Kobold[] = []
  g.kobolds = g.kobolds.filter(k => { if (dist(k.pos, pos) < EXPLODE_R) { killed.push(k); return false } return true })
  if (killed.length > 0) {
    g.comboCd = COMBO_FADE; g.combo += killed.length
    g.score += killed.length * g.combo * 100
    for (const k of killed) {
      g.deathAnims.push({ id: g.uid++, pos: { ...k.pos }, row: Math.floor(Math.random() * DEATH_ROWS), frame: 0, t: 0, done: false, fadeTimer: DEATH_HOLD_DUR + DEATH_FADE_DUR, alpha: 1 })
      for (let i = 0; i < 9; i++) {
        const a = Math.random() * Math.PI * 2
        g.particles.push({ id: g.uid++, pos: { ...k.pos }, vel: v2(Math.cos(a)*(70+Math.random()*130), Math.sin(a)*(70+Math.random()*130)), life: 0.6+Math.random()*0.4, color: Math.random()<0.75?'#cc1111':'#ff4422' })
      }
    }
  }
  const chain = g.bombs.filter(b => dist(b.pos, pos) < EXPLODE_R * 1.3)
  g.bombs = g.bombs.filter(b => dist(b.pos, pos) >= EXPLODE_R * 1.3)
  for (const b of chain) explode(g, b.pos)
}

function update(g: G, dt: number) {
  if (g.state === 'idle' || g.state === 'game_over') return
  dt = Math.min(dt, 0.05)
  const { carl, donut } = g

  // Carl movement
  let dx = 0, dy = 0
  if (g.keys.has('ArrowLeft')  || g.keys.has('a') || g.keys.has('A')) dx -= 1
  if (g.keys.has('ArrowRight') || g.keys.has('d') || g.keys.has('D')) dx += 1
  if (g.keys.has('ArrowUp')    || g.keys.has('w') || g.keys.has('W')) dy -= 1
  if (g.keys.has('ArrowDown')  || g.keys.has('s') || g.keys.has('S')) dy += 1
  const moving = !!(dx || dy)
  if (moving) { carl.vel = scl(norm(v2(dx, dy)), CARL_SPEED); carl.face = norm(v2(dx, dy)); carl.flipX = dx < 0 }
  else carl.vel = v2()
  carl.pos = add(carl.pos, scl(carl.vel, dt))
  carl.pos.x = Math.max(20, Math.min(g.vw - 20, carl.pos.x))
  carl.pos.y = Math.max(20, Math.min(g.vh - 20, carl.pos.y))
  carl.bombCd  = Math.max(0, carl.bombCd  - dt)
  carl.hurtCd  = Math.max(0, carl.hurtCd  - dt)
  const usingMouseAim = g.mouseDown && !moving
  if (usingMouseAim) throwBomb(g, g.mouse)
  else if (g.mouseDown || g.keys.has(' ')) throwBomb(g, add(carl.pos, scl(carl.face, 1000)))

  // Carl anim
  if (carl.hp <= 0) {
    carl.anim = setAnim(carl.anim, 'dead', CARL_ANIMS)
  } else if (carl.hurtCd > HURT_CD - 0.25) {
    carl.anim = setAnim(carl.anim, 'hurt', CARL_ANIMS)
  } else if (carl.anim.name !== 'throw' || carl.anim.done) {
    carl.anim = setAnim(carl.anim, moving ? 'walk' : 'idle', CARL_ANIMS)
  }
  carl.anim = tickAnim(carl.anim, CARL_ANIMS, dt)

  // Donut AI
  const donutSlot = add(carl.pos, scl(norm(v2(-carl.face.x || -1, -carl.face.y || 0.4)), 70))
  const toSlot = sub(donutSlot, donut.pos)
  const donutMoving = lenV(toSlot) > 8
  donut.vel = donutMoving ? scl(norm(toSlot), Math.min(lenV(toSlot) * 5, DONUT_SPEED)) : v2()
  donut.pos = add(donut.pos, scl(donut.vel, dt))
  if (donutMoving) donut.flipX = toSlot.x < 0
  donut.attackCd = Math.max(0, donut.attackCd - dt)

  if (donut.attackCd <= 0 && g.kobolds.length > 0) {
    let nearest: Kobold | null = null, nearDist = DONUT_RANGE
    for (const k of g.kobolds) { const d = dist(k.pos, donut.pos); if (d < nearDist) { nearDist = d; nearest = k } }
    if (nearest) {
      const target = nearest
      g.kobolds = g.kobolds.filter(k => k.id !== target.id)
      g.comboCd = COMBO_FADE; g.combo += 1; g.score += g.combo * 100
      g.splats.push({ id: g.uid++, pos: { ...target.pos }, alpha: 0.7, size: 14 })
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2
        g.particles.push({ id: g.uid++, pos: { ...target.pos }, vel: v2(Math.cos(a)*90, Math.sin(a)*90), life: 0.5, color: '#cc1111' })
      }
      donut.flipX = target.pos.x < donut.pos.x
      donut.anim = makeAnim('attack')
      donut.attackCd = DONUT_CD
    }
  }

  // Donut anim
  if (donut.anim.name !== 'attack' || donut.anim.done) {
    donut.anim = setAnim(donut.anim, donutMoving ? 'walk' : 'idle', DONUT_ANIMS)
  }
  donut.anim = tickAnim(donut.anim, DONUT_ANIMS, dt)

  // Kobolds
  for (const k of g.kobolds) {
    const dir = norm(sub(carl.pos, k.pos))
    k.pos = add(k.pos, scl(dir, k.speed * dt))
    k.flipX = dir.x > 0
    k.anim = tickAnim(k.anim, KOBOLD_ANIMS, dt)
    if (carl.hurtCd <= 0 && dist(k.pos, carl.pos) < 28) {
      carl.hp -= 1; carl.hurtCd = HURT_CD; carl.anim = makeAnim('hurt')
      if (carl.hp <= 0) { g.state = 'game_over'; return }
    }
  }

  // Bombs
  g.bombs = g.bombs.filter(b => {
    b.pos = add(b.pos, scl(b.vel, dt)); b.timer -= dt
    for (const k of g.kobolds) { if (dist(b.pos, k.pos) < 24) { explode(g, b.pos); return false } }
    if (b.timer <= 0) { explode(g, b.pos); return false }
    if (b.pos.x < -80 || b.pos.x > g.vw+80 || b.pos.y < -80 || b.pos.y > g.vh+80) return false
    return true
  })

  g.explosions = g.explosions.filter(e => { e.t -= dt; return e.t > 0 })
  g.particles  = g.particles.filter(p => { p.pos = add(p.pos, scl(p.vel, dt)); p.vel = scl(p.vel, Math.pow(0.82, dt*60)); p.life -= dt; return p.life > 0 })
  g.splats     = g.splats.filter(s => { s.alpha -= dt * 0.04; return s.alpha > 0 })
  g.deathAnims.forEach(d => {
    if (!d.done) {
      d.t += dt
      while (d.t >= 1 / DEATH_FPS) {
        d.t -= 1 / DEATH_FPS
        d.frame++
        if (d.frame >= DEATH_COLS) { d.frame = DEATH_COLS - 1; d.done = true; break }
      }
    }
  })
  if (g.comboCd > 0) { g.comboCd -= dt; if (g.comboCd <= 0) g.combo = 0 }

  if (g.spawnLeft > 0) { g.spawnCd -= dt; if (g.spawnCd <= 0) { spawnKobold(g); g.spawnLeft--; g.spawnCd = 0.4 } }

  if (g.state === 'playing' && g.spawnLeft === 0 && g.kobolds.length === 0) {
    g.state = 'wave_clear'
    g.notif = NOTIFS[(g.wave - 1) % NOTIFS.length]
    g.notifT = g.waveDelay = 3.5
  }
  if (g.state === 'wave_clear') { g.waveDelay -= dt; if (g.waveDelay <= 0) { g.state = 'playing'; g.notif = null; startWave(g) } }
  if (g.notifT > 0) g.notifT -= dt
}

// ─── Draw ─────────────────────────────────────────────────────────
function draw(g: G, ctx: CanvasRenderingContext2D, imgs: Record<string, CanvasImageSource>) {
  const { vw, vh } = g
  ctx.clearRect(0, 0, vw, vh)

  // Floor
  if (imgs['floor-tile']) {
    const ts = 64
    for (let x = 0; x < vw; x += ts)
      for (let y = 0; y < vh; y += ts)
        ctx.drawImage(imgs['floor-tile'], x, y, ts, ts)
  } else { ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, vw, vh) }

  // Splats
  for (const s of g.splats) {
    ctx.globalAlpha = s.alpha
    if (imgs.splat) ctx.drawImage(imgs.splat, s.pos.x - s.size/2, s.pos.y - s.size/2, s.size, s.size)
    else { ctx.fillStyle = '#770000'; ctx.beginPath(); ctx.arc(s.pos.x, s.pos.y, s.size/2, 0, Math.PI*2); ctx.fill() }
    ctx.globalAlpha = 1
  }

  // Death animations
  const deathImg = imgs['death-sprite']
  if (deathImg) {
    const rw = DEATH_RENDER_H * (DEATH_CELL_W / DEATH_CELL_H)
    for (const d of g.deathAnims) {
      ctx.globalAlpha = d.alpha
      ctx.drawImage(deathImg, d.frame * DEATH_CELL_W, d.row * DEATH_CELL_H, DEATH_CELL_W, DEATH_CELL_H,
        d.pos.x - rw / 2, d.pos.y - DEATH_RENDER_H / 2, rw, DEATH_RENDER_H)
      ctx.globalAlpha = 1
    }
  }

  // Kobolds (small pad — cell gutters are only ~20px)
  for (const k of g.kobolds) {
    if (imgs['kobold-sprite-t']) {
      drawSprite(ctx, imgs['kobold-sprite-t'], KOBOLD_ANIMS, KOBOLD_CROPS, k.anim, k.pos.x, k.pos.y, 80, k.flipX, 10)
    } else {
      ctx.fillStyle = '#338833'; ctx.fillRect(k.pos.x - 20, k.pos.y - 20, 40, 40)
    }
  }

  // Donut
  if (g.state !== 'idle' && imgs['princess-sprite-v2-t']) {
    drawSprite(ctx, imgs['princess-sprite-v2-t'], DONUT_ANIMS, DONUT_CROPS, g.donut.anim, g.donut.pos.x, g.donut.pos.y, 80, g.donut.flipX, 30)
  }

  // Carl (flash when hurt)
  const flash = g.carl.hurtCd > 0 && Math.floor(g.carl.hurtCd * 10) % 2 === 0
  if (g.state !== 'idle' && !flash && imgs['carl-sprite-v2-t']) {
    drawSprite(ctx, imgs['carl-sprite-v2-t'], CARL_ANIMS, CARL_CROPS, g.carl.anim, g.carl.pos.x, g.carl.pos.y, 100, g.carl.flipX, 30)
  } else if (g.state !== 'idle' && !flash) {
    if (imgs.carl) ctx.drawImage(imgs.carl, g.carl.pos.x - 24, g.carl.pos.y - 24, 48, 48)
    else { ctx.fillStyle = '#4488ff'; ctx.fillRect(g.carl.pos.x - 20, g.carl.pos.y - 20, 40, 40) }
  }

  // Bombs
  for (const b of g.bombs) {
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(b.pos.x, b.pos.y, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke()
    ctx.strokeStyle = '#ff9900'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(b.pos.x, b.pos.y - 8); ctx.lineTo(b.pos.x + 5, b.pos.y - 16); ctx.stroke()
  }

  // Explosions
  for (const e of g.explosions) {
    const pct = 1 - e.t / EXPLODE_DUR
    const r   = EXPLODE_R * (0.4 + pct * 0.6)
    ctx.globalAlpha = Math.max(0, 1 - pct * 1.1)
    if (imgs.explosion) { const s = r * 2.8; ctx.drawImage(imgs.explosion, e.pos.x - s/2, e.pos.y - s/2, s, s) }
    else { ctx.fillStyle = '#ff7700'; ctx.beginPath(); ctx.arc(e.pos.x, e.pos.y, r, 0, Math.PI*2); ctx.fill() }
    ctx.globalAlpha = 1
  }

  // Particles
  for (const p of g.particles) {
    ctx.globalAlpha = Math.min(1, p.life * 2)
    ctx.fillStyle = p.color
    ctx.fillRect(p.pos.x - 3, p.pos.y - 3, 6, 6)
    ctx.globalAlpha = 1
  }

  if (g.state !== 'idle') drawHUD(g, ctx, vw)
  if (g.state === 'idle') drawIdle(ctx, vw, vh, imgs)
  else if (g.state === 'game_over') drawGameOver(g, ctx, vw, vh)
  if (g.notif && g.notifT > 0) drawNotif(g.notif, g.notifT, ctx, vw, vh)

  // Crosshair (always on top)
  const cx = g.mouse.x, cy = g.mouse.y, arm = 8, gap = 4
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx - arm - gap, cy); ctx.lineTo(cx - gap, cy)
  ctx.moveTo(cx + gap, cy);       ctx.lineTo(cx + arm + gap, cy)
  ctx.moveTo(cx, cy - arm - gap); ctx.lineTo(cx, cy - gap)
  ctx.moveTo(cx, cy + gap);       ctx.lineTo(cx, cy + arm + gap)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,80,80,0.9)'
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawHUD(g: G, ctx: CanvasRenderingContext2D, vw: number) {
  for (let i = 0; i < CARL_MAX_HP; i++) {
    ctx.fillStyle = i < g.carl.hp ? '#ff4444' : '#333'
    ctx.font = '18px "Press Start 2P", monospace'
    ctx.fillText('♥', 18 + i * 28, 34)
  }
  ctx.fillStyle = '#ffdd44'; ctx.font = '11px "Press Start 2P", monospace'
  ctx.fillText(`SCORE: ${g.score.toLocaleString()}`, 18, 62)
  ctx.fillStyle = '#aaffaa'; ctx.font = '11px "Press Start 2P", monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`WAVE ${g.wave}`, vw / 2, 30)
  ctx.fillStyle = '#888'; ctx.font = '9px "Press Start 2P", monospace'
  const total = g.kobolds.length + g.spawnLeft
  ctx.fillText(`${total} KOBOLD${total !== 1 ? 'S' : ''}`, vw / 2, 50)
  ctx.textAlign = 'left'
  if (g.combo > 1 && g.comboCd > 0) {
    ctx.globalAlpha = Math.min(1, g.comboCd)
    ctx.fillStyle = '#ff8800'; ctx.font = '13px "Press Start 2P", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${g.combo}x COMBO!`, vw - 18, 44)
    ctx.textAlign = 'left'; ctx.globalAlpha = 1
  }
}

function drawIdle(ctx: CanvasRenderingContext2D, vw: number, vh: number, imgs: Record<string, CanvasImageSource>) {
  ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(0, 0, vw, vh)

  const half = vw / 2

  // ── LEFT: splash image + title ──────────────────────────────────
  const splash = imgs['kobold-splash-v2']
  const lcx = half / 2
  if (splash) {
    const src = splash as HTMLCanvasElement
    const maxW = half * 0.82
    const maxH = vh * 0.68
    const scale = Math.min(maxW / src.width, maxH / src.height)
    const dw = src.width * scale, dh = src.height * scale
    const imgY = vh * 0.05
    ctx.drawImage(splash, lcx - dw / 2, imgY, dw, dh)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffdd44'; ctx.font = '18px "Press Start 2P", monospace'
    ctx.fillText('KOBOLD BLASTER', lcx, imgY + dh + 34)
    ctx.fillStyle = '#aaffaa'; ctx.font = '7px "Press Start 2P", monospace'
    ctx.fillText('Carl & Princess Donut vs. The Dungeon', lcx, imgY + dh + 56)
  } else {
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffdd44'; ctx.font = '22px "Press Start 2P", monospace'
    ctx.fillText('KOBOLD BLASTER', lcx, vh / 2)
  }

  // Divider
  ctx.strokeStyle = 'rgba(255,221,68,0.15)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(half, vh * 0.1); ctx.lineTo(half, vh * 0.9); ctx.stroke()

  // ── RIGHT: controls + start button ──────────────────────────────
  const rcx = half + half / 2
  const rightTop = vh * 0.18

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffdd44'; ctx.font = '7px "Press Start 2P", monospace'
  ctx.fillText('HOW TO PLAY THIS STUPID GAME', rcx, rightTop)

  const controls = [
    ['WASD / ARROWS', 'MOVE'],
    ['HOLD LEFT CLICK', 'BLAST toward mouse'],
    ['MOVE + CLICK', 'BLAST in direction'],
    ['HOLD SPACE', 'BLAST in direction'],
  ]
  controls.forEach(([key, desc], i) => {
    const y = rightTop + 28 + i * 22
    ctx.font = '7px "Press Start 2P", monospace'
    ctx.textAlign = 'right'; ctx.fillStyle = '#aaffaa'
    ctx.fillText(key, rcx - 10, y)
    ctx.textAlign = 'left'; ctx.fillStyle = '#555'
    ctx.fillText('— ' + desc, rcx + 10, y)
  })

  // Start button
  const blink = Math.floor(Date.now() / 500) % 2 === 0
  const btnW = 230, btnH = 44
  const btnX = rcx - btnW / 2, btnY = rightTop + 150
  ctx.fillStyle = blink ? '#ff8800' : '#cc5500'
  ctx.fillRect(btnX, btnY, btnW, btnH)
  ctx.strokeStyle = '#ffdd44'; ctx.lineWidth = 2
  ctx.strokeRect(btnX, btnY, btnW, btnH)
  ctx.textAlign = 'center'; ctx.fillStyle = '#000'
  ctx.font = '10px "Press Start 2P", monospace'
  ctx.fillText('▶  START GAME', rcx, btnY + 28)

  ctx.fillStyle = '#333'; ctx.font = '6px "Press Start 2P", monospace'
  ctx.fillText('or press ENTER', rcx, btnY + btnH + 18)

  // Cheat code — dropping the act
  const cheatY = btnY + btnH + 58
  ctx.fillStyle = '#fff'; ctx.font = '8px "Press Start 2P", monospace'
  ctx.fillText('CHEAT CODE', rcx, cheatY)

  ctx.fillStyle = '#fff'; ctx.font = '13px system-ui, -apple-system, sans-serif'
  const cheatLines = [
    "OK, let's be real here. This isn't really a game.",
    "It's more like bubble wrap. Maybe 30 seconds of fun.",
    "If you want max damage, just hold your mouse down",
    "and draw a circle around the guy. Kills everything",
    "in sight. It's a sprite experiment, more or less.",
  ]
  cheatLines.forEach((line, i) => {
    ctx.fillText(line, rcx, cheatY + 22 + i * 18)
  })

  ctx.textAlign = 'left'
}

function drawGameOver(g: G, ctx: CanvasRenderingContext2D, vw: number, vh: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.fillRect(0, 0, vw, vh)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ff2222'; ctx.font = '22px "Press Start 2P", monospace'
  ctx.fillText('YOU DIED, DUMMY.', vw/2, vh/2 - 90)
  ctx.fillStyle = '#ffdd44'; ctx.font = '8px "Press Start 2P", monospace'
  ctx.fillText('SYSTEM NOTIFICATION', vw/2, vh/2 - 48)
  ctx.fillStyle = '#ccc'; ctx.font = '9px "Press Start 2P", monospace'
  ctx.fillText('"You were warned about the kobolds."', vw/2, vh/2 - 22)
  ctx.fillStyle = '#888'; ctx.font = '8px "Press Start 2P", monospace'
  ctx.fillText('— Princess Donut', vw/2, vh/2 + 2)
  ctx.fillStyle = '#ffdd44'; ctx.font = '11px "Press Start 2P", monospace'
  ctx.fillText(`SCORE: ${g.score.toLocaleString()}`, vw/2, vh/2 + 46)
  ctx.fillText(`WAVE REACHED: ${g.wave}`, vw/2, vh/2 + 68)
  if (Math.floor(Date.now() / 600) % 2 === 0) {
    ctx.fillStyle = '#ff8800'; ctx.font = '8px "Press Start 2P", monospace'
    ctx.fillText('ENTER OR CLICK TO PLAY AGAIN', vw/2, vh/2 + 106)
  }
  ctx.textAlign = 'left'
}

function drawNotif(notif: string, notifT: number, ctx: CanvasRenderingContext2D, vw: number, vh: number) {
  const fadeIn  = Math.min(1, (3.5 - notifT + 0.35) / 0.35)
  const fadeOut = notifT < 0.5 ? notifT / 0.5 : 1
  ctx.globalAlpha = Math.min(fadeIn, fadeOut)
  const lines = notif.split('\n')
  const bw = Math.min(520, vw - 40), bh = 84
  const bx = vw/2 - bw/2, by = vh - 150
  ctx.fillStyle = '#000'; ctx.fillRect(bx, by, bw, bh)
  ctx.strokeStyle = '#ffdd44'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffdd44'; ctx.font = '9px "Press Start 2P", monospace'
  ctx.fillText(lines[0], vw/2, by + 26)
  if (lines[1]) { ctx.fillStyle = '#ddd'; ctx.font = '8px "Press Start 2P", monospace'; ctx.fillText(lines[1], vw/2, by + 54) }
  ctx.textAlign = 'left'; ctx.globalAlpha = 1
}

// ─── Component ───────────────────────────────────────────────────
interface KoboldBlasterProps {
  className?: string
}

export function KoboldBlaster({ className }: KoboldBlasterProps = {}) {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gRef      = useRef<G | null>(null)
  const imgsRef   = useRef<Record<string, CanvasImageSource>>({})
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const wrap = wrapRef.current!
    const cvs  = canvasRef.current!
    const ctx  = cvs.getContext('2d')!
    const imgs = imgsRef.current

    // Load sprites
    const spriteFiles = ['carl-sprite-v2-t', 'princess-sprite-v2-t', 'kobold-sprite-t', 'explosion', 'splat', 'floor-tile', 'kobold-splash-v2', 'death-sprite']
    for (const name of spriteFiles) {
      const img = new Image()
      img.src = `/design-experiments/kobold-blaster/${name}.png`
      img.onload = () => { imgs[name] = (name.endsWith('-t') || name.startsWith('kobold-splash') || name === 'death-sprite') ? chromaKey(img) : img }
    }

    function resize() {
      cvs.width  = wrap.clientWidth
      cvs.height = wrap.clientHeight
      if (gRef.current) { gRef.current.vw = cvs.width; gRef.current.vh = cvs.height }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    function startGame() {
      const vw = cvs.width, vh = cvs.height
      const fresh = initG(vw, vh)
      if (gRef.current) fresh.keys = gRef.current.keys
      gRef.current = fresh
      gRef.current.state = 'playing'
      startWave(gRef.current)
    }

    if (!gRef.current) gRef.current = initG(cvs.width, cvs.height)

    function onKeyDown(e: KeyboardEvent) {
      const g = gRef.current!
      g.keys.add(e.key)
      if (e.key === ' ') e.preventDefault()
      if (e.key === 'Enter') {
        if (g.state === 'idle' || g.state === 'game_over') startGame()
      }
    }
    function onKeyUp(e: KeyboardEvent) { gRef.current?.keys.delete(e.key) }

    function screenToWorld(e: MouseEvent): V2 {
      const rect = cvs.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left) * (cvs.width  / rect.width),
        y: (e.clientY - rect.top)  * (cvs.height / rect.height),
      }
    }
    function onMouseMove(e: MouseEvent) { if (gRef.current) gRef.current.mouse = screenToWorld(e) }
    function onMouseDown() {
      const g = gRef.current!
      if (g.state === 'idle' || g.state === 'game_over') { startGame(); return }
      g.mouseDown = true
    }
    function onMouseUp() { if (gRef.current) gRef.current.mouseDown = false }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    cvs.addEventListener('mousemove', onMouseMove)
    cvs.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    let last = 0
    function loop(ts: number) {
      const dt = Math.min((ts - last) / 1000, 0.05)
      last = ts
      if (gRef.current) { update(gRef.current, dt); draw(gRef.current, ctx, imgs) }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
      cvs.removeEventListener('mousemove', onMouseMove)
      cvs.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div ref={wrapRef} className={className ? `${styles.wrap} ${className}` : styles.wrap}>
      <canvas ref={canvasRef} style={{ cursor: 'none' }} />
    </div>
  )
}
