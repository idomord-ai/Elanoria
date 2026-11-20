import type { CharacterSheet } from '../characters/characterSheets'
import { isKingdomTheme, type KingdomTheme } from './kingdomThemes'
import entryData from './world-entries.json'

export const PLAYER_CHARACTER_KIND = 'Player Character (PC)'

export const entryKindGroups = {
  'Characters and groups': [PLAYER_CHARACTER_KIND, 'Non-Player Character (NPC)', 'Deity', 'Organization'],
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
  characterSheet?: CharacterSheet
  kingdomTheme?: KingdomTheme
  kingdomId?: string
}

export interface WorldEntryDraft extends Omit<WorldEntry, 'id' | 'linkedEntries' | 'kingdomTheme' | 'kingdomId'> {
  id?: string
  linkedEntries: readonly WorldEntryLink[]
  kingdomTheme?: KingdomTheme | null
  kingdomId?: string | null
}

export function isEntryKind(kind: unknown): kind is EntryKind {
  return entryKinds.some((entryKind) => entryKind === kind)
}

export function canHaveKingdomAffiliation(kind: EntryKind): boolean {
  return kind !== 'World' && kind !== 'Kingdom'
}

export const worldEntries: WorldEntry[] = entryData.map(({ kind, kingdomTheme, kingdomId, ...data }) => {
  if (!isEntryKind(kind)) {
    throw new Error(`Unknown entry kind: ${kind}`)
  }
  if (kingdomTheme !== undefined && (kind !== 'Kingdom' || !isKingdomTheme(kingdomTheme))) {
    throw new Error(`Invalid kingdom theme for entry: ${data.id}`)
  }
  if (kingdomId !== undefined && !canHaveKingdomAffiliation(kind)) {
    throw new Error(`Invalid kingdom affiliation for entry: ${data.id}`)
  }
  const entry: WorldEntry = { ...data, kind }
  if (kingdomTheme) entry.kingdomTheme = kingdomTheme
  if (kingdomId) entry.kingdomId = kingdomId
  return entry
})

export function getEntryKingdom(entry: WorldEntry, entries: readonly WorldEntry[]): WorldEntry | undefined {
  if (entry.kind === 'Kingdom') return entry
  if (!canHaveKingdomAffiliation(entry.kind) || !entry.kingdomId) return undefined
  return entries.find(({ id, kind }) => id === entry.kingdomId && kind === 'Kingdom')
}

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
