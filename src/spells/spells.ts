export const rulesEditions = ['2014', '2024'] as const
export type RulesEdition = (typeof rulesEditions)[number]

export interface SpellReference {
  edition: RulesEdition
  index: string
  name: string
}

export interface SpellSummary extends SpellReference {
  level: number
}

export interface SpellDetail extends SpellSummary {
  description: string[]
  higherLevels: string[]
  castingTime?: string
  range?: string
  duration?: string
  components?: string[]
}

const apiUrl = 'https://www.dnd5eapi.co/api'
const spellIndex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const alphabetical = new Intl.Collator('en')

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function readText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isSpellIndex(value: unknown): value is string {
  return typeof value === 'string' && spellIndex.test(value)
}

export function isRulesEdition(value: unknown): value is RulesEdition {
  return rulesEditions.some((edition) => edition === value)
}

export function isSpellReference(value: unknown): value is SpellReference {
  return isRecord(value) && isRulesEdition(value.edition) && isSpellIndex(value.index)
    && readText(value.name) !== undefined
}

export function spellKey(spell: SpellReference): string {
  return `${spell.edition}:${spell.index}`
}

export function spellPath(spell: SpellReference): string {
  return `/spells/${spell.edition}/${encodeURIComponent(spell.index)}`
}

export function searchSpells(spells: readonly SpellSummary[], query: string): SpellSummary[] {
  const term = query.trim().toLowerCase()
  return spells.filter((spell) => spell.name.toLowerCase().includes(term))
    .sort((left, right) => alphabetical.compare(left.name, right.name) || spellKey(left).localeCompare(spellKey(right)))
}

function readSummary(edition: RulesEdition, value: unknown): SpellSummary {
  if (!isRecord(value)) throw new Error('The spell library returned an invalid entry.')
  const { index, level } = value
  const name = readText(value.name)
  if (!isSpellIndex(index) || name === undefined || typeof level !== 'number'
    || !Number.isInteger(level) || level < 0 || level > 9) {
    throw new Error('The spell library returned an invalid entry.')
  }
  return { edition, index, name, level }
}

function readTextList(value: unknown): string[] {
  if (typeof value === 'string') return value.split(/\r?\n/).map((text) => text.trim()).filter(Boolean)
  if (Array.isArray(value) && value.every((item): item is string => typeof item === 'string')) {
    return value.map((text) => text.trim()).filter(Boolean)
  }
  return []
}

export async function fetchSpellCatalog(edition: RulesEdition, signal?: AbortSignal): Promise<SpellSummary[]> {
  const response = await fetch(`${apiUrl}/${edition}/spells`, { signal })
  if (!response.ok) throw new Error('Could not load the spell library.')

  const payload: unknown = await response.json()
  if (!isRecord(payload) || !Array.isArray(payload.results)) throw new Error('The spell library response was invalid.')
  const spells = payload.results.map((spell) => readSummary(edition, spell))
  if (new Set(spells.map(spellKey)).size !== spells.length) throw new Error('The spell library returned duplicate spells.')
  return spells
}

export async function fetchSpellDetail(edition: RulesEdition, index: string, signal?: AbortSignal): Promise<SpellDetail | null> {
  if (!isSpellIndex(index)) return null
  const response = await fetch(`${apiUrl}/${edition}/spells/${index}`, { signal })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Could not load this spell.')

  const payload: unknown = await response.json()
  if (!isRecord(payload)) throw new Error('The spell response was invalid.')
  const summary = readSummary(edition, payload)
  const description = readTextList(payload.description ?? payload.desc)
  if (summary.index !== index || !description.length) throw new Error('The spell response was invalid.')

  return {
    ...summary,
    description,
    higherLevels: readTextList(payload.higher_level),
    castingTime: readText(payload.casting_time),
    range: readText(payload.range),
    duration: readText(payload.duration),
    components: readTextList(payload.components),
  }
}
