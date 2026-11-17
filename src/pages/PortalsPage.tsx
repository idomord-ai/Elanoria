import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { MONSTER_ENTRY_PREFIX, type MonsterListResponse } from '../bestiary/srd'
import { useSrdResource } from '../bestiary/useSrdResource'
import type { WorldEntry, WorldEntryLink } from '../catalog/worldEntries'
import EntryLinkPicker from '../components/EntryLinkPicker'
import type { Portal, PortalDraft } from '../portals/portalStorage'
import { usePortals } from '../portals/usePortals'
import './portals.css'

type BestiaryResource = ReturnType<typeof useSrdResource<MonsterListResponse>>

interface PortalFormProps {
  portal?: Portal
  entries: readonly WorldEntry[]
  monsterTitles: ReadonlyMap<string, string>
  bestiary: BestiaryResource
  onSave: (draft: PortalDraft) => void
  onCancel: () => void
}

function monsterTitle(id: string, names: ReadonlyMap<string, string>): string {
  return names.get(id) ?? id.slice(MONSTER_ENTRY_PREFIX.length).replaceAll('-', ' ')
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

function PortalForm({ portal, entries, monsterTitles, bestiary, onSave, onCancel }: PortalFormProps) {
  const headingId = useId()
  const nameInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(portal?.name ?? '')
  const [entryIds, setEntryIds] = useState<readonly string[]>(portal?.entryIds ?? [])
  const linkedEntries: WorldEntryLink[] = entryIds.map((id) => id.startsWith(MONSTER_ENTRY_PREFIX)
    ? { id, title: monsterTitle(id, monsterTitles) }
    : { id })
  const [error, setError] = useState('')

  useEffect(() => {
    nameInput.current?.focus()
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Enter a name for this portal.')
      nameInput.current?.focus()
      return
    }

    try {
      onSave({ id: portal?.id, name, entryIds })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this portal in this browser.')
    }
  }

  return (
    <form className="portal-form editor-form" aria-labelledby={headingId} onSubmit={submit}>
      <h2 id={headingId}>{portal ? 'Edit portal' : 'Create portal'}</h2>
      <label className="editor-field">
        Portal name
        <input ref={nameInput} required value={name} onChange={(event) => setName(event.currentTarget.value)} />
      </label>
      <EntryLinkPicker
        entries={entries}
        linkedEntries={linkedEntries}
        onChange={(links) => setEntryIds(links.map((link) => link.id))}
        bestiary={bestiary}
      />
      {error && <p className="editor-error" role="alert">{error}</p>}
      <div className="editor-actions">
        <button type="submit">Save portal</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

interface PortalCardProps {
  portal: Portal
  entryTitles: ReadonlyMap<string, string>
  monsterTitles: ReadonlyMap<string, string>
  onEdit: (trigger: HTMLButtonElement) => void
}

function PortalCard({ portal, entryTitles, monsterTitles, onEdit }: PortalCardProps) {
  const headingId = useId()

  return (
    <article className="portal-card" aria-labelledby={headingId}>
      <div className="portal-card__header">
        <span className="portal-card__glyph" aria-hidden="true" />
        <h2 id={headingId}>{portal.name}</h2>
      </div>
      {portal.entryIds.length > 0 ? (
        <ul className="portal-card__entries">
          {portal.entryIds.map((id) => {
            const title = id.startsWith(MONSTER_ENTRY_PREFIX) ? monsterTitle(id, monsterTitles) : entryTitles.get(id)
            return (
              <li key={id}>
                {title ? (
                  <Link className="entry-link" to={'/compendium/' + encodeURIComponent(id)}>{title}</Link>
                ) : <span className="portal-card__empty">Unavailable entry</span>}
              </li>
            )
          })}
        </ul>
      ) : <p className="portal-card__empty">No linked entries yet.</p>}
      <button
        className="portal-button"
        type="button"
        aria-label={`Edit portal ${portal.name}`}
        onClick={(event) => onEdit(event.currentTarget)}
      >
        Edit portal
      </button>
    </article>
  )
}

export default function PortalsPage({ entries }: { entries: readonly WorldEntry[] }) {
  const { portals, loadError, savePortal } = usePortals()
  const bestiary = useSrdResource<MonsterListResponse>('/monsters')
  const entryTitles = new Map(entries.map(({ id, title }) => [id, title]))
  const monsterTitles = new Map(bestiary.state.status === 'success'
    ? bestiary.state.data.results.map(({ index, name }) => [MONSTER_ENTRY_PREFIX + index, name])
    : [])
  const [draft, setDraft] = useState<{ portal?: Portal }>()
  const [status, setStatus] = useState('')
  const draftTrigger = useRef<HTMLButtonElement>(null)

  function openDraft(trigger: HTMLButtonElement, portal?: Portal) {
    draftTrigger.current = trigger
    setStatus('')
    setDraft({ portal })
  }

  function closeDraft() {
    setDraft(undefined)
    draftTrigger.current?.focus()
  }

  function saveDraft(value: PortalDraft) {
    savePortal(value)
    closeDraft()
    setStatus('Portal saved.')
  }

  return (
    <div className="portal-nexus">
      <header className="portal-nexus__header">
        <div>
          <h1>Portal Nexus</h1>
          <p>Group compendium entries into collections for your campaign.</p>
        </div>
        <button className="portal-button portal-button--primary" type="button" onClick={(event) => openDraft(event.currentTarget)}>
          New portal
        </button>
      </header>
      {loadError && <p className="editor-error" role="alert">{loadError}</p>}
      {status && <p className="portal-nexus__status" role="status">{status}</p>}
      {draft && (
        <PortalForm
          key={draft.portal?.id ?? ''}
          portal={draft.portal}
          entries={entries}
          monsterTitles={monsterTitles}
          bestiary={bestiary}
          onSave={saveDraft}
          onCancel={closeDraft}
        />
      )}
      {portals.length > 0 ? (
        <div className="portal-nexus__grid">
          {portals.map((portal) => (
            <PortalCard
              key={portal.id}
              portal={portal}
              entryTitles={entryTitles}
              monsterTitles={monsterTitles}
              onEdit={(trigger) => openDraft(trigger, portal)}
            />
          ))}
        </div>
      ) : !draft && !loadError && <p className="portal-nexus__empty">No portals yet.</p>}
    </div>
  )
}
