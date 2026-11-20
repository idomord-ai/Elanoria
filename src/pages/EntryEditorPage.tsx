import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import type { MonsterListResponse } from '../bestiary/srd'
import { useSrdResource } from '../bestiary/useSrdResource'
import { isKingdomTheme, kingdomThemes, type KingdomTheme } from '../catalog/kingdomThemes'
import {
  canHaveKingdomAffiliation,
  entryKindGroups,
  isEntryKind,
  PLAYER_CHARACTER_KIND,
  type EntryKind,
  type WorldEntry,
  type WorldEntryDraft,
} from '../catalog/worldEntries'
import EntryLinkPicker from '../components/EntryLinkPicker'
import KingdomBackdrop from '../components/KingdomBackdrop'
import NotFoundPage from './NotFoundPage'

interface EntryEditorPageProps {
  entries: readonly WorldEntry[]
  onSave: (draft: WorldEntryDraft) => WorldEntry
}

interface EntryEditorFormProps extends EntryEditorPageProps {
  entry?: WorldEntry
  creatingCharacter: boolean
}

function EntryEditorForm({ entries, entry, onSave, creatingCharacter }: EntryEditorFormProps) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(entry?.title ?? '')
  const [kind, setKind] = useState<EntryKind>(entry?.kind ?? (creatingCharacter ? PLAYER_CHARACTER_KIND : 'Location'))
  const [kingdomTheme, setKingdomTheme] = useState<KingdomTheme | null>(entry?.kingdomTheme ?? null)
  const [kingdomId, setKingdomId] = useState<string | null>()
  const [summary, setSummary] = useState(entry?.summary ?? '')
  const [linkedEntries, setLinkedEntries] = useState(entry?.linkedEntries ?? [])
  const [error, setError] = useState('')
  const bestiary = useSrdResource<MonsterListResponse>('/monsters')
  const acceptsKingdom = canHaveKingdomAffiliation(kind)
  const kingdoms = entries.filter((item) => item.kind === 'Kingdom' && item.id !== entry?.id)
  const requestedKingdomId = kingdomId === undefined ? entry?.kingdomId : kingdomId
  const selectedKingdomId = kingdoms.find(({ id }) => id === requestedKingdomId)?.id ?? ''

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim() || !summary.trim()) {
      setError('Enter a title and summary before saving.')
      return
    }

    let savedEntry: WorldEntry
    try {
      savedEntry = onSave({
        id: entry?.id,
        title,
        kind,
        summary,
        linkedEntries,
        kingdomTheme: kind === 'Kingdom' ? kingdomTheme : undefined,
        kingdomId: acceptsKingdom ? kingdomId : undefined,
      })
    } catch {
      setError('Could not save this entry in this browser. Try again.')
      return
    }

    const destination = creatingCharacter && kind === PLAYER_CHARACTER_KIND ? 'characters' : 'compendium'
    void navigate(`/${destination}/${encodeURIComponent(savedEntry.id)}`)
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
        {kind === 'Kingdom' && (
          <>
            <label className="editor-field">
              Kingdom background
              <select
                value={kingdomTheme ?? ''}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  setKingdomTheme(isKingdomTheme(value) ? value : null)
                }}
              >
                <option value="">Atlas (default)</option>
                {Object.entries(kingdomThemes).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            {kingdomTheme && (
              <div className="kingdom-editor-preview">
                <KingdomBackdrop theme={kingdomTheme} />
              </div>
            )}
          </>
        )}
        {acceptsKingdom && (
          <label className="editor-field">
            Kingdom affiliation
            <select
              value={selectedKingdomId}
              onChange={(event) => setKingdomId(event.currentTarget.value || null)}
            >
              <option value="">None</option>
              {kingdoms.map(({ id, title }) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
          </label>
        )}
        <label className="editor-field">
          Summary
          <textarea required rows={5} value={summary} onChange={(event) => setSummary(event.currentTarget.value)} />
        </label>
        <EntryLinkPicker
          entries={entries}
          linkedEntries={linkedEntries}
          onChange={setLinkedEntries}
          bestiary={bestiary}
          excludedId={entry?.id}
        />
        {error && <p className="editor-error" role="alert">{error}</p>}
        <div className="editor-actions">
          <button type="submit">Save entry</button>
          <Link className="back-link" to={entry ? `/compendium/${encodeURIComponent(entry.id)}` : creatingCharacter ? '/characters' : '/compendium'}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}

export default function EntryEditorPage({ entries, onSave }: EntryEditorPageProps) {
  const { id } = useParams<'id'>()
  const [params] = useSearchParams()
  const creatingCharacter = id === undefined && params.get('kind') === 'pc'
  const entry = entries.find((item) => item.id === id)

  if (id && !entry) {
    return <NotFoundPage title="Entry not found" />
  }

  return (
    <EntryEditorForm
      key={id ?? (creatingCharacter ? 'new-pc' : 'new-entry')}
      entries={entries}
      entry={entry}
      onSave={onSave}
      creatingCharacter={creatingCharacter}
    />
  )
}
