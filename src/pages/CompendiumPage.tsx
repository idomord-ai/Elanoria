import { searchWorldEntries, worldEntries } from '../catalog/worldEntries'
import SearchInput from '../components/SearchInput'
import WorldEntryCard from '../components/WorldEntryCard'

interface CompendiumPageProps {
  query: string
  onQueryChange: (query: string) => void
}

export default function CompendiumPage({ query, onQueryChange }: CompendiumPageProps) {
  const entries = searchWorldEntries(worldEntries, query)
  const count = entries.length

  return (
    <>
      <h1>Elanor Compendium</h1>
      <SearchInput value={query} onChange={onQueryChange} />
      <p className="result-count" role="status">
        {count === 0 ? 'No entries match your search.' : `${count} ${count === 1 ? 'entry' : 'entries'}`}
      </p>
      <ul className="entry-grid">
        {entries.map((entry) => (
          <li key={entry.id}>
            <WorldEntryCard entry={entry} />
          </li>
        ))}
      </ul>
    </>
  )
}
