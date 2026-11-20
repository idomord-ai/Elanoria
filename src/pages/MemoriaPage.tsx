import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { PLAYER_CHARACTER_KIND, type WorldEntry } from '../catalog/worldEntries'
import {
  loadMemoria,
  memoryTypes,
  saveCollection,
  saveMemoryRecord,
  type MemoryCollection,
  type MemoryRecord,
  type MemoryType,
} from '../memoria/memoriaStorage'
import './memoria.css'

const recordLabels = { memory: 'Memory', event: 'Event', scene: 'Scene' } satisfies Record<MemoryType, string>

type Editor = { kind: 'collection'; collection?: MemoryCollection }
  | { kind: 'record'; collectionId: string; record?: MemoryRecord }

function initialCollections(): { collections: MemoryCollection[]; error?: string } {
  try {
    return { collections: loadMemoria(window.localStorage) }
  } catch {
    return { collections: [], error: 'Saved Memoria collections could not be read.' }
  }
}

interface CollectionFormProps {
  collection?: MemoryCollection
  onSave: (name: string) => void
  onCancel: () => void
}

function CollectionForm({ collection, onSave, onCancel }: CollectionFormProps) {
  const id = useId()
  const field = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(collection?.name ?? '')

  useEffect(() => field.current?.focus(), [])

  return (
    <form className="memoria-form editor-form" aria-labelledby={id} onSubmit={(event) => {
      event.preventDefault()
      onSave(name)
    }}>
      <h2 id={id}>{collection ? 'Rename collection' : 'Create collection'}</h2>
      <label className="editor-field">
        Collection name
        <input ref={field} required value={name} onChange={(event) => setName(event.currentTarget.value)} />
      </label>
      <div className="editor-actions">
        <button type="submit">Save collection</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

interface RecordFormProps {
  record?: MemoryRecord
  characters: readonly WorldEntry[]
  onSave: (record: Omit<MemoryRecord, 'id'>) => void
  onCancel: () => void
}

function RecordForm({ record, characters, onSave, onCancel }: RecordFormProps) {
  const id = useId()
  const field = useRef<HTMLSelectElement>(null)
  const [type, setType] = useState(record?.type ?? 'memory')
  const [title, setTitle] = useState(record?.title ?? '')
  const [narrative, setNarrative] = useState(record?.narrative ?? '')
  const [characterIds, setCharacterIds] = useState(record?.characterIds ?? [])

  useEffect(() => field.current?.focus(), [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ type, title, narrative, characterIds })
  }

  return (
    <form className="memoria-form editor-form" aria-labelledby={id} onSubmit={submit}>
      <h3 id={id}>{record ? 'Edit record' : 'Create record'}</h3>
      <label className="editor-field">
        Record type
        <select ref={field} value={type} onChange={(event) => {
          const selected = memoryTypes.find((item) => item === event.currentTarget.value)
          if (selected) setType(selected)
        }}>
          {memoryTypes.map((item) => <option key={item} value={item}>{recordLabels[item]}</option>)}
        </select>
      </label>
      <label className="editor-field">
        Title
        <input required value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
      </label>
      <label className="editor-field">
        Narrative
        <textarea required rows={5} value={narrative} onChange={(event) => setNarrative(event.currentTarget.value)} />
      </label>
      {characters.length > 0 && (
        <fieldset className="editor-link-picker">
          <legend>Characters</legend>
          <ul className="editor-link-options">
            {characters.map(({ id: characterId, title: characterTitle }) => (
              <li key={characterId}>
                <label>
                  <input
                    type="checkbox"
                    checked={characterIds.includes(characterId)}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked
                      setCharacterIds((previous) => checked ? [...previous, characterId] : previous.filter((item) => item !== characterId))
                    }}
                  />
                  {characterTitle}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      <div className="editor-actions">
        <button type="submit">Save record</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

interface RecordCardProps {
  record: MemoryRecord
  characters: ReadonlyMap<string, WorldEntry>
  onEdit: (trigger: HTMLButtonElement) => void
}

function RecordCard({ record, characters, onEdit }: RecordCardProps) {
  const id = useId()

  return (
    <article className="memoria-record" aria-labelledby={id}>
      <p className="memoria-record__type">{recordLabels[record.type]}</p>
      <h3 id={id}>{record.title}</h3>
      <p className="memoria-record__narrative">{record.narrative}</p>
      {record.characterIds.length > 0 && (
        <ul className="memoria-record__characters" aria-label="Characters in this record">
          {record.characterIds.map((characterId) => {
            const character = characters.get(characterId)
            return (
              <li key={characterId}>
                {character ? (
                  <Link className="entry-link" to={'/characters/' + encodeURIComponent(characterId) + '#character-art'}>
                    {character.title}
                  </Link>
                ) : <span>Unavailable character</span>}
              </li>
            )
          })}
        </ul>
      )}
      <button className="portal-button" type="button" aria-label={`Edit record ${record.title}`} onClick={(event) => onEdit(event.currentTarget)}>
        Edit record
      </button>
    </article>
  )
}

export default function MemoriaPage({ entries }: { entries: readonly WorldEntry[] }) {
  const characters = entries.filter((entry) => entry.kind === PLAYER_CHARACTER_KIND)
  const charactersById = new Map(characters.map((character) => [character.id, character]))
  const [{ collections, error: loadError }, setData] = useState(initialCollections)
  const [editor, setEditor] = useState<Editor>()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const activeTrigger = useRef<HTMLButtonElement>(null)

  function openEditor(draft: Editor, trigger: HTMLButtonElement) {
    activeTrigger.current = trigger
    setEditor(draft)
    setError('')
    setStatus('')
  }

  function closeEditor() {
    setEditor(undefined)
    setError('')
    activeTrigger.current?.focus()
  }

  function persist(action: (storage: Storage) => MemoryCollection[], message: string) {
    try {
      setData({ collections: action(window.localStorage) })
      closeEditor()
      setStatus(message)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save changes to Memoria.')
    }
  }

  return (
    <div className="memoria">
      <header className="memoria__header">
        <div>
          <h1>Memoria</h1>
          <p>Collect campaign memories, events, and scenes.</p>
        </div>
        <button className="portal-button portal-button--primary" type="button" onClick={(event) => openEditor({ kind: 'collection' }, event.currentTarget)}>
          New collection
        </button>
      </header>
      {(loadError || error) && <p className="editor-error" role="alert">{error || loadError}</p>}
      {status && <p className="memoria__status" role="status">{status}</p>}
      {editor?.kind === 'collection' && (
        <CollectionForm
          key={editor.collection?.id ?? 'new'}
          collection={editor.collection}
          onSave={(name) => persist((storage) => saveCollection(storage, { id: editor.collection?.id, name }), 'Collection saved.')}
          onCancel={closeEditor}
        />
      )}
      {collections.length === 0 && !editor && !loadError && <p className="memoria__empty">No collections yet.</p>}
      {collections.map((collection) => {
        const recordEditor = editor?.kind === 'record' && editor.collectionId === collection.id ? editor : undefined
        return (
          <section className="memoria-collection" key={collection.id} aria-label={collection.name}>
            <header className="memoria-collection__header">
              <h2>{collection.name}</h2>
              <div className="memoria-collection__actions">
                <button
                  className="portal-button"
                  type="button"
                  aria-label={`Rename collection ${collection.name}`}
                  onClick={(event) => openEditor({ kind: 'collection', collection }, event.currentTarget)}
                >
                  Rename
                </button>
                <button className="portal-button" type="button" onClick={(event) => openEditor({ kind: 'record', collectionId: collection.id }, event.currentTarget)}>
                  New record
                </button>
              </div>
            </header>
            {recordEditor && (
              <RecordForm
                key={recordEditor.record?.id ?? 'new'}
                record={recordEditor.record}
                characters={characters}
                onSave={(draft) => persist((storage) => saveMemoryRecord(storage, collection.id, { ...draft, id: recordEditor.record?.id }), 'Record saved.')}
                onCancel={closeEditor}
              />
            )}
            {collection.records.length === 0 && !recordEditor && <p className="memoria__empty">No records yet.</p>}
            {collection.records.length > 0 && (
              <div className="memoria-collection__records">
                {collection.records.map((record) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    characters={charactersById}
                    onEdit={(trigger) => openEditor({ kind: 'record', collectionId: collection.id, record }, trigger)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
