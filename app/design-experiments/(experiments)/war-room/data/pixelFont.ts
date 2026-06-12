// 5x7 dot-matrix pixel font for the LCD panel (Nokia-style: solid dark
// pixels on a lit background). Each glyph is 7 rows of 5 bits, MSB left.

const GLYPHS: Record<string, number[]> = {
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
  '3': [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  '6': [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11100, 0b10010, 0b10001, 0b10001, 0b10001, 0b10010, 0b11100],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  ':': [0b00000, 0b00100, 0b00100, 0b00000, 0b00100, 0b00100, 0b00000],
  '-': [0b00000, 0b00000, 0b00000, 0b01110, 0b00000, 0b00000, 0b00000],
  '.': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100],
  '/': [0b00001, 0b00010, 0b00010, 0b00100, 0b01000, 0b01000, 0b10000],
  ' ': [0, 0, 0, 0, 0, 0, 0],
}

export const GLYPH_W = 5
export const GLYPH_H = 7

/** Pixel width of a string at cell size `px` (1 cell of tracking per char). */
export function pixelTextWidth(text: string, px: number): number {
  return text.length * (GLYPH_W + 1) * px - px
}

/**
 * Draw dot-matrix text. Each lit bit becomes a square of `px-gap` so the
 * pixel grid stays visible — the LCD look. fillStyle must be set by caller.
 */
export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  px: number,
  gap = Math.max(0.5, px * 0.18),
) {
  const upper = text.toUpperCase()
  for (let c = 0; c < upper.length; c++) {
    const glyph = GLYPHS[upper[c]] ?? GLYPHS[' ']
    const gx = x + c * (GLYPH_W + 1) * px
    for (let row = 0; row < GLYPH_H; row++) {
      const bits = glyph[row]
      for (let col = 0; col < GLYPH_W; col++) {
        if (bits & (1 << (GLYPH_W - 1 - col))) {
          ctx.fillRect(gx + col * px, y + row * px, px - gap, px - gap)
        }
      }
    }
  }
}
