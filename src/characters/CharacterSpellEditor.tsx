import { useState } from 'react'
import { Link } from 'react-router'
import { isRulesEdition, rulesEditions, searchSpells, spellKey, spellPath, type RulesEdition, type SpellReference } from '../spells/spells'
import { useSpellCatalog } from '../spells/useSpellCatalog'
import type { CharacterEdition } from './characterSheets'
import './characterSpells.css'

interface SpellLinksProps {
  spells: readonly SpellReference[]
  onRemove?: (spell: SpellReference) => void
}

export function CharacterSpellLinks({ spells, onRemove }: SpellLinksProps) {
  return (
    <ul className="character-spells__list">
      {spells.map((spell) => (
        <li key={spellKey(spell)}>
          <span className="character-spells__label">
            {onRemove ? spell.name : <Link to={spellPath(spell)}>{spell.name}</Link>}
            <small>{spell.edition}</small>
          </span>
          {onRemove && (
            <button type="button" aria-label={`Remove ${spell.name} (${spell.edition})`} onClick={() => onRemove(spell)}>
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

interface SpellPickerProps {
  initialEdition: RulesEdition
  selected: ReadonlySet<string>
  onAdd: (spell: SpellReference) => void
}

const resultLimit = 8

function SpellPicker({ initialEdition, selected, onAdd }: SpellPickerProps) {
  const [edition, setEdition] = useState(initialEdition)
  const [query, setQuery] = useState('')
  const { spells, loading, error, retry } = useSpellCatalog(edition)
  const matches = searchSpells(spells, query)

  return (
    <div className="character-spells__picker">
      <div className="character-form__fields">
        <label className="editor-field">
          Spell edition
          <select value={edition} onChange={(event) => {
            const value = event.currentTarget.value
            if (isRulesEdition(value)) setEdition(value)
          }}>
            {rulesEditions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="editor-field">
          Find a spell
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault() }}
          />
        </label>
      </div>
      {loading && <p role="status">Loading spells…</p>}
      {error && (
        <div className="character-spells__status">
          <p className="editor-error" role="alert">{error}</p>
          <button type="button" onClick={retry}>Retry</button>
        </div>
      )}
      {!loading && !error && (
        <>
          <p className="character-spells__count" role="status">
            {matches.length ? `Showing ${Math.min(matches.length, resultLimit)} of ${matches.length}` : 'No matching spells.'}
          </p>
          {matches.length > 0 && (
            <ul className="character-spells__list">
              {matches.slice(0, resultLimit).map((spell) => {
                const added = selected.has(spellKey(spell))
                return (
                  <li key={spellKey(spell)}>
                    <span className="character-spells__label">
                      {spell.name}
                      <small>{spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}</small>
                    </span>
                    <button type="button" disabled={added} aria-label={`Add ${spell.name} (${spell.edition})`} onClick={() => onAdd(spell)}>
                      {added ? 'Added' : 'Add'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

interface CharacterSpellEditorProps {
  spells: SpellReference[]
  sheetEdition: CharacterEdition
  onChange: (spells: SpellReference[]) => void
}

export default function CharacterSpellEditor({ spells, sheetEdition, onChange }: CharacterSpellEditorProps) {
  const [pickerOpened, setPickerOpened] = useState(false)
  const selected = new Set(spells.map(spellKey))

  return (
    <fieldset className="character-form__section character-spells">
      <legend>Spells</legend>
      {spells.length > 0 && (
        <CharacterSpellLinks spells={spells} onRemove={(spell) => onChange(spells.filter((item) => spellKey(item) !== spellKey(spell)))} />
      )}
      <details onToggle={(event) => { if (event.currentTarget.open) setPickerOpened(true) }}>
        <summary>Add spells</summary>
        {pickerOpened && (
          <SpellPicker initialEdition={sheetEdition === '2024' ? '2024' : '2014'} selected={selected} onAdd={(spell) => {
            if (!selected.has(spellKey(spell))) {
              const { edition, index, name } = spell
              onChange([...spells, { edition, index, name }])
            }
          }} />
        )}
      </details>
    </fieldset>
  )
}
