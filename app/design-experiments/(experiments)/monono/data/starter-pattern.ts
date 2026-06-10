// 16-step starter loop seeded into Monono's embedded sequencer.
// Rows top→bottom match the sequencer's 11-row layout:
// lead E5, D5, C5, A4, G4 · bass C3, G2, C2 · drums HAT, CLP, KCK.
// Gentle by design (no clap, soft kick anchor) — Monono is J-pop, not techno.
// Resets to this on every page load (session-only state).
export const MONONO_STARTER_PATTERN: boolean[][] = [
  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true,  false], // E5 sparkle
  [false, false, false, false, false, false, false, false, true,  false, false, false, false, false, false, false], // D5 accent
  [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false], // C5 downbeat accents
  [true,  false, false, false, false, false, false, false, true,  false, false, false, false, false, false, false], // A4 melody anchor
  [false, false, true,  false, false, false, false, false, false, false, true,  false, false, false, false, false], // G4 mid-melody
  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true,  false], // C3 lift
  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // G2
  [true,  false, false, false, false, false, false, false, true,  false, false, false, false, false, false, false], // C2 sub anchor on 1 & 9
  [false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false], // HAT offbeat 8ths
  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // CLP
  [true,  false, false, false, false, false, false, false, true,  false, false, false, false, false, false, false], // KCK on 1 & 9
]
