// Procedural ASCII pinout schematic — an endless stream of lines that read
// like a memory-controller datasheet (the green-phosphor panel). Structure
// over authenticity: paired pin columns with incrementing numbers, bus
// crossings, crystal taps. Accent spans mark power pins for amber rendering.

export type SchemLine = {
  text: string
  /** [start, end) column spans rendered in the accent color (VDD/GND/XTAL). */
  accents: Array<[number, number]>
}

export const SCHEM_COLS = 34

const SIGNALS = ['CLK', 'CS#', 'RAS#', 'CAS#', 'WE#', 'SDA', 'SCL', 'CKE', 'ODT', 'RST#'] as const
const POWER = ['GND', 'VDD', 'V3V3', 'VREF'] as const

function pad(s: string, w: number): string {
  return s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length)
}

function findAccents(text: string): Array<[number, number]> {
  const accents: Array<[number, number]> = []
  for (const p of POWER) {
    let idx = text.indexOf(p)
    while (idx !== -1) {
      accents.push([idx, idx + p.length])
      idx = text.indexOf(p, idx + 1)
    }
  }
  return accents
}

function line(text: string): SchemLine {
  return { text: pad(text, SCHEM_COLS), accents: findAccents(text) }
}

export function createSchematicStream(rng: () => number): () => SchemLine {
  let pinL = 1
  let pinR = 85
  let block = 0
  const queue: SchemLine[] = []
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]

  const pinLabel = () => {
    const r = rng()
    if (r < 0.22) return pick(POWER)
    if (r < 0.34) return 'NC'
    if (r < 0.46) return pick(SIGNALS)
    if (r < 0.78) return `DQ${Math.floor(rng() * 64)}`
    return `A${Math.floor(rng() * 16)}`
  }

  function header() {
    const hex = Math.floor(rng() * 0xffff).toString(16).toUpperCase().padStart(4, '0')
    queue.push(
      line(''),
      line(`  .--= ${pick(['MEM CTRL', 'IO BRIDGE', 'BUS MUX', 'PHY CORE'])} ${hex} =--.`),
      line('  |    FRONT        BACK     |'),
      line("  '---.----------------.----'"),
    )
  }

  function pins() {
    const rows = 4 + Math.floor(rng() * 7)
    for (let i = 0; i < rows; i++) {
      const lNum = pinL++
      const rNum = pinR++
      const lLab = pinLabel()
      const rLab = pinLabel()
      const joint = rng() < 0.18 ? '|==|' : '|  |'
      const left = pad(`/--${String(lNum).padStart(2, '0')} ${lLab}`, 13)
      const right = `${String(rNum).padStart(3, ' ')} ${rLab}`
      const tail = rng() < 0.14 ? `--> ${pick(SIGNALS)}` : '---\\'
      queue.push(line(` ${left}${joint} ${pad(right, 10)}${tail}`))
    }
  }

  function bus() {
    queue.push(
      line('   \\---\\---\\      /---/---/'),
      line("    \\   \\   \\    /   /   /"),
      line('  ===+===+===+==+===+===+==='),
      line("    /   /   /    \\   \\   \\"),
    )
  }

  function xtal() {
    const mhz = 8 + Math.floor(rng() * 92)
    queue.push(
      line(''),
      line(` XTAL >--)|---${mhz}.000 MHZ---.`),
      line('          |        v4.0     |'),
      line("          '-----o----------'"),
    )
  }

  function gap() {
    const n = 1 + Math.floor(rng() * 2)
    for (let i = 0; i < n; i++) queue.push(line('     |        |'))
  }

  return () => {
    if (queue.length === 0) {
      // Cycle: header -> pins -> (bus | xtal | gap) -> pins -> ...
      const phase = block++ % 6
      if (phase === 0) header()
      else if (phase === 2 || phase === 4) pins()
      else if (phase === 1 || phase === 3) {
        const r = rng()
        if (r < 0.4) bus()
        else if (r < 0.6) xtal()
        else gap()
      } else {
        gap()
        if (pinL > 80) {
          pinL = 1
          pinR = 85
        }
      }
    }
    return queue.shift() ?? line('')
  }
}
