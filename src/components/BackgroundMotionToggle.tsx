import './backgroundMotion.css'

export interface BackgroundMotion {
  paused: boolean
  onToggle: () => void
}

export default function BackgroundMotionToggle({ paused, onToggle }: BackgroundMotion) {
  return (
    <button className="background-motion-toggle" type="button" onClick={onToggle}>
      <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
      {paused ? 'Resume background motion' : 'Pause background motion'}
    </button>
  )
}
