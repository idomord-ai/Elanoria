import { isEntryKind, worldEntries, type WorldEntry, type WorldEntryDraft, type WorldEntryLink } from './worldEntries'

const storageKey = 'elanoria.worldEntries'

type EntryStorage = Pick<Storage, 'getItem' | 'setItem'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEntryLink(value: unknown): value is WorldEntryLink {
  return isRecord(value)
    && typeof value.id === 'string'
    && (value.title === undefined || typeof value.title === 'string')
}

function isWorldEntry(value: unknown): value is WorldEntry {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && isEntryKind(value.kind)
    && typeof value.summary === 'string'
    && (value.linkedEntries === undefined
      || (Array.isArray(value.linkedEntries) && value.linkedEntries.every(isEntryLink)))
}

function readSavedEntries(storage: EntryStorage): WorldEntry[] {
  const stored = storage.getItem(storageKey)
  if (stored === null) return []

  const entries: unknown = JSON.parse(stored)
  if (!Array.isArray(entries) || !entries.every(isWorldEntry)) {
    throw new Error('Saved articles could not be read.')
  }
  return entries
}

function overlayEntries(base: readonly WorldEntry[], edits: readonly WorldEntry[]): WorldEntry[] {
  const entries = new Map(base.map((entry) => [entry.id, entry]))
  for (const entry of edits) entries.set(entry.id, entry)
  return [...entries.values()]
}

function createEntryId(title: string, entries: readonly WorldEntry[]): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'article'
  const takenIds = new Set(entries.map((entry) => entry.id))
  let id = slug
  for (let suffix = 2; takenIds.has(id); suffix += 1) {
    id = `${slug}-${suffix}`
  }
  return id
}

export function loadWorldEntries(storage: EntryStorage): WorldEntry[] {
  return overlayEntries(worldEntries, readSavedEntries(storage))
}

export function saveWorldEntry(storage: EntryStorage, draft: WorldEntryDraft) {
  const title = draft.title.trim()
  const summary = draft.summary.trim()
  if (!title || !summary) throw new Error('Enter a title and a summary.')

  const savedEntries = readSavedEntries(storage)
  const entries = overlayEntries(worldEntries, savedEntries)
  if (draft.id !== undefined && !entries.some((entry) => entry.id === draft.id)) {
    throw new Error('The article could not be found.')
  }

  const id = draft.id ?? createEntryId(title, entries)
  const links = new Map<string, WorldEntryLink>()
  for (const link of draft.linkedEntries) {
    if (link.id !== id) links.set(link.id, link)
  }
  const entry: WorldEntry = { id, title, kind: draft.kind, summary, linkedEntries: [...links.values()] }

  storage.setItem(storageKey, JSON.stringify(overlayEntries(savedEntries, [entry])))
  return { entry, entries: overlayEntries(entries, [entry]) }
}
