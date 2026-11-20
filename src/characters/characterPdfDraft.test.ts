import { describe, expect, it } from 'vitest'
import { parseCharacterPdfDraft } from './characterPdfDraft'

describe('character PDF suggestions', () => {
  it('reads an allowlisted partial draft from JSON without copying the name or theme', () => {
    expect(parseCharacterPdfDraft(JSON.stringify({
      name: 'Different name',
      theme: 'moon',
      edition: '2024',
      className: '  Wizard  ',
      ancestry: 'Human',
      background: null,
      armorClass: 14,
      currentHitPoints: 0,
      maxHitPoints: 12,
      abilityScores: { strength: null, intelligence: 16, initiative: 3 },
    }))).toEqual({
      edition: '2024',
      className: 'Wizard',
      ancestry: 'Human',
      armorClass: 14,
      currentHitPoints: 0,
      maxHitPoints: 12,
      abilityScores: { intelligence: 16 },
    })
  })

  it('does not coerce missing, out-of-range, fractional, or string numbers', () => {
    expect(parseCharacterPdfDraft({
      edition: '5e',
      level: 21,
      className: ['Fighter'],
      background: '  ',
      armorClass: '15',
      currentHitPoints: 4.5,
      maxHitPoints: Number.MAX_SAFE_INTEGER + 1,
      abilityScores: { strength: 0, wisdom: 31, charisma: 10 },
    })).toEqual({ abilityScores: { charisma: 10 } })
  })

  it('keeps a known edition and zero values without filling in other fields', () => {
    expect(parseCharacterPdfDraft({ edition: '2014', armorClass: 0, currentHitPoints: 0 })).toEqual({
      edition: '2014', armorClass: 0, currentHitPoints: 0,
    })
  })

  it('keeps a mixed ruleset, a custom subclass, and the level printed on the sheet', () => {
    expect(parseCharacterPdfDraft({
      edition: 'mixed', className: 'Paladin', subclassName: ' Oath of the Open Sea ', level: 5,
    })).toEqual({
      edition: 'mixed', className: 'Paladin', subclassName: 'Oath of the Open Sea', level: 5,
    })
    expect(parseCharacterPdfDraft({ edition: '5e', className: 'Paladin', subclassName: {} }))
      .toEqual({ className: 'Paladin' })
  })

  it('drops contradictory hit points without discarding unrelated suggestions', () => {
    expect(parseCharacterPdfDraft({ level: 5, currentHitPoints: 17, maxHitPoints: 12 })).toEqual({ level: 5 })
  })

  it.each(['bad JSON', 'null', '[]', null, []])('rejects malformed output: %j', (value) => {
    expect(() => parseCharacterPdfDraft(value)).toThrow('did not return valid character data')
  })

  it('reports when there are no readable supported fields', () => {
    expect(() => parseCharacterPdfDraft({
      className: null, armorClass: -1, abilityScores: { intelligence: '16' }, theme: 'atlas', name: 'Malik',
    })).toThrow('No readable character values were found')
  })
})
