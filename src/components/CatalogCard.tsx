import { useId } from 'react'
import { Link } from 'react-router'
import './catalogCards.css'

export type CatalogCardTone = 'actors' | 'places' | 'magic' | 'lore' | 'campaign' | 'bestiary'

interface CatalogCardProps {
  title: string
  kind: string
  tone: CatalogCardTone
  to: string
  summary?: string
}

export default function CatalogCard({ title, kind, tone, to, summary }: CatalogCardProps) {
  const titleId = useId()

  return (
    <Link className={`atlas-card atlas-card--${tone}`} data-kind={kind} to={to} aria-labelledby={titleId}>
      <span className="atlas-card__glyph" aria-hidden="true"><span /></span>
      <div className="atlas-card__heading">
        <p className="atlas-card__kind">{kind}</p>
        <h3 className="atlas-card__title" id={titleId}>{title}</h3>
      </div>
      <span className="atlas-card__arrow" aria-hidden="true" />
      {summary && <p className="atlas-card__summary">{summary}</p>}
    </Link>
  )
}
