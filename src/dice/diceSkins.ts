import type { DiceSides } from './diceGeometry'

interface DicePalette {
  hue?: number
  saturation: number
  ambient: number
  diffuse: number
  ink: string
  engraving: string
}

export interface DiceMaterial extends DicePalette {
  hue: number
}

interface DiceSkinOption {
  label: string
  swatch: readonly [string, string]
  palette: DicePalette
}

export const diceSkins = {
  atlas: {
    label: 'Atlas',
    swatch: ['#5cb59a', '#575387'],
    palette: { saturation: 1, ambient: 20, diffuse: 31, ink: '#fff0c7', engraving: '#082621' },
  },
  jade: {
    label: 'Jade',
    swatch: ['#6fcd99', '#17634a'],
    palette: { hue: 151, saturation: 1.12, ambient: 16, diffuse: 13, ink: '#f0ffd5', engraving: '#10281a' },
  },
  amber: {
    label: 'Amber',
    swatch: ['#f0bc66', '#93461f'],
    palette: { hue: 32, saturation: 1.25, ambient: 19, diffuse: 16, ink: '#fff2c9', engraving: '#40200d' },
  },
  amethyst: {
    label: 'Amethyst',
    swatch: ['#b79be9', '#593982'],
    palette: { hue: 265, saturation: 1.12, ambient: 23, diffuse: 28, ink: '#fff0ff', engraving: '#281637' },
  },
  moonstone: {
    label: 'Moonstone',
    swatch: ['#eff7ff', '#738bbd'],
    palette: { hue: 216, saturation: 0.62, ambient: 57, diffuse: 23, ink: '#14243a', engraving: '#eef6ff' },
  },
} as const satisfies Record<string, DiceSkinOption>

export type DiceSkin = keyof typeof diceSkins
export const defaultDiceSkin: DiceSkin = 'atlas'

const atlasHues: Record<DiceSides, number> = { 4: 148, 6: 160, 8: 177, 10: 192, 12: 247, 20: 161 }

export function isDiceSkin(value: unknown): value is DiceSkin {
  return typeof value === 'string' && Object.hasOwn(diceSkins, value)
}

export function diceMaterial(skin: DiceSkin, sides: DiceSides, percentile: boolean): DiceMaterial {
  const palette: DicePalette = diceSkins[skin].palette
  const hue = palette.hue === undefined
    ? (percentile ? 38 : atlasHues[sides])
    : (percentile ? palette.hue - 13 : palette.hue)
  return { ...palette, hue }
}
