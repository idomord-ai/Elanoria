import { describe, expect, it } from 'vitest'
import { formatDiceFormula, getDiceRollMode, getSceneDice, rollDice, type DicePreset } from './diceRoll'

describe('dice rolls', () => {
  it('rolls each die independently and applies a signed modifier once', () => {
    const randomNumbers = [0, 0.55, 0.9999]
    const roll = rollDice({ sides: 20, count: 3, modifier: -4 }, () => randomNumbers.shift()!)

    expect(roll.values).toEqual([1, 12, 20])
    expect(roll.total).toBe(29)
    expect(roll.dice).toEqual([{ sides: 20, value: 1 }, { sides: 20, value: 12 }, { sides: 20, value: 20 }])
  })

  it('represents a percentile roll with a tens die and a units die', () => {
    const percentileFaces = getSceneDice(100, [1, 10, 58, 100])

    expect(percentileFaces.every(({ sides }) => sides === 10)).toBe(true)
    expect(percentileFaces.map(({ value, percentile, percentileUnit }) => [value, Boolean(percentile), Boolean(percentileUnit)])).toEqual([
      [10, true, false], [1, false, true],
      [1, true, false], [10, false, true],
      [5, true, false], [8, false, true],
      [10, true, false], [10, false, true],
    ])
    expect(rollDice({ sides: 100, count: 1, modifier: 3 }, () => 0.99999).total).toBe(103)
  })

  it('keeps the high face with advantage and adds the modifier once', () => {
    const preset: DicePreset = { sides: 20, count: 1, modifier: 3, mode: 'advantage' }
    const rolls = [0.1, 0.8]
    const result = rollDice(preset, () => rolls.shift()!)

    expect(result).toMatchObject({ preset, values: [3, 17], total: 20, keptIndex: 1, omittedIndex: 0 })
    expect(result.dice).toEqual([{ sides: 20, value: 3 }, { sides: 20, value: 17 }])
    expect(formatDiceFormula(preset)).toBe('2d20 + 3')
  })

  it('keeps the low face with disadvantage and subtracts the modifier once', () => {
    const rolls = [0.9, 0.3]
    const result = rollDice({ sides: 20, count: 1, modifier: -5, mode: 'disadvantage' }, () => rolls.shift()!)

    expect(result).toMatchObject({ values: [19, 7], total: 2, keptIndex: 1, omittedIndex: 0 })
  })

  it('keeps the first die when both faces tie', () => {
    const result = rollDice({ sides: 20, count: 1, modifier: 3, mode: 'advantage' }, () => 0.2)

    expect(result).toMatchObject({ values: [5, 5], total: 8, keptIndex: 0, omittedIndex: 1 })
  })

  it.each([
    { sides: 6, count: 1, modifier: 0, mode: 'advantage' },
    { sides: 20, count: 2, modifier: 0, mode: 'disadvantage' },
  ] satisfies DicePreset[])('uses normal dice for ineligible $count d$sides presets', (preset) => {
    const result = rollDice(preset, () => 0)

    expect(getDiceRollMode(preset)).toBe('normal')
    expect(result.preset.mode).toBe('normal')
    expect(result.values).toHaveLength(preset.count)
    expect(result.total).toBe(preset.count)
    expect(result.keptIndex).toBeUndefined()
    expect(result.omittedIndex).toBeUndefined()
  })
})
