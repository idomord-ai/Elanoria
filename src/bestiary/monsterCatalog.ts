import { searchMonsters, type MonsterSummary } from './srd'

export interface MonsterCatalogEntry extends MonsterSummary {
  type: string
  challengeRating: number
  hitPoints: number
  armorClass: number | null
}

export type MonsterSortBy = 'name' | 'cr' | 'hp' | 'ac'
export type MonsterSortDirection = 'asc' | 'desc'

export interface MonsterCatalogOptions {
  query: string
  type?: string
  minCr?: number
  maxCr?: number
  sortBy: MonsterSortBy
  direction: MonsterSortDirection
}

const numericSortFields = { cr: 'challengeRating', hp: 'hitPoints', ac: 'armorClass' } as const
const byName = new Intl.Collator('en')

export function getMonsterTypes(monsters: readonly MonsterCatalogEntry[]): string[] {
  return [...new Set(monsters.map((monster) => monster.type))].sort(byName.compare)
}

export function selectMonsters(monsters: readonly MonsterCatalogEntry[], options: MonsterCatalogOptions) {
  const { query, type, minCr = -Infinity, maxCr = Infinity, sortBy, direction } = options
  const multiplier = direction === 'asc' ? 1 : -1
  return searchMonsters(monsters, query)
    .filter((monster) => (type === undefined || monster.type === type)
      && monster.challengeRating >= minCr && monster.challengeRating <= maxCr)
    .sort((left, right) => {
      const byTitle = byName.compare(left.name, right.name)
      const byIndex = byName.compare(left.index, right.index)
      if (sortBy === 'name') return multiplier * byTitle || byIndex

      const leftValue = left[numericSortFields[sortBy]]
      const rightValue = right[numericSortFields[sortBy]]
      if (leftValue === null && rightValue !== null) return 1
      if (leftValue !== null && rightValue === null) return -1
      return multiplier * ((leftValue ?? 0) - (rightValue ?? 0)) || byTitle || byIndex
    })
}

const catalogUrl = 'https://www.dnd5eapi.co/graphql/2014'
const pageSize = 1000
const catalogQuery = `
  query MonsterCatalog($skip: Int!, $limit: Int!) {
    monsters(skip: $skip, limit: $limit) {
      index
      name
      type
      challenge_rating
      hit_points
      armor_class {
        ... on ArmorClassArmor { value }
        ... on ArmorClassCondition { value }
        ... on ArmorClassDex { value }
        ... on ArmorClassNatural { value }
        ... on ArmorClassSpell { value }
      }
    }
  }
`

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function readMonster(value: unknown): MonsterCatalogEntry {
  if (!isRecord(value)) throw new Error('Invalid monster catalog entry')
  const { index, name, type, challenge_rating, hit_points, armor_class } = value
  if (typeof index !== 'string' || typeof name !== 'string' || typeof type !== 'string'
    || !isFiniteNumber(challenge_rating) || !isFiniteNumber(hit_points) || !Array.isArray(armor_class)) {
    throw new Error('Invalid monster catalog entry')
  }
  const firstArmor: unknown = armor_class[0]
  const primaryArmor = isRecord(firstArmor) && isFiniteNumber(firstArmor.value) ? firstArmor.value : null
  return { index, name, type, challengeRating: challenge_rating, hitPoints: hit_points, armorClass: primaryArmor }
}

async function fetchCatalogPage(skip: number, signal: AbortSignal): Promise<MonsterCatalogEntry[]> {
  const response = await fetch(catalogUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: catalogQuery, variables: { skip, limit: pageSize } }),
    signal,
  })
  if (!response.ok) throw new Error('Could not load monster catalog')

  const payload: unknown = await response.json()
  if (!isRecord(payload) || (Array.isArray(payload.errors) && payload.errors.length > 0)
    || !isRecord(payload.data) || !Array.isArray(payload.data.monsters)) {
    throw new Error('Invalid monster catalog response')
  }
  return payload.data.monsters.map(readMonster)
}

export async function fetchMonsterCatalog(signal: AbortSignal): Promise<MonsterCatalogEntry[]> {
  const monsters = new Map<string, MonsterCatalogEntry>()
  for (let skip = 0; ; skip += pageSize) {
    const page = await fetchCatalogPage(skip, signal)
    for (const monster of page) {
      if (monsters.has(monster.index)) throw new Error('Monster catalog returned duplicate entries')
      monsters.set(monster.index, monster)
    }
    if (page.length < pageSize) return [...monsters.values()]
  }
}
