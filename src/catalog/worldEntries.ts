import entryData from './world-entries.json'

export const entryKindGroups = {
  'Characters and groups': ['Player Character (PC)', 'Non-Player Character (NPC)', 'Deity', 'Organization'],
  Places: ['World', 'Kingdom', 'Region', 'City', 'Town', 'Village', 'Location'],
  'Items and magic': ['Item', 'Artifact', 'Spell'],
  Lore: ['History', 'Event', 'Legend', 'Culture'],
  Campaign: ['Quest', 'Encounter', 'Secret', 'Rumor', 'Session Note'],
} as const

type EntryKindGroups = typeof entryKindGroups
export type EntryKind = EntryKindGroups[keyof EntryKindGroups][number]
const entryKinds = Object.values(entryKindGroups).flat()

export interface WorldEntryLink {
  id: string
  title?: string
}

export interface WorldEntry {
  id: string
  title: string
  kind: EntryKind
  summary: string
  linkedEntries?: readonly WorldEntryLink[]
}

export interface WorldEntryDraft extends Omit<WorldEntry, 'id' | 'linkedEntries'> {
  id?: string
  linkedEntries: readonly WorldEntryLink[]
}

export function isEntryKind(kind: unknown): kind is EntryKind {
  return entryKinds.some((entryKind) => entryKind === kind)
}

export const worldEntries: WorldEntry[] = entryData.map((entry) => {
  if (!isEntryKind(entry.kind)) {
    throw new Error(`Unknown entry kind: ${entry.kind}`)
  }
  return { ...entry, kind: entry.kind }
})

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replaceAll('’', "'")
}

export function searchWorldEntries(entries: readonly WorldEntry[], query: string): WorldEntry[] {
  const searchTerm = normalizeTitle(query)
  return entries.filter((entry) => normalizeTitle(entry.title).includes(searchTerm))
}

export function findBacklinks(entries: readonly WorldEntry[], targetId: string): WorldEntry[] {
  return entries.filter((entry) => entry.linkedEntries?.some((link) => link.id === targetId))
}
