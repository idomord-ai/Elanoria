import { useId } from 'react'
import { Link } from 'react-router'
import type { KingdomTheme } from '../catalog/kingdomThemes'
import './catalogCards.css'
import './kingdomPalette.css'

export type CatalogCardTone = 'actors' | 'places' | 'magic' | 'lore' | 'campaign' | 'bestiary'

interface CatalogCardProps {
  title: string
  kind: string
  tone: CatalogCardTone
  to: string
  summary?: string
  glyph?: string
  stats?: readonly { label: string; value: number | string }[]
  state?: unknown
  kingdomTheme?: KingdomTheme
  kingdomName?: string
}

export default function CatalogCard({ title, kind, tone, to, summary, glyph, stats, state, kingdomTheme, kingdomName }: CatalogCardProps) {
  const titleId = useId()

  return (
    <Link className={`atlas-card atlas-card--${tone}`} data-kind={kind} data-realm-theme={kingdomTheme} to={to} state={state} aria-labelledby={titleId}>
      <span className="atlas-card__glyph" aria-hidden="true" data-glyph={glyph}><span>{glyph}</span></span>
      <div className="atlas-card__heading">
        <p className="atlas-card__kind">{kind}{kingdomName && ` · ${kingdomName}`}</p>
        <h3 className="atlas-card__title" id={titleId}>{title}</h3>
      </div>
      <span className="atlas-card__arrow" aria-hidden="true" />
      {summary && <p className="atlas-card__summary">{summary}</p>}
      {stats && (
        <dl className="atlas-card__stats">
          {stats.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Link>
  )
}
