export const memoryTypes = ['memory', 'event', 'scene'] as const

export type MemoryType = (typeof memoryTypes)[number]

export interface MemoryRecord {
  id: string
  type: MemoryType
  title: string
  narrative: string
  characterIds: readonly string[]
}

export interface MemoryCollection {
  id: string
  name: string
  records: readonly MemoryRecord[]
}

type MemoriaStorage = Pick<Storage, 'getItem' | 'setItem'>
type CollectionDraft = Pick<MemoryCollection, 'name'> & { id?: string }
type MemoryDraft = Omit<MemoryRecord, 'id'> & { id?: string }
const storageKey = 'elanoria.memoria'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isMemoryRecord(value: unknown): value is MemoryRecord {
  return isObject(value) && hasText(value.id) && memoryTypes.some((type) => value.type === type)
    && hasText(value.title) && hasText(value.narrative)
    && Array.isArray(value.characterIds) && value.characterIds.every(hasText)
}

function isMemoryCollection(value: unknown): value is MemoryCollection {
  return isObject(value) && hasText(value.id) && hasText(value.name)
    && Array.isArray(value.records) && value.records.every(isMemoryRecord)
    && new Set(value.records.map(({ id }) => id)).size === value.records.length
}

export function loadMemoria(storage: MemoriaStorage): MemoryCollection[] {
  try {
    const raw = storage.getItem(storageKey)
    if (raw === null) return []
    const collections: unknown = JSON.parse(raw)
    if (Array.isArray(collections) && collections.every(isMemoryCollection)
      && new Set(collections.map(({ id }) => id)).size === collections.length) return collections
  } catch {
    throw new Error('Saved Memoria collections could not be read.')
  }

  throw new Error('Saved Memoria collections could not be read.')
}

function writeMemoria(storage: MemoriaStorage, collections: MemoryCollection[]) {
  try {
    storage.setItem(storageKey, JSON.stringify(collections))
  } catch {
    throw new Error('Could not save changes to Memoria in this browser.')
  }
  return collections
}

export function saveCollection(storage: MemoriaStorage, draft: CollectionDraft) {
  const name = draft.name.trim()
  if (!name) throw new Error('Enter a collection name.')
  const collections = loadMemoria(storage)
  if (draft.id === undefined) {
    return writeMemoria(storage, [...collections, { id: crypto.randomUUID(), name, records: [] }])
  }
  if (!collections.some((collection) => collection.id === draft.id)) throw new Error('Collection not found.')
  return writeMemoria(storage, collections.map((collection) => (
    collection.id === draft.id ? { ...collection, name } : collection
  )))
}

export function saveMemoryRecord(storage: MemoriaStorage, collectionId: string, draft: MemoryDraft) {
  const title = draft.title.trim()
  const narrative = draft.narrative.trim()
  if (!title || !narrative) throw new Error('Enter a title and narrative for this record.')
  if (!memoryTypes.includes(draft.type) || !draft.characterIds.every(hasText)) throw new Error('The record contains invalid fields.')
  const collections = loadMemoria(storage)
  const collection = collections.find(({ id }) => id === collectionId)
  if (!collection) throw new Error('Collection not found.')
  if (draft.id !== undefined && !collection.records.some(({ id }) => id === draft.id)) throw new Error('Record not found.')
  const record: MemoryRecord = {
    id: draft.id ?? crypto.randomUUID(),
    type: draft.type,
    title,
    narrative,
    characterIds: [...new Set(draft.characterIds)],
  }
  const records = draft.id === undefined
    ? [...collection.records, record]
    : collection.records.map((previous) => previous.id === record.id ? record : previous)
  return writeMemoria(storage, collections.map((current) => current.id === collectionId ? { ...current, records } : current))
}
