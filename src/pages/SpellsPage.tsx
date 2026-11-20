import { useSearchParams } from 'react-router'
import CatalogCard from '../components/CatalogCard'
import SearchInput from '../components/SearchInput'
import { isRulesEdition, rulesEditions, searchSpells, spellKey, spellPath, type RulesEdition } from '../spells/spells'
import { useSpellCatalog } from '../spells/useSpellCatalog'
import './spells.css'

export function SpellAttribution({ edition }: { edition: RulesEdition }) {
  const legacy = edition === '2014'
  const version = legacy ? '5.1' : '5.2'
  const source = legacy ? 'https://dnd.wizards.com/resources/systems-reference-document' : 'https://www.dndbeyond.com/srd'

  return (
    <p className="spell-attribution">
      This work includes material {legacy ? 'taken ' : ''}from the System Reference Document {version} (“SRD {version}”)
      by Wizards of the Coast LLC{legacy ? ' and' : ','} available at <a href={source}>the D&amp;D SRD website</a>.
      {' '}The SRD {version} is licensed under the{' '}
      <a href="https://creativecommons.org/licenses/by/4.0/legalcode">Creative Commons Attribution 4.0 International License</a>.
    </p>
  )
}

export default function SpellsPage() {
  const [params, setParams] = useSearchParams()
  const selectedEdition = params.get('edition')
  const edition = isRulesEdition(selectedEdition) ? selectedEdition : '2014'
  const query = params.get('q') ?? ''
  const { spells, loading, error, retry } = useSpellCatalog(edition)
  const results = searchSpells(spells, query)

  function update(key: 'edition' | 'q', value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: key === 'q' })
  }

  return (
    <div className="atlas spell-library">
      <header className="spell-library__header">
        <h1>Spells</h1>
        <div className="spell-library__filters">
          <SearchInput value={query} onChange={(value) => update('q', value)} placeholder="e.g. Counterspell" />
          <label className="editor-field">
            Rules edition
            <select value={edition} onChange={(event) => update('edition', event.currentTarget.value)}>
              {rulesEditions.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
        </div>
      </header>
      {loading && <p role="status">Loading spells…</p>}
      {error && (
        <div className="api-error">
          <p role="alert">{error}</p>
          <button type="button" onClick={retry}>Retry</button>
        </div>
      )}
      {!loading && !error && (
        <>
          <p className="result-count" role="status">{results.length} {results.length === 1 ? 'spell' : 'spells'}</p>
          {results.length === 0 ? (
            <p className="atlas-empty">{query.trim() ? 'No spells match your search.' : 'No spells are available for this edition.'}</p>
          ) : (
            <ul className="spell-library__list" aria-label={`${edition} spells`}>
              {results.map((spell) => (
                <li key={spellKey(spell)}>
                  <CatalogCard
                    title={spell.name}
                    kind={spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                    tone="magic"
                    glyph="✧"
                    to={spellPath(spell)}
                    state={{ spellLibrarySearch: params.toString() }}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <SpellAttribution edition={edition} />
    </div>
  )
}
