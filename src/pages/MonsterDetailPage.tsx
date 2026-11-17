import { Link } from 'react-router'
import { BESTIARY_PATH, type MonsterAbility, type MonsterDetails } from '../bestiary/srd'
import { useSrdResource } from '../bestiary/useSrdResource'

interface MonsterDetailPageProps {
  index: string
}

interface AbilitySectionProps {
  title: string
  abilities: readonly MonsterAbility[]
}

const fractionalRatings = new Map([
  [0.125, '1/8'],
  [0.25, '1/4'],
  [0.5, '1/2'],
])

function AbilitySection({ title, abilities }: AbilitySectionProps) {
  return (
    <section className="monster-abilities">
      <h2>{title}</h2>
      {abilities.length > 0 ? (
        <ul>
          {abilities.map((ability) => (
            <li key={ability.name}>
              <h3>{ability.name}</h3>
              <p>{ability.desc}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No {title.toLowerCase()} listed.</p>
      )}
    </section>
  )
}

function MonsterStatBlock({ monster }: { monster: MonsterDetails }) {
  const armorClass = monster.armor_class.map(({ value, type }) => value + ' (' + type + ')')
  const challengeRating = fractionalRatings.get(monster.challenge_rating) ?? monster.challenge_rating

  return (
    <article className="entry-detail">
      <h1>{monster.name}</h1>
      <dl className="monster-stats">
        <div>
          <dt>Armor Class (AC)</dt>
          <dd>{armorClass.join(', ')}</dd>
        </div>
        <div>
          <dt>Hit Points (HP)</dt>
          <dd>{monster.hit_points}</dd>
        </div>
        <div>
          <dt>Challenge Rating (CR)</dt>
          <dd>{challengeRating}</dd>
        </div>
      </dl>
      <AbilitySection title="Traits" abilities={monster.special_abilities ?? []} />
      <AbilitySection title="Actions" abilities={monster.actions ?? []} />
    </article>
  )
}

export default function MonsterDetailPage({ index }: MonsterDetailPageProps) {
  const { state, retry } = useSrdResource<MonsterDetails>('/monsters/' + encodeURIComponent(index))

  return (
    <>
      <Link className="back-link" to={BESTIARY_PATH}>Back to bestiary</Link>
      {state.status === 'loading' && <p role="status">Loading monster…</p>}
      {state.status === 'not-found' && <h1>Monster not found</h1>}
      {state.status === 'error' && (
        <div className="api-error">
          <p role="alert">Could not load this monster.</p>
          <button type="button" onClick={retry}>Retry</button>
        </div>
      )}
      {state.status === 'success' && <MonsterStatBlock monster={state.data} />}
    </>
  )
}
