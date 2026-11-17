import { useState } from 'react'
import { searchWorldEntries, worldEntries } from './catalog/worldEntries'
import SearchInput from './components/SearchInput'
import WorldEntryCard from './components/WorldEntryCard'

export default function App() {
  const [query, setQuery] = useState('')
  const entries = searchWorldEntries(worldEntries, query)
  const count = entries.length

  return (
    <>
      <header className="site-header">
        <div className="frame brand">Elanoria</div>
      </header>
      <main className="frame catalog">
        <h1>Elanor Compendium</h1>
        <SearchInput value={query} onChange={setQuery} />
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
      </main>
    </>
  )
}
