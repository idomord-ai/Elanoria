import { useLocation, useSearchParams } from 'react-router'
import { getMonsterTypes, selectMonsters, type MonsterSortBy } from '../bestiary/monsterCatalog'
import { formatChallengeRating, MONSTER_ENTRY_PREFIX } from '../bestiary/srd'
import { useMonsterCatalog } from '../bestiary/useMonsterCatalog'
import CatalogCard from '../components/CatalogCard'
import './bestiary.css'

const challengeRatings = [0, 0.125, 0.25, 0.5, ...Array.from({ length: 30 }, (_, index) => index + 1)]
const sortOptions = {
  name: 'Name',
  cr: 'Challenge rating (CR)',
  hp: 'Hit points (HP)',
  ac: 'Armor class (AC)',
} satisfies Record<MonsterSortBy, string>

const typeGlyphs = new Map([
  ['aberration', '◉'],
  ['beast', '✣'],
  ['celestial', '☼'],
  ['construct', '▣'],
  ['dragon', '⟑'],
  ['elemental', '≈'],
  ['fey', '✧'],
  ['fiend', 'Ψ'],
  ['giant', '⛰︎'],
  ['humanoid', '⚑︎'],
  ['monstrosity', '⟐'],
  ['ooze', '◒'],
  ['plant', '❧'],
  ['swarm', '⁙'],
  ['undead', '☠︎'],
])

function typeGlyph(type: string): string {
  const lower = type.toLowerCase()
  return typeGlyphs.get(lower.startsWith('swarm of ') ? 'swarm' : lower) ?? '◇'
}

function readChallengeRating(value: string | null) {
  return challengeRatings.find((rating) => String(rating) === value)
}

function isSortBy(value: string | null): value is MonsterSortBy {
  return value !== null && Object.hasOwn(sortOptions, value)
}

interface ChallengeRatingSelectProps {
  label: string
  value?: number
  onChange: (value: string) => void
}

function ChallengeRatingSelect({ label, value, onChange }: ChallengeRatingSelectProps) {
  return (
    <label>
      {label}
      <select value={value ?? ''} onChange={(event) => onChange(event.currentTarget.value)}>
        <option value="">Any</option>
        {challengeRatings.map((rating) => <option key={rating} value={rating}>{formatChallengeRating(rating)}</option>)}
      </select>
    </label>
  )
}

export default function BestiaryList({ query }: { query: string }) {
  const { state, retry } = useMonsterCatalog()
  const [params, setParams] = useSearchParams()
  const { search } = useLocation()

  if (state.status === 'loading') {
    return <p role="status">Loading monsters…</p>
  }

  if (state.status === 'error') {
    return (
      <div className="api-error">
        <p role="alert">Could not load the bestiary.</p>
        <button type="button" onClick={retry}>Retry</button>
      </div>
    )
  }

  const types = getMonsterTypes(state.data)
  const type = types.find((candidate) => candidate === params.get('type'))
  const minCr = readChallengeRating(params.get('minCr'))
  const maxCr = readChallengeRating(params.get('maxCr'))
  const requestedSort = params.get('sort')
  const sortBy = isSortBy(requestedSort) ? requestedSort : 'name'
  const direction = params.get('order') === 'desc' ? 'desc' : 'asc'
  const invalidRange = minCr !== undefined && maxCr !== undefined && minCr > maxCr
  const monsters = invalidRange ? [] : selectMonsters(state.data, { query, type, minCr, maxCr, sortBy, direction })
  const count = monsters.length

  function update(name: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next, { replace: true })
  }

  return (
    <>
      <div className="bestiary-controls" role="group" aria-label="Bestiary filters and sorting">
        <label>
          Monster type
          <select value={type ?? ''} onChange={(event) => update('type', event.currentTarget.value)}>
            <option value="">All types</option>
            {types.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}
          </select>
        </label>
        <ChallengeRatingSelect label="Minimum CR" value={minCr} onChange={(value) => update('minCr', value)} />
        <ChallengeRatingSelect label="Maximum CR" value={maxCr} onChange={(value) => update('maxCr', value)} />
        <label>
          Sort by
          <select value={sortBy} onChange={(event) => update('sort', event.currentTarget.value)}>
            {Object.entries(sortOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          Sort direction
          <select value={direction} onChange={(event) => update('order', event.currentTarget.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
      </div>
      <p className="result-count" role="status">{count} {count === 1 ? 'monster' : 'monsters'}</p>
      {invalidRange ? (
        <p className="atlas-empty">Minimum CR must be less than or equal to maximum CR.</p>
      ) : count === 0 ? (
        <p className="atlas-empty">No monsters match your search and filters.</p>
      ) : (
        <ul className="entry-grid">
          {monsters.map((monster) => (
            <li key={monster.index}>
              <CatalogCard
                title={monster.name}
                kind={monster.type}
                tone="bestiary"
                glyph={typeGlyph(monster.type)}
                stats={[
                  { label: 'CR', value: formatChallengeRating(monster.challengeRating) },
                  { label: 'HP', value: monster.hitPoints },
                  { label: 'AC', value: monster.armorClass ?? '—' },
                ]}
                to={'/compendium/' + MONSTER_ENTRY_PREFIX + encodeURIComponent(monster.index)}
                state={{ bestiarySearch: search }}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
