// Made-up mission-briefing data, one dossier per image. People get operative
// files; the two location shots (city, brutalist) get site-intel files — same
// shape, different labels — so the roster reads like a real briefing.

export type Dossier = {
  label: string
  codename: string
  classification: string
  rows: { k: string; v: string }[]
  ref: string
}

const DOSSIERS: Record<string, Dossier> = {
  '/ascii-reveal/face.jpg': {
    label: 'OPERATIVE DOSSIER',
    codename: 'VESPER',
    classification: 'FIELD OPERATIVE · ACTIVE',
    rows: [
      { k: 'ORIGIN', v: 'PRAGUE, CZ' },
      { k: 'SPECIALTY', v: 'INFILTRATION / CQC' },
      { k: 'LANGUAGES', v: '6 — NATIVE FLUENCY' },
      { k: 'CLEARANCE', v: 'OMEGA-7' },
    ],
    ref: 'REF 0x4F2A-117 · 50.0755N 14.4378E',
  },
  '/ascii-reveal/hand.jpg': {
    label: 'OPERATIVE DOSSIER',
    codename: 'QUILL',
    classification: 'ASSET · DEEP COVER',
    rows: [
      { k: 'ORIGIN', v: 'LISBON, PT' },
      { k: 'SPECIALTY', v: 'FORGERY / BYPASS' },
      { k: 'LAST SEEN', v: '41 DAYS AGO' },
      { k: 'CLEARANCE', v: 'SIGMA-3' },
    ],
    ref: 'REF 0x9C18-204 · 38.7223N 9.1393W',
  },
  '/ascii-reveal/dance.jpg': {
    label: 'OPERATIVE DOSSIER',
    codename: 'KESTREL',
    classification: 'FIELD OPERATIVE · ACTIVE',
    rows: [
      { k: 'ORIGIN', v: 'HAVANA, CU' },
      { k: 'SPECIALTY', v: 'SURVEILLANCE / EVASION' },
      { k: 'COVER', v: 'STAGE PERFORMER' },
      { k: 'CLEARANCE', v: 'OMEGA-5' },
    ],
    ref: 'REF 0x71BD-088 · 23.1136N 82.3666W',
  },
  '/ascii-reveal/skate.jpg': {
    label: 'OPERATIVE DOSSIER',
    codename: 'MAGPIE',
    classification: 'COURIER · ACTIVE',
    rows: [
      { k: 'ORIGIN', v: 'OSAKA, JP' },
      { k: 'SPECIALTY', v: 'EXFIL / FREERUN' },
      { k: 'RESPONSE', v: '< 4 MIN CITYWIDE' },
      { k: 'CLEARANCE', v: 'SIGMA-6' },
    ],
    ref: 'REF 0x2E55-019 · 34.6937N 135.5023E',
  },
  '/ascii-reveal/city.jpg': {
    label: 'SITE INTELLIGENCE',
    codename: 'GREY HARBOR',
    classification: 'TARGET SITE · HOSTILE',
    rows: [
      { k: 'SECTOR', v: 'DISTRICT 9 — UPPER' },
      { k: 'SECURITY', v: 'TIER IV / ARMED' },
      { k: 'WINDOW', v: '02:00 – 02:40' },
      { k: 'EXTRACTION', v: 'ROOFTOP / VTOL' },
    ],
    ref: 'GRID 0xAA0F-552 · 40.7128N 74.0060W',
  },
  '/ascii-reveal/brutalist.jpg': {
    label: 'SITE INTELLIGENCE',
    codename: 'BLACK CONCORD',
    classification: 'SAFEHOUSE · SECURE',
    rows: [
      { k: 'SECTOR', v: 'SUBLEVEL 2' },
      { k: 'STATUS', v: 'SWEPT — CLEAN' },
      { k: 'CACHE', v: 'STOCKED / SEALED' },
      { k: 'ACCESS', v: 'BIOMETRIC' },
    ],
    ref: 'GRID 0x5D7C-310 · 51.5074N 0.1278W',
  },
  '/ascii-reveal/scarlet.jpg': {
    label: 'OPERATIVE DOSSIER',
    codename: 'CRIMSON',
    classification: 'FIELD OPERATIVE · ACTIVE',
    rows: [
      { k: 'ORIGIN', v: 'NEW YORK, US' },
      { k: 'SPECIALTY', v: 'CLOSE-ACCESS / INTEL' },
      { k: 'COVER', v: 'GALLERIST' },
      { k: 'CLEARANCE', v: 'OMEGA-7' },
    ],
    ref: 'REF 0x6D2C-071 · 40.7580N 73.9855W',
  },
  '/ascii-reveal/stark.jpg': {
    label: 'OPERATIVE DOSSIER',
    codename: 'LIVEWIRE',
    classification: 'FIELD OPERATIVE · VOLATILE',
    rows: [
      { k: 'ORIGIN', v: 'LOS ANGELES, US' },
      { k: 'SPECIALTY', v: 'DEMOLITION / IMPROV' },
      { k: 'NOTE', v: 'USE WITH CAUTION' },
      { k: 'CLEARANCE', v: 'SIGMA-5' },
    ],
    ref: 'REF 0x0E66-313 · 34.0522N 118.2437W',
  },
  '/ascii-reveal/cuffs.jpg': {
    label: 'OPERATIVE DOSSIER',
    codename: 'HOUDINI',
    classification: 'ASSET · DETAINED',
    rows: [
      { k: 'ORIGIN', v: 'MARSEILLE, FR' },
      { k: 'SPECIALTY', v: 'ESCAPE / EVASION' },
      { k: 'STATUS', v: 'IN CUSTODY — 12 DAYS' },
      { k: 'CLEARANCE', v: 'SIGMA-2' },
    ],
    ref: 'REF 0x8A41-905 · 43.2965N 5.3698E',
  },
  '/ascii-reveal/prince.jpg': {
    label: 'OPERATIVE DOSSIER',
    codename: 'REGENT',
    classification: 'FIELD OPERATIVE · ACTIVE',
    rows: [
      { k: 'ORIGIN', v: 'MINNEAPOLIS, US' },
      { k: 'SPECIALTY', v: 'NEGOTIATION / CHARM' },
      { k: 'COVER', v: 'TOURING MUSICIAN' },
      { k: 'CLEARANCE', v: 'OMEGA-6' },
    ],
    ref: 'REF 0x1F09-238 · 44.9778N 93.2650W',
  },
  '/ascii-reveal/bunny.jpg': {
    label: 'OPERATIVE DOSSIER',
    codename: 'WARREN',
    classification: 'FIELD OPERATIVE · ERRATIC',
    rows: [
      { k: 'ORIGIN', v: 'BERLIN, DE' },
      { k: 'SPECIALTY', v: 'DISGUISE / MISDIRECTION' },
      { k: 'COVER', v: 'STREET PERFORMER' },
      { k: 'CLEARANCE', v: 'SIGMA-4' },
    ],
    ref: 'REF 0x3B7E-442 · 52.5200N 13.4050E',
  },
  '/ascii-reveal/smoking.jpg': {
    label: 'OPERATIVE DOSSIER',
    codename: 'DOWAGER',
    classification: 'HANDLER · ACTIVE',
    rows: [
      { k: 'ORIGIN', v: 'AMSTERDAM, NL' },
      { k: 'SPECIALTY', v: 'NETWORK / LOGISTICS' },
      { k: 'COVER', v: 'MARKET VENDOR' },
      { k: 'CLEARANCE', v: 'OMEGA-4' },
    ],
    ref: 'REF 0xC93F-560 · 52.3676N 4.9041E',
  },
}

export function getDossier(src: string): Dossier | null {
  return DOSSIERS[src] ?? null
}
