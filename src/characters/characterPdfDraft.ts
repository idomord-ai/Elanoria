import { abilities, editions, type Ability, type CharacterSheet } from './characterSheets.ts'

export type CharacterPdfDraft = Partial<Pick<CharacterSheet,
  'edition' | 'className' | 'subclassName' | 'ancestry' | 'background' | 'level' | 'armorClass' | 'currentHitPoints' | 'maxHitPoints'
>> & { abilityScores?: Partial<Record<Ability, number>> }

const textFields = ['className', 'subclassName', 'ancestry', 'background'] as const
const numericFields = ['level', 'armorClass', 'currentHitPoints', 'maxHitPoints'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function integerInRange(value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): number | undefined {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max) {
    return value
  }
}

function parseJson(input: string): unknown {
  try {
    return JSON.parse(input)
  } catch {
    throw new Error('The PDF extraction did not return valid character data.')
  }
}

export function parseCharacterPdfDraft(input: unknown): CharacterPdfDraft {
  const data = typeof input === 'string' ? parseJson(input) : input
  if (!isRecord(data)) throw new Error('The PDF extraction did not return valid character data.')

  const draft: CharacterPdfDraft = {}
  const edition = editions.find((option) => option === data.edition)
  if (edition !== undefined) draft.edition = edition

  for (const field of textFields) {
    const value = data[field]
    const text = typeof value === 'string' ? value.trim() : ''
    if (text) draft[field] = text
  }

  for (const field of numericFields) {
    const value = field === 'level' ? integerInRange(data[field], 1, 20) : integerInRange(data[field], 0)
    if (value !== undefined) draft[field] = value
  }

  if (draft.currentHitPoints !== undefined && draft.maxHitPoints !== undefined
    && draft.currentHitPoints > draft.maxHitPoints) {
    delete draft.currentHitPoints
    delete draft.maxHitPoints
  }

  if (isRecord(data.abilityScores)) {
    const abilityScores: Partial<Record<Ability, number>> = {}
    for (const ability of abilities) {
      const score = integerInRange(data.abilityScores[ability], 1, 30)
      if (score !== undefined) abilityScores[ability] = score
    }
    if (Object.keys(abilityScores).length > 0) draft.abilityScores = abilityScores
  }

  if (Object.keys(draft).length === 0) throw new Error('No readable character values were found in the PDF.')
  return draft
}
