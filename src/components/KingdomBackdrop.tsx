import type { KingdomTheme } from '../catalog/kingdomThemes'
import './kingdomBackdrop.css'

export default function KingdomBackdrop({ theme }: { theme: KingdomTheme }) {
  return (
    <div key={theme} className="kingdom-backdrop" data-kingdom-theme={theme} aria-hidden="true">
      <img
        className="kingdom-backdrop__art"
        src={`${import.meta.env.BASE_URL}kingdoms/${theme}.jpg`}
        alt=""
        decoding="async"
      />
      <span className="kingdom-backdrop__motion" />
    </div>
  )
}
