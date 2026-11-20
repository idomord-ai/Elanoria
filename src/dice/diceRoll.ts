export const diceSides = [4, 6, 8, 10, 12, 20, 100] as const
export const maxDiceCount = 20
export const maxDiceModifier = 999

export type DiceSides = (typeof diceSides)[number]
export type DiceRollMode = 'normal' | 'advantage' | 'disadvantage'

export interface DicePreset {
  sides: DiceSides
  count: number
  modifier: number
  label?: string
  mode?: DiceRollMode
}

export interface SceneDie {
  sides: Exclude<DiceSides, 100>
  value: number
  percentile?: boolean
  percentileUnit?: boolean
}

export interface DiceRoll {
  preset: DicePreset
  values: number[]
  dice: SceneDie[]
  total: number
  keptIndex?: 0 | 1
  omittedIndex?: 0 | 1
}

export function getDiceRollMode({ sides, count, mode }: Pick<DicePreset, 'sides' | 'count' | 'mode'>): DiceRollMode {
  if (sides === 20 && count === 1 && (mode === 'advantage' || mode === 'disadvantage')) return mode
  return 'normal'
}

export function getSceneDice(sides: DiceSides, values: readonly number[]): SceneDie[] {
  if (sides !== 100) return values.map((value) => ({ sides, value }))

  return values.flatMap((value) => [
    { sides: 10, value: Math.floor(value / 10) || 10, percentile: true },
    { sides: 10, value: value % 10 || 10, percentileUnit: true },
  ])
}

export function rollDice(preset: DicePreset, random = Math.random): DiceRoll {
  const mode = getDiceRollMode(preset)
  const rollCount = mode === 'normal' ? preset.count : 2
  const values = Array.from({ length: rollCount }, () => Math.floor(random() * preset.sides) + 1)
  const dice = getSceneDice(preset.sides, values)

  if (mode !== 'normal') {
    const keepSecond = mode === 'advantage' ? values[1] > values[0] : values[1] < values[0]
    const keptIndex = keepSecond ? 1 : 0
    return {
      preset,
      values,
      dice,
      total: values[keptIndex] + preset.modifier,
      keptIndex,
      omittedIndex: keepSecond ? 0 : 1,
    }
  }

  return {
    preset: preset.mode === undefined || preset.mode === 'normal' ? preset : { ...preset, mode: 'normal' },
    values,
    dice,
    total: values.reduce((sum, value) => sum + value, preset.modifier),
  }
}

export function formatDiceFormula(preset: DicePreset): string {
  const { count, sides, modifier } = preset
  const displayedCount = getDiceRollMode(preset) === 'normal' ? count : 2
  const modifierText = modifier === 0 ? '' : ` ${modifier < 0 ? '−' : '+'} ${Math.abs(modifier)}`
  return `${displayedCount}d${sides}${modifierText}`
}
