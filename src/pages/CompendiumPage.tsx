import { Link, useSearchParams } from 'react-router'
import { BESTIARY_PATH } from '../bestiary/srd'
import { searchWorldEntries, worldEntries } from '../catalog/worldEntries'
import SearchInput from '../components/SearchInput'
import WorldEntryCard from '../components/WorldEntryCard'
import BestiaryList from './BestiaryList'

type CatalogSource = 'elanor' | 'bestiary'

interface CompendiumPageProps {
  queries: Record<CatalogSource, string>
  onQueryChange: (source: CatalogSource, query: string) => void
}

function WorldEntries({ query }: { query: string }) {
  const entries = searchWorldEntries(worldEntries, query)
  const count = entries.length

  return (
    <>
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

export default function CompendiumPage({ queries, onQueryChange }: CompendiumPageProps) {
  const [searchParams] = useSearchParams()
  const source = searchParams.get('source') === 'bestiary' ? 'bestiary' : 'elanor'
  const query = queries[source]

  return (
    <>
      <h1>Elanor Compendium</h1>
      <nav className="catalog-sources" aria-label="Compendium sections">
        <Link to="/compendium" aria-current={source === 'elanor' ? 'page' : undefined}>Elanor</Link>
        <Link to={BESTIARY_PATH} aria-current={source === 'bestiary' ? 'page' : undefined}>D&amp;D Bestiary</Link>
      </nav>
      <SearchInput
        value={query}
        onChange={(value) => onQueryChange(source, value)}
        placeholder={source === 'bestiary' ? 'e.g. Basilisk' : undefined}
      />
      {source === 'bestiary' ? <BestiaryList query={query} /> : <WorldEntries query={query} />}
    </>
  )
}
