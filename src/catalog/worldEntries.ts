import entryData from './world-entries.json'

const entryKinds = ['World', 'Kingdom', 'Region', 'City', 'Location'] as const
type EntryKind = (typeof entryKinds)[number]

export interface WorldEntry {
  id: string
  title: string
  kind: EntryKind
  summary: string
}

function isEntryKind(kind: string): kind is EntryKind {
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
