export interface MonsterSummary {
  index: string
  name: string
}

export interface MonsterListResponse {
  results: MonsterSummary[]
}

export interface MonsterAbility {
  name: string
  desc: string
}

export interface MonsterDetails extends MonsterSummary {
  armor_class: { type: string; value: number }[]
  hit_points: number
  challenge_rating: number
  special_abilities?: MonsterAbility[]
  actions?: MonsterAbility[]
}

export const SRD_API_BASE_URL = 'https://www.dnd5eapi.co/api/2014'
export const BESTIARY_PATH = '/compendium?source=bestiary'
export const MONSTER_ENTRY_PREFIX = 'monster:'

const fractionalRatings = new Map([
  [0.125, '1/8'],
  [0.25, '1/4'],
  [0.5, '1/2'],
])

export function formatChallengeRating(rating: number): string {
  return fractionalRatings.get(rating) ?? String(rating)
}

export function searchMonsters<T extends MonsterSummary>(monsters: readonly T[], query: string): T[] {
  const searchTerm = query.trim().toLowerCase()
  return monsters.filter((monster) => monster.name.toLowerCase().includes(searchTerm))
}
