// 16-step pentatonic starter loop seeded into Monono's embedded sequencer.
// Rows top→bottom: E5, D5, C5, A4, G4, E4, D4, C4. true = lit pad.
// Resets to this on every page load (session-only state).
export const MONONO_STARTER_PATTERN: boolean[][] = [
  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true,  false], // E5 sparkle
  [false, false, false, false, false, false, false, false, true,  false, false, false, false, false, false, false], // D5 accent
  [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false], // C5 downbeat accents
  [true,  false, false, false, false, false, false, false, true,  false, false, false, false, false, false, false], // A4 melody anchor
  [false, false, true,  false, false, false, false, false, false, false, true,  false, false, false, false, false], // G4 mid-melody
  [false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false], // E4 offbeat 8ths
  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true,  false], // D4 lift
  [true,  false, false, false, false, false, false, false, true,  false, false, false, false, false, false, false], // C4 kick on 1 & 9
]
