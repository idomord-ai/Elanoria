import type { WorldEntry } from '../catalog/worldEntries'

interface WorldEntryCardProps {
  entry: WorldEntry
}

export default function WorldEntryCard({ entry }: WorldEntryCardProps) {
  return (
    <article className="world-entry">
      <p className="entry-kind">{entry.kind}</p>
      <h2>{entry.title}</h2>
      <p className="entry-summary">{entry.summary}</p>
    </article>
  )
}
