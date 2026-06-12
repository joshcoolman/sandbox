'use client'

// WAR ROOM — a wall of live sci-fi HUD panels. This file is purely
// composition: fonts + provider + one arrangement of self-contained panels.
// Every panel fills whatever container it's dropped into (the composable
// contract), so re-blocking this grid is just CSS.

import { Rajdhani, Share_Tech_Mono } from 'next/font/google'
import { HudProvider } from './lib/context'
import { Panel } from './components/Panel'
import { MapPanel } from './components/MapPanel'
import { GlobePanel } from './components/GlobePanel'
import { SatellitePanel } from './components/SatellitePanel'
import { SchematicPanel } from './components/SchematicPanel'
import { TargetRoster } from './components/TargetRoster'
import { DossierPanel } from './components/DossierPanel'
import { TickerPanel } from './components/TickerPanel'
import { SpectrumPanel } from './components/SpectrumPanel'
import { LcdPanel } from './components/LcdPanel'
import { CrtOverlay } from './components/CrtOverlay'
import './styles.css'

const display = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--wr-display',
})

const mono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--wr-mono',
})

export default function WarRoomPage() {
  return (
    <HudProvider>
      <div className={`war-room ${display.variable} ${mono.variable}`}>
        <Panel title="GLOBAL TRACK / THEATER MAP" className="wr-area-map">
          <MapPanel />
        </Panel>
        <Panel title="ORBITAL VIEW" className="wr-area-globe">
          <GlobePanel />
        </Panel>
        <Panel title="ASSET KH-11 / TELEMETRY" className="wr-area-sat">
          <SatellitePanel />
        </Panel>
        <Panel title="BUS DIAGNOSTIC" accent="green" className="wr-area-schem">
          <SchematicPanel />
        </Panel>
        <Panel title="TARGET ROSTER" className="wr-area-roster">
          <TargetRoster />
        </Panel>
        <Panel title="EVENT LOG" className="wr-area-ticker">
          <TickerPanel />
        </Panel>
        <Panel title="SIGINT" className="wr-area-spectrum">
          <SpectrumPanel />
        </Panel>
        <Panel title="CONDITION" accent="lcd" className="wr-area-lcd">
          <LcdPanel />
        </Panel>
        <DossierPanel />
        <CrtOverlay />
      </div>
    </HudProvider>
  )
}
