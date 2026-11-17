import { Link } from 'react-router'
import { MONSTER_ENTRY_PREFIX, searchMonsters, type MonsterListResponse } from '../bestiary/srd'
import { useSrdResource } from '../bestiary/useSrdResource'

interface BestiaryListProps {
  query: string
}

export default function BestiaryList({ query }: BestiaryListProps) {
  const { state, retry } = useSrdResource<MonsterListResponse>('/monsters')

  if (state.status === 'loading') {
    return <p role="status">Loading monsters…</p>
  }

  if (state.status !== 'success') {
    return (
      <div className="api-error">
        <p role="alert">Could not load the bestiary.</p>
        <button type="button" onClick={retry}>Retry</button>
      </div>
    )
  }

  const monsters = searchMonsters(state.data.results, query)
  const count = monsters.length

  if (count === 0) {
    return <p className="result-count" role="status">No monsters match your search.</p>
  }

  return (
    <>
      <p className="result-count" role="status">{count} {count === 1 ? 'monster' : 'monsters'}</p>
      <ul className="entry-grid">
        {monsters.map((monster) => (
          <li className="world-entry" key={monster.index}>
            <h2>
              <Link
                className="entry-link"
                to={'/compendium/' + MONSTER_ENTRY_PREFIX + encodeURIComponent(monster.index)}
              >
                {monster.name}
              </Link>
            </h2>
          </li>
        ))}
      </ul>
    </>
  )
}
