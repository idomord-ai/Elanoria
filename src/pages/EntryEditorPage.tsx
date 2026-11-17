import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { MONSTER_ENTRY_PREFIX, searchMonsters, type MonsterListResponse } from '../bestiary/srd'
import { useSrdResource } from '../bestiary/useSrdResource'
import {
  entryKindGroups,
  isEntryKind,
  searchWorldEntries,
  type EntryKind,
  type WorldEntry,
  type WorldEntryDraft,
  type WorldEntryLink,
} from '../catalog/worldEntries'
import NotFoundPage from './NotFoundPage'

interface EntryEditorPageProps {
  entries: readonly WorldEntry[]
  onSave: (draft: WorldEntryDraft) => WorldEntry
}

interface EntryEditorFormProps extends EntryEditorPageProps {
  entry?: WorldEntry
}

function EntryEditorForm({ entries, entry, onSave }: EntryEditorFormProps) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(entry?.title ?? '')
  const [kind, setKind] = useState<EntryKind>(entry?.kind ?? 'Location')
  const [summary, setSummary] = useState(entry?.summary ?? '')
  const [query, setQuery] = useState('')
  const [linkedEntries, setLinkedEntries] = useState(entry?.linkedEntries ?? [])
  const [error, setError] = useState('')
  const bestiary = useSrdResource<MonsterListResponse>('/monsters')
  const searchTerm = query.trim()
  const localMatches = searchTerm
    ? searchWorldEntries(entries, searchTerm).filter((item) => item.id !== entry?.id)
    : []
  const monsterMatches = searchTerm && bestiary.state.status === 'success'
    ? searchMonsters(bestiary.state.data.results, searchTerm)
    : []
  const hasMatches = localMatches.length > 0 || monsterMatches.length > 0

  function removeLink(id: string) {
    setLinkedEntries((links) => links.filter((link) => link.id !== id))
  }

  function setLink(link: WorldEntryLink, checked: boolean) {
    if (checked) {
      setLinkedEntries((links) => [...links, link])
    } else {
      removeLink(link.id)
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim() || !summary.trim()) {
      setError('Enter a title and summary before saving.')
      return
    }

    let savedEntry: WorldEntry
    try {
      savedEntry = onSave({ id: entry?.id, title, kind, summary, linkedEntries })
    } catch {
      setError('Could not save this entry in this browser. Try again.')
      return
    }

    void navigate(`/compendium/${encodeURIComponent(savedEntry.id)}`)
  }

  function linkOption(link: WorldEntryLink, name: string, source: string) {
    return (
      <li key={link.id}>
        <label>
          <input
            type="checkbox"
            checked={linkedEntries.some((item) => item.id === link.id)}
            onChange={(event) => setLink(link, event.currentTarget.checked)}
          />
          {name}
        </label>
        <span className="editor-link-source">{source}</span>
      </li>
    )
  }

  return (
    <div className="entry-editor">
      <h1>{entry ? 'Edit entry' : 'Create entry'}</h1>
      <form className="editor-form" onSubmit={save}>
        <label className="editor-field">
          Title
          <input required value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
        </label>
        <label className="editor-field">
          Type
          <select
            value={kind}
            onChange={(event) => {
              const value = event.currentTarget.value
              if (isEntryKind(value)) setKind(value)
            }}
          >
            {Object.entries(entryKindGroups).map(([group, kinds]) => (
              <optgroup key={group} label={group}>
                {kinds.map((item) => <option key={item} value={item}>{item}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="editor-field">
          Summary
          <textarea required rows={5} value={summary} onChange={(event) => setSummary(event.currentTarget.value)} />
        </label>
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
                const name = entries.find((item) => item.id === link.id)?.title ?? link.title ?? link.id
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
        {error && <p className="editor-error" role="alert">{error}</p>}
        <div className="editor-actions">
          <button type="submit">Save entry</button>
          <Link className="back-link" to={entry ? `/compendium/${encodeURIComponent(entry.id)}` : '/compendium'}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}

export default function EntryEditorPage({ entries, onSave }: EntryEditorPageProps) {
  const { id } = useParams<'id'>()
  const entry = entries.find((item) => item.id === id)

  if (id && !entry) {
    return <NotFoundPage title="Entry not found" />
  }

  return <EntryEditorForm key={id} entries={entries} entry={entry} onSave={onSave} />
}
