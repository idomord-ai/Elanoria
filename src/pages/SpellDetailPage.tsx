import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { fetchSpellDetail, isRulesEdition, type RulesEdition, type SpellDetail } from '../spells/spells'
import { SpellAttribution } from './SpellsPage'
import './spells.css'

type DetailState =
  | { status: 'loading' | 'not-found' | 'error' }
  | { status: 'success'; spell: SpellDetail }

function SpellEntry({ spell }: { spell: SpellDetail }) {
  const properties = [
    { label: 'Casting time', value: spell.castingTime },
    { label: 'Range', value: spell.range },
    { label: 'Components', value: spell.components?.join(', ') },
    { label: 'Duration', value: spell.duration },
  ].filter(({ value }) => value)

  return (
    <article className="entry-detail spell-detail">
      <header>
        <p className="entry-kind">{spell.edition} · {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}</p>
        <h1>{spell.name}</h1>
      </header>
      {properties.length > 0 && (
        <dl className="spell-detail__stats">
          {properties.map(({ label, value }) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      )}
      {spell.description.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      {spell.higherLevels.length > 0 && (
        <section>
          <h2>At higher levels</h2>
          {spell.higherLevels.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </section>
      )}
      <SpellAttribution edition={spell.edition} />
    </article>
  )
}

function SpellDetailContent({ edition, index }: { edition: RulesEdition; index: string }) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<DetailState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function load() {
      try {
        const spell = await fetchSpellDetail(edition, index, signal)
        if (!signal.aborted) setState(spell === null ? { status: 'not-found' } : { status: 'success', spell })
      } catch {
        if (!signal.aborted) setState({ status: 'error' })
      }
    }

    void load()
    return () => controller.abort()
  }, [edition, index, attempt])

  if (state.status === 'success') return <SpellEntry spell={state.spell} />
  if (state.status === 'not-found') return <h1 className="entry-detail">Spell not found</h1>
  if (state.status === 'loading') return <p role="status">Loading spell…</p>

  return (
    <div className="api-error">
      <p role="alert">Could not load this spell.</p>
      <button
        type="button"
        onClick={() => {
          setState({ status: 'loading' })
          setAttempt((previous) => previous + 1)
        }}
      >
        Retry
      </button>
    </div>
  )
}

export default function SpellDetailPage() {
  const { edition, index } = useParams<'edition' | 'index'>()
  const { state } = useLocation()
  const previous: unknown = state?.spellLibrarySearch
  const back = new URLSearchParams(typeof previous === 'string' ? previous : undefined)
  if (isRulesEdition(edition)) back.set('edition', edition)

  return (
    <>
      <Link className="back-link" to={{ pathname: '/spells', search: back.toString() }}>Back to spells</Link>
      {isRulesEdition(edition) && index ? (
        <SpellDetailContent key={`${edition}:${index}`} edition={edition} index={index} />
      ) : (
        <h1 className="entry-detail">Spell not found</h1>
      )}
    </>
  )
}
