import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { MonsterListResponse } from '../bestiary/srd'
import { useSrdResource } from '../bestiary/useSrdResource'
import {
  entryKindGroups,
  isEntryKind,
  type EntryKind,
  type WorldEntry,
  type WorldEntryDraft,
} from '../catalog/worldEntries'
import EntryLinkPicker from '../components/EntryLinkPicker'
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
  const [linkedEntries, setLinkedEntries] = useState(entry?.linkedEntries ?? [])
  const [error, setError] = useState('')
  const bestiary = useSrdResource<MonsterListResponse>('/monsters')

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
