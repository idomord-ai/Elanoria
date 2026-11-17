import { Link } from 'react-router'
import type { WorldEntry } from '../catalog/worldEntries'

interface WorldEntryCardProps {
  entry: WorldEntry
}

export default function WorldEntryCard({ entry }: WorldEntryCardProps) {
  return (
    <article className="world-entry">
      <p className="entry-kind">{entry.kind}</p>
      <h2>
        <Link className="entry-link" to={entry.id}>{entry.title}</Link>
      </h2>
      <p className="entry-summary">{entry.summary}</p>
    </article>
  )
}
