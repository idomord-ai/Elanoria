import { Link } from 'react-router'
import { PLAYER_CHARACTER_KIND, type WorldEntry } from '../catalog/worldEntries'
import { editionNames } from '../characters/characterSheets'
import CatalogCard from '../components/CatalogCard'
import './characters.css'

export default function CharactersPage({ entries }: { entries: readonly WorldEntry[] }) {
  const characters = entries.filter((entry) => entry.kind === PLAYER_CHARACTER_KIND)

  return (
    <div className="character-roster">
      <header className="character-roster__header">
        <div>
          <h1>Characters</h1>
          <p>Player characters and their sheets.</p>
        </div>
        <Link className="character-roster__create" to="/editor?kind=pc">Create player character</Link>
      </header>
      {characters.length ? (
        <ul className="character-roster__list" aria-label="Player characters">
          {characters.map((entry) => (
            <li key={entry.id}>
              <CatalogCard
                title={entry.title}
                kind={entry.characterSheet ? editionNames[entry.characterSheet.edition] : 'Player character'}
                tone="actors"
                summary={entry.summary}
                to={'/characters/' + encodeURIComponent(entry.id)}
              />
            </li>
          ))}
        </ul>
      ) : <p className="character-roster__empty">Create a player character to start a sheet.</p>}
    </div>
  )
}
