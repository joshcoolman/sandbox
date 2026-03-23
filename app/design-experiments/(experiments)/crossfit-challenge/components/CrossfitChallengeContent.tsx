'use client'

import { useState } from 'react'
import { designers } from '../data/designers'
import DesignBrutalV2 from './DesignBrutalV2'
import DesignMinimalV2 from './DesignMinimalV2'
import DesignEditorialV2 from './DesignEditorialV2'
import DesignTechDataV2 from './DesignTechDataV2'
import '../styles.css'

const designComponents: Record<string, React.ComponentType> = {
  brutal: DesignBrutalV2,
  minimal: DesignMinimalV2,
  editorial: DesignEditorialV2,
  'tech-data': DesignTechDataV2,
}

export function CrossfitChallengeContent() {
  const [selected, setSelected] = useState<string | null>(null)

  if (selected) {
    const DesignComponent = designComponents[selected]
    return (
      <div className="fullpage-overlay">
        <button className="back-button" onClick={() => setSelected(null)}>
          Back to Gallery
        </button>
        <div className="fullpage-content">
          <DesignComponent />
        </div>
      </div>
    )
  }

  return (
    <div className="showcase">
      <div className="showcase-header">
        <span className="day-badge">Day 2</span>
        <h1>CrossFit Design Challenge</h1>
        <p>Dark mode, animation, and data visualization. Same four designers, elevated execution.</p>
      </div>
      <div className="gallery-grid">
        {designers.map((designer) => {
          const DesignComponent = designComponents[designer.id]
          return (
            <div
              key={designer.id}
              className="gallery-card"
              style={{ '--accent': designer.accent } as React.CSSProperties}
              onClick={() => setSelected(designer.id)}
            >
              <div className="card-preview">
                <div className="card-preview-inner">
                  <DesignComponent />
                </div>
              </div>
              <div className="card-info">
                <h3>{designer.name}</h3>
                <span className="card-subtitle">Agentic Designer</span>
                <div className="card-tags">
                  {designer.tags.map((tag) => (
                    <span key={tag} className="card-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <article className="story">
        <div className="story-inner">
          <h2 className="story-heading">Day 2: Leveling Up</h2>

          <div className="story-body">
            <p>
              Day 1 proved that four autonomous agents could each produce a distinct, fully-realized homepage from the same brief. Day 2 asks a harder question: can they evolve their own work under new constraints?
            </p>

            <p>
              The brief added three requirements: dark mode across all designs, meaningful animation, and at least one data visualization per design. Same gym content, same personas, dramatically different execution.
            </p>

            <h3>The Dark Mode Constraint</h3>
            <p>
              Two designs -- Marcus Voss's brutal approach and James Chen's tech-data dashboard -- were already dark. For them, the constraint was about pushing further. For Elise Nakamura and Sofia Reyes, it meant a fundamental transformation: flipping light, airy designs to dark without losing their identity. Nakamura's minimalist restraint had to survive the shift from off-white to near-black. Reyes's warm editorial warmth had to translate to dark magazine spreads.
            </p>

            <h3>Animation as Communication</h3>
            <p>
              The animation constraint wasn't about decoration -- it was about motion that serves the design. Voss went aggressive with glitch effects and hard transitions. Nakamura chose subtle fades and reveals. Reyes used scroll-driven storytelling. Chen animated his charts and dashboards to feel alive. Each approach reflected the persona, not a one-size-fits-all animation library.
            </p>

            <h3>Data Visualization</h3>
            <p>
              This was the most revealing constraint. Every designer had to find a way to present data that fit their aesthetic. Chen went hardest -- animated charts, live-feeling metrics, gradient-filled graphs. Voss made data feel raw and industrial. Nakamura stripped charts down to their essence. Reyes wove data into her editorial narrative like infographics in a magazine feature.
            </p>

            <h3>The Process</h3>
            <p>
              Same as Day 1: four parallel agents, each working autonomously with their persona and Day 1 design as reference. The lead agent coordinated task assignment and dependency installation. Each agent chose their own tech stack for animation and charting. The entire build was done in Claude Code with zero manual file editing.
            </p>
          </div>
        </div>
      </article>
    </div>
  )
}
