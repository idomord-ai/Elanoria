import { Link, useSearchParams } from 'react-router'
import { entryKindGroups, getEntryKingdom, searchWorldEntries, type WorldEntry } from '../catalog/worldEntries'
import BackgroundMotionToggle, { type BackgroundMotion } from '../components/BackgroundMotionToggle'
import SearchInput from '../components/SearchInput'
import WorldEntryCard from '../components/WorldEntryCard'
import BestiaryList from './BestiaryList'
import './compendium.css'

type CatalogSource = 'elanor' | 'bestiary'
type EntryKindGroup = keyof typeof entryKindGroups
const kindGroups = Object.keys(entryKindGroups) as EntryKindGroup[]

interface CompendiumPageProps {
  entries: readonly WorldEntry[]
  queries: Record<CatalogSource, string>
  onQueryChange: (source: CatalogSource, query: string) => void
  backgroundMotion: BackgroundMotion
}

interface WorldEntriesProps {
  entries: readonly WorldEntry[]
  query: string
  group?: EntryKindGroup
  onGroupChange: (group?: EntryKindGroup) => void
}

function WorldEntries({ entries: allEntries, query, group, onGroupChange }: WorldEntriesProps) {
  const kinds = group ? entryKindGroups[group] : undefined
  const matches = searchWorldEntries(allEntries, query)
  const entries = kinds ? matches.filter((entry) => kinds.some((kind) => kind === entry.kind)) : matches
  const count = entries.length

  return (
    <>
      <div className="atlas-results__heading">
        <h2>World entries</h2>
        <p className="result-count" role="status">{count} {count === 1 ? 'entry' : 'entries'}</p>
      </div>
      <div className="atlas-filters" role="group" aria-label="Filter by entry type">
        <button type="button" aria-pressed={group === undefined} onClick={() => onGroupChange()}>
          All entries
        </button>
        {kindGroups.map((item) => (
          <button key={item} type="button" aria-pressed={group === item} onClick={() => onGroupChange(item)}>
            {item}
          </button>
        ))}
      </div>
      {count === 0 ? (
        <p className="atlas-empty">
          {query.trim() ? 'No entries match your search.' : 'No entries in this group yet.'}
        </p>
      ) : (
        <ul className="entry-grid">
          {entries.map((entry) => (
            <li key={entry.id}>
              <WorldEntryCard entry={entry} kingdom={getEntryKingdom(entry, allEntries)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default function CompendiumPage({ entries, queries, onQueryChange, backgroundMotion }: CompendiumPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const source = searchParams.get('source') === 'bestiary' ? 'bestiary' : 'elanor'
  const query = queries[source]
  const group = kindGroups.find((item) => item === searchParams.get('group'))
  const isBestiary = source === 'bestiary'
  const worldParams = new URLSearchParams(searchParams)
  worldParams.delete('source')
  const bestiaryParams = new URLSearchParams(worldParams)
  bestiaryParams.set('source', 'bestiary')

  return (
    <div className="atlas">
      <section className="atlas-hero" aria-labelledby="atlas-title">
        <img className="atlas-hero__art" src={import.meta.env.BASE_URL + 'elanor-atlas.webp'} alt="" fetchPriority="high" />
        <BackgroundMotionToggle {...backgroundMotion} />
        <div className="atlas-hero__content">
          <h1 id="atlas-title">Elanor Compendium</h1>
          <p>{isBestiary ? 'Find monsters and open their D&D stat blocks.' : 'Explore the people, places, and stories of the Seven Kingdoms.'}</p>
          <SearchInput
            value={query}
            onChange={(value) => onQueryChange(source, value)}
            placeholder={isBestiary ? 'Search monsters, e.g. Basilisk' : 'Search the atlas, e.g. Valciel'}
          />
        </div>
      </section>
      <nav className="catalog-sources" aria-label="Compendium sections">
        <Link to={{ search: worldParams.toString() }} aria-current={!isBestiary ? 'page' : undefined}>Elanor</Link>
        <Link to={{ search: bestiaryParams.toString() }} aria-current={isBestiary ? 'page' : undefined}>
          D&amp;D Bestiary
        </Link>
      </nav>
      <section className="atlas-results" aria-label={isBestiary ? 'D&D Bestiary results' : 'Elanor results'}>
        {isBestiary ? (
          <>
            <h2 className="atlas-results__title">D&amp;D Bestiary</h2>
            <BestiaryList query={query} />
          </>
        ) : (
          <WorldEntries
            entries={entries}
            query={query}
            group={group}
            onGroupChange={(selected) => {
              if (selected) worldParams.set('group', selected)
              else worldParams.delete('group')
              setSearchParams(worldParams, { replace: true })
            }}
          />
        )}
      </section>
    </div>
  )
}
