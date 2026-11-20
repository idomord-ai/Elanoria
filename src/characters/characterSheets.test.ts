import { describe, expect, it } from 'vitest'
import { loadWorldEntries, saveWorldEntry } from '../catalog/worldEntryStorage'
import { PLAYER_CHARACTER_KIND, type WorldEntryDraft } from '../catalog/worldEntries'
import { getAbilityModifier, getProficiencyBonus, isCharacterSheet, type CharacterSheet } from './characterSheets'

const sheet: CharacterSheet = {
  edition: '2014',
  theme: 'atlas',
  level: 5,
  className: 'Rogue',
  ancestry: 'Halfling',
  background: 'Sailor',
  armorClass: 14,
  currentHitPoints: 0,
  maxHitPoints: 30,
  abilityScores: {
    strength: 8,
    dexterity: 16,
    constitution: 14,
    intelligence: 11,
    wisdom: 10,
    charisma: 9,
  },
}

const article: WorldEntryDraft = {
  title: 'Mira',
  kind: PLAYER_CHARACTER_KIND,
  summary: 'An explorer from Elanor.',
  linkedEntries: [{ id: 'elanor' }],
}

function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  }
}

describe('character sheet stats', () => {
  it('rounds ability modifiers down, including odd scores below ten', () => {
    expect([1, 8, 9, 10, 11, 12, 30].map(getAbilityModifier)).toEqual([-5, -1, -1, 0, 0, 1, 10])
  })

  it('changes the proficiency bonus at levels five, nine, thirteen, and seventeen', () => {
    expect([1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map(getProficiencyBonus))
      .toEqual([2, 2, 3, 3, 4, 4, 5, 5, 6, 6])
  })

  it('requires supported edition and theme values and in-range integer stats', () => {
    expect(isCharacterSheet(sheet)).toBe(true)
    expect(isCharacterSheet({ ...sheet, edition: '2024', theme: 'ember', level: 20 })).toBe(true)
    expect(isCharacterSheet({ ...sheet, edition: 'unknown' })).toBe(false)
    expect(isCharacterSheet({ ...sheet, subclassName: ['Custom'] })).toBe(false)
    expect(isCharacterSheet({ ...sheet, theme: 'unknown' })).toBe(false)
    expect(isCharacterSheet({ ...sheet, level: 21 })).toBe(false)
    expect(isCharacterSheet({ ...sheet, armorClass: 13.5 })).toBe(false)
    expect(isCharacterSheet({ ...sheet, currentHitPoints: 31 })).toBe(false)
    expect(isCharacterSheet({ ...sheet, abilityScores: { ...sheet.abilityScores, wisdom: 0 } })).toBe(false)
    expect(isCharacterSheet({ ...sheet, abilityScores: { strength: 8 } })).toBe(false)
  })
})

describe('character sheet entry storage', () => {
  it('updates a legacy PC without changing its article ID or references, and restores both editions', () => {
    const storage = createStorage()
    const legacy = saveWorldEntry(storage, article).entry
    const secondSheet = { ...sheet, edition: '2024', theme: 'moon' } as const
    const second = saveWorldEntry(storage, { ...article, title: 'Orren', characterSheet: secondSheet }).entry

    expect(legacy.characterSheet).toBeUndefined()
    saveWorldEntry(storage, { ...article, id: legacy.id, characterSheet: sheet })

    const restored = loadWorldEntries(storage)
    expect(restored.find((entry) => entry.id === legacy.id)).toEqual({ ...legacy, characterSheet: sheet })
    expect(restored.find((entry) => entry.id === second.id)?.characterSheet).toEqual(secondSheet)
  })

  it('preserves the prior sheet through article edits and category changes when omitted', () => {
    const storage = createStorage()
    const entry = saveWorldEntry(storage, { ...article, characterSheet: sheet }).entry

    saveWorldEntry(storage, { ...article, id: entry.id, title: 'Captain Mira' })
    saveWorldEntry(storage, { ...article, id: entry.id, kind: 'Non-Player Character (NPC)', title: 'Captain Mira' })
    saveWorldEntry(storage, { ...article, id: entry.id, title: 'Captain Mira' })

    expect(loadWorldEntries(storage).find((item) => item.id === entry.id))
      .toEqual({ ...entry, title: 'Captain Mira' })
  })

  it('round-trips a mixed ruleset, custom subclass, and existing level', () => {
    const storage = createStorage()
    const mixedSheet: CharacterSheet = {
      ...sheet, edition: 'mixed', className: 'Paladin', subclassName: 'Oath of the Open Sea',
    }
    const entry = saveWorldEntry(storage, { ...article, characterSheet: mixedSheet }).entry

    expect(loadWorldEntries(storage).find((item) => item.id === entry.id)?.characterSheet).toEqual(mixedSheet)
  })

  it('persists both versions of a spell independently on a mixed sheet', () => {
    const storage = createStorage()
    const characterSheet: CharacterSheet = {
      ...sheet,
      edition: 'mixed',
      spells: [
        { edition: '2014', index: 'counterspell', name: 'Counterspell' },
        { edition: '2024', index: 'counterspell', name: 'Counterspell' },
      ],
    }
    const entry = saveWorldEntry(storage, { ...article, characterSheet }).entry

    expect(loadWorldEntries(storage).find((item) => item.id === entry.id)?.characterSheet).toEqual(characterSheet)
    expect(isCharacterSheet({ ...characterSheet, spells: [characterSheet.spells?.[0], characterSheet.spells?.[0]] })).toBe(false)
    expect(isCharacterSheet({ ...characterSheet, spells: [{ edition: 'mixed', index: 'counterspell', name: 'Counterspell' }] })).toBe(false)
  })

  it('rejects invalid stats and new attachments to non-PC entries before writing', () => {
    const storage = createStorage()
    const before = loadWorldEntries(storage)

    expect(() => saveWorldEntry(storage, { ...article, characterSheet: { ...sheet, level: 0 } }))
      .toThrow('Check the character sheet values before saving.')
    expect(() => saveWorldEntry(storage, { ...article, kind: 'Location', characterSheet: sheet }))
      .toThrow('Only player characters can have new character sheets.')
    expect(loadWorldEntries(storage)).toEqual(before)
  })
})
