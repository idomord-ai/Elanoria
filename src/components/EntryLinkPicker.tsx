import { useState } from 'react'
import { MONSTER_ENTRY_PREFIX, searchMonsters, type MonsterListResponse } from '../bestiary/srd'
import type { useSrdResource } from '../bestiary/useSrdResource'
import { searchWorldEntries, type WorldEntry, type WorldEntryLink } from '../catalog/worldEntries'

interface EntryLinkPickerProps {
  entries: readonly WorldEntry[]
  linkedEntries: readonly WorldEntryLink[]
  onChange: (links: readonly WorldEntryLink[]) => void
  bestiary: ReturnType<typeof useSrdResource<MonsterListResponse>>
  excludedId?: string
}

export default function EntryLinkPicker({ entries, linkedEntries, onChange, bestiary, excludedId }: EntryLinkPickerProps) {
  const [query, setQuery] = useState('')
  const searchTerm = query.trim()
  const localMatches = searchTerm
    ? searchWorldEntries(entries, searchTerm).filter((entry) => entry.id !== excludedId)
    : []
  const monsterMatches = searchTerm && bestiary.state.status === 'success'
    ? searchMonsters(bestiary.state.data.results, searchTerm)
    : []
  const hasMatches = localMatches.length > 0 || monsterMatches.length > 0

  function removeLink(id: string) {
    onChange(linkedEntries.filter((link) => link.id !== id))
  }

  function linkOption(link: WorldEntryLink, name: string, source: string) {
    return (
      <li key={link.id}>
        <label>
          <input
            type="checkbox"
            checked={linkedEntries.some((item) => item.id === link.id)}
            onChange={(event) => {
              if (event.currentTarget.checked) {
                onChange([...linkedEntries, link])
              } else {
                removeLink(link.id)
              }
            }}
          />
          {name}
        </label>
        <span className="editor-link-source">{source}</span>
      </li>
    )
  }

  return (
    <fieldset className="editor-link-picker">
      <legend>Linked entries</legend>
      <label className="editor-field">
        Find entries and monsters
        <input
          type="search"
          placeholder="e.g. Valciel or Basilisk"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault()
          }}
        />
      </label>
      {searchTerm && (
        <>
          {bestiary.state.status === 'loading' && <p role="status">Loading monsters…</p>}
          {(bestiary.state.status === 'error' || bestiary.state.status === 'not-found') && (
            <div className="api-error">
              <p role="alert">Could not load monsters.</p>
              <button type="button" onClick={bestiary.retry}>Retry</button>
            </div>
          )}
          {hasMatches && (
            <ul className="editor-link-options" aria-label="Matching entries and monsters">
              {localMatches.map((match) => linkOption({ id: match.id }, match.title, match.kind))}
              {monsterMatches.map((monster) =>
                linkOption({ id: MONSTER_ENTRY_PREFIX + monster.index, title: monster.name }, monster.name, 'Bestiary'),
              )}
            </ul>
          )}
          {bestiary.state.status === 'success' && !hasMatches && (
            <p role="status">No entries or monsters match your search.</p>
          )}
        </>
      )}
      {linkedEntries.length > 0 && (
        <ul className="editor-selected-links" aria-label="Selected links">
          {linkedEntries.map((link) => {
            const name = entries.find((entry) => entry.id === link.id)?.title ?? link.title ?? link.id
            return (
              <li key={link.id}>
                {name}
                <button type="button" aria-label={`Remove ${name}`} onClick={() => removeLink(link.id)}>Remove</button>
              </li>
            )
          })}
        </ul>
      )}
    </fieldset>
  )
}
