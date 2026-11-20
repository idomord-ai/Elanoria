export const kingdomThemes = {
  moon: 'Empire of the Moon',
  sun: 'Empire of the Sun',
  'crystal-dragons': 'Empire of the Crystal Dragons',
  'red-star': 'Kingdom of the Red Star',
  'awakened-wilds': 'Awakened Creatures',
  clouds: 'Kingdom in the Clouds',
  'old-secrets': 'Keepers of Old Secrets',
} as const

export type KingdomTheme = keyof typeof kingdomThemes

export function isKingdomTheme(value: unknown): value is KingdomTheme {
  return typeof value === 'string' && Object.hasOwn(kingdomThemes, value)
}
