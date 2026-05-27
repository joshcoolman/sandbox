type Props = {
  enabled: boolean
  onToggle: () => void
}

export function MusicSwitch({ enabled, onToggle }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Background music"
      className={`monono-music-switch ${enabled ? 'is-on' : 'is-off'}`}
      onClick={onToggle}
    >
      <span className="monono-music-switch__glyph" aria-hidden>♪</span>
      <span className="monono-music-switch__thumb" />
    </button>
  )
}
