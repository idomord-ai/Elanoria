import { isCharacterSheet } from '../characters/characterSheets'
import { isKingdomTheme, type KingdomTheme } from './kingdomThemes'
import {
  canHaveKingdomAffiliation,
  isEntryKind,
  PLAYER_CHARACTER_KIND,
  worldEntries,
  type WorldEntry,
  type WorldEntryDraft,
  type WorldEntryLink,
} from './worldEntries'

const storageKey = 'elanoria.worldEntries'
const bundledEntries = new Map(worldEntries.map((entry) => [entry.id, entry]))

type EntryStorage = Pick<Storage, 'getItem' | 'setItem'>
type SavedWorldEntry = Omit<WorldEntry, 'kingdomTheme' | 'kingdomId'> & {
  kingdomTheme?: KingdomTheme | null
  kingdomId?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEntryLink(value: unknown): value is WorldEntryLink {
  return isRecord(value)
    && typeof value.id === 'string'
    && (value.title === undefined || typeof value.title === 'string')
}

function isSavedWorldEntry(value: unknown): value is SavedWorldEntry {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && isEntryKind(value.kind)
    && typeof value.summary === 'string'
    && (value.linkedEntries === undefined
      || (Array.isArray(value.linkedEntries) && value.linkedEntries.every(isEntryLink)))
    && (value.characterSheet === undefined || isCharacterSheet(value.characterSheet))
    && (value.kingdomTheme === undefined
      || (value.kind === 'Kingdom' && (value.kingdomTheme === null || isKingdomTheme(value.kingdomTheme))))
    && (value.kingdomId == null || typeof value.kingdomId === 'string')
}

function readSavedEntries(storage: EntryStorage): SavedWorldEntry[] {
  const stored = storage.getItem(storageKey)
  if (stored === null) return []

  const entries: unknown = JSON.parse(stored)
  if (!Array.isArray(entries) || !entries.every(isSavedWorldEntry)) {
    throw new Error('Saved articles could not be read.')
  }
  return entries
}

function overlayEntries<Entry extends { id: string }>(base: readonly Entry[], edits: readonly Entry[]): Entry[] {
  const entries = new Map(base.map((entry) => [entry.id, entry]))
  for (const entry of edits) entries.set(entry.id, entry)
  return [...entries.values()]
}

function mergeWorldEntries(saved: readonly SavedWorldEntry[]): WorldEntry[] {
  const edits = saved.map(({ kingdomTheme, kingdomId, ...data }) => {
    const entry: WorldEntry = data
    const bundled = bundledEntries.get(entry.id)
    // Older edits inherit bundled data. Null records that the user cleared a selection.
    const theme = kingdomTheme === undefined ? bundled?.kingdomTheme : kingdomTheme
    const affiliation = kingdomId === undefined ? bundled?.kingdomId : kingdomId
    if (theme && entry.kind === 'Kingdom') entry.kingdomTheme = theme
    if (affiliation && canHaveKingdomAffiliation(entry.kind)) entry.kingdomId = affiliation
    return entry
  })
  return overlayEntries(worldEntries, edits)
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
  return mergeWorldEntries(readSavedEntries(storage))
}

export function saveWorldEntry(storage: EntryStorage, draft: WorldEntryDraft) {
  const title = draft.title.trim()
  const summary = draft.summary.trim()
  if (!title || !summary) throw new Error('Enter a title and a summary.')

  const savedEntries = readSavedEntries(storage)
  const entries = mergeWorldEntries(savedEntries)
  const previousEntry = entries.find((entry) => entry.id === draft.id)
  if (draft.id !== undefined && !previousEntry) {
    throw new Error('The article could not be found.')
  }
  if (draft.characterSheet !== undefined) {
    if (draft.kind !== PLAYER_CHARACTER_KIND) throw new Error('Only player characters can have new character sheets.')
    if (!isCharacterSheet(draft.characterSheet)) throw new Error('Check the character sheet values before saving.')
  }
  if (draft.kingdomTheme != null && (draft.kind !== 'Kingdom' || !isKingdomTheme(draft.kingdomTheme))) {
    throw new Error('Select a valid background for a kingdom.')
  }
  const acceptsKingdom = canHaveKingdomAffiliation(draft.kind)
  if (draft.kingdomId != null) {
    // A saved affiliation can become orphaned if its kingdom changes entry type.
    const validKingdom = draft.kingdomId === previousEntry?.kingdomId || entries.some(({ id, kind }) => (
      id === draft.kingdomId && kind === 'Kingdom' && id !== draft.id
    ))
    if (!acceptsKingdom || !validKingdom) {
      throw new Error('Select an existing kingdom for this entry.')
    }
  }

  const id = draft.id ?? createEntryId(title, entries)
  const links = new Map<string, WorldEntryLink>()
  for (const link of draft.linkedEntries) {
    if (link.id !== id) links.set(link.id, link)
  }
  const entry: WorldEntry = { id, title, kind: draft.kind, summary, linkedEntries: [...links.values()] }
  const characterSheet = draft.characterSheet ?? previousEntry?.characterSheet
  if (characterSheet) entry.characterSheet = characterSheet
  const selectedTheme = draft.kingdomTheme === undefined ? previousEntry?.kingdomTheme ?? null : draft.kingdomTheme
  const kingdomTheme = draft.kind === 'Kingdom' ? selectedTheme : undefined
  if (kingdomTheme) entry.kingdomTheme = kingdomTheme
  const selectedKingdom = draft.kingdomId === undefined ? previousEntry?.kingdomId ?? null : draft.kingdomId
  const kingdomId = acceptsKingdom ? selectedKingdom : undefined
  if (kingdomId) entry.kingdomId = kingdomId

  const savedEntry: SavedWorldEntry = { ...entry, kingdomTheme, kingdomId }
  storage.setItem(storageKey, JSON.stringify(overlayEntries(savedEntries, [savedEntry])))
  return { entry, entries: overlayEntries(entries, [entry]) }
}
