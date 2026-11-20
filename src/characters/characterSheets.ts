import { isSpellReference, spellKey, type SpellReference } from '../spells/spells.ts'

export const editions = ['2014', '2024', 'mixed'] as const
export const themes = ['atlas', 'ember', 'moon'] as const
export const abilities = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const

export type CharacterEdition = (typeof editions)[number]
export type CharacterTheme = (typeof themes)[number]
export type Ability = (typeof abilities)[number]

export const editionNames = {
  '2014': 'D&D 5e (2014)',
  '2024': 'D&D 5.5e (2024)',
  mixed: 'D&D 2014 + 2024 (mixed)',
} satisfies Record<CharacterEdition, string>

export const ancestryLabels = {
  '2014': 'Race',
  '2024': 'Species',
  mixed: 'Race or species',
} satisfies Record<CharacterEdition, string>

export interface CharacterSheet {
  edition: CharacterEdition
  theme: CharacterTheme
  level: number
  className: string
  subclassName?: string
  ancestry: string
  background: string
  armorClass: number
  currentHitPoints: number
  maxHitPoints: number
  abilityScores: Record<Ability, number>
  spells?: SpellReference[]
}

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function getProficiencyBonus(level: number): number {
  return 2 + Math.floor((level - 1) / 4)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIntegerInRange(value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max
}

export function isCharacterSheet(value: unknown): value is CharacterSheet {
  if (!isRecord(value)) return false

  const { edition, theme, level, className, subclassName, ancestry, background, armorClass, currentHitPoints, maxHitPoints, abilityScores, spells } = value
  return editions.some((option) => option === edition)
    && themes.some((option) => option === theme)
    && isIntegerInRange(level, 1, 20)
    && typeof className === 'string'
    && (subclassName === undefined || typeof subclassName === 'string')
    && typeof ancestry === 'string'
    && typeof background === 'string'
    && isIntegerInRange(armorClass, 0)
    && isIntegerInRange(maxHitPoints, 0)
    && isIntegerInRange(currentHitPoints, 0, maxHitPoints)
    && isRecord(abilityScores)
    && abilities.every((ability) => isIntegerInRange(abilityScores[ability], 1, 30))
    && (spells === undefined || (
      Array.isArray(spells) && spells.every(isSpellReference)
      && new Set(spells.map(spellKey)).size === spells.length
    ))
}
