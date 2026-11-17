import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchMonsterCatalog, getMonsterTypes, selectMonsters, type MonsterCatalogEntry, type MonsterCatalogOptions } from './monsterCatalog'
import { formatChallengeRating } from './srd'

const monsters: readonly MonsterCatalogEntry[] = [
  { index: 'blink-dog', name: 'Blink Dog', type: 'fey', challengeRating: 0.25, hitPoints: 22, armorClass: 13 },
  { index: 'basilisk', name: 'Basilisk', type: 'monstrosity', challengeRating: 3, hitPoints: 52, armorClass: 12 },
  { index: 'badger', name: 'Badger', type: 'beast', challengeRating: 0, hitPoints: 3, armorClass: 10 },
  { index: 'crab', name: 'Crab', type: 'beast', challengeRating: 0, hitPoints: 2, armorClass: null },
]

const defaultOptions: MonsterCatalogOptions = { query: '', sortBy: 'name', direction: 'asc' }

function namesFor(options: Partial<MonsterCatalogOptions>) {
  return selectMonsters(monsters, { ...defaultOptions, ...options }).map((monster) => monster.name)
}

function srdMonster(index: string, values: number[] = [14, 11]) {
  return {
    index,
    name: 'Ankheg',
    type: 'monstrosity',
    challenge_rating: 2,
    hit_points: 39,
    armor_class: values.map((value) => ({ value })),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('monster catalog selection', () => {
  it('combines name matching, exact creature type, and inclusive CR bounds', () => {
    expect(namesFor({ query: '  B  ', minCr: 0.25, maxCr: 3 })).toEqual(['Basilisk', 'Blink Dog'])
    expect(namesFor({ query: 'b', type: 'fey', minCr: 0.25, maxCr: 3 })).toEqual(['Blink Dog'])
    expect(namesFor({ type: 'beast', maxCr: 0 })).toEqual(['Badger', 'Crab'])
    expect(getMonsterTypes(monsters)).toEqual(['beast', 'fey', 'monstrosity'])
  })

  it('sorts a filtered copy numerically and uses names to break equal ratings', () => {
    expect(namesFor({ sortBy: 'cr', direction: 'desc' })).toEqual(['Basilisk', 'Blink Dog', 'Badger', 'Crab'])
    expect(namesFor({ sortBy: 'hp', direction: 'asc' })).toEqual(['Crab', 'Badger', 'Blink Dog', 'Basilisk'])
    expect(namesFor({ sortBy: 'name', direction: 'desc' })).toEqual(['Crab', 'Blink Dog', 'Basilisk', 'Badger'])
    expect(monsters[0].name).toBe('Blink Dog')
  })

  it('puts missing armor class after known values in either direction', () => {
    expect(namesFor({ sortBy: 'ac', direction: 'asc' })).toEqual(['Badger', 'Basilisk', 'Blink Dog', 'Crab'])
    expect(namesFor({ sortBy: 'ac', direction: 'desc' })).toEqual(['Blink Dog', 'Basilisk', 'Badger', 'Crab'])
  })

  it('formats fractional challenge ratings with their familiar labels', () => {
    expect([0, 0.125, 0.25, 0.5, 3].map(formatChallengeRating)).toEqual(['0', '1/8', '1/4', '1/2', '3'])
  })
})

describe('monster catalog request', () => {
  it('reads the first listed AC and handles an empty AC array in one bulk request', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({
      data: { monsters: [srdMonster('ankheg'), srdMonster('unknown', [])] },
    }))
    vi.stubGlobal('fetch', request)

    const result = await fetchMonsterCatalog(new AbortController().signal)

    expect(result.map((monster) => monster.armorClass)).toEqual([14, null])
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('continues at the next offset after a full page', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(Response.json({
        data: { monsters: Array.from({ length: 1000 }, (_, index) => srdMonster(`monster-${index}`)) },
      }))
      .mockResolvedValueOnce(Response.json({ data: { monsters: [srdMonster('last')] } }))
    vi.stubGlobal('fetch', request)
    const signal = new AbortController().signal

    const result = await fetchMonsterCatalog(signal)

    expect(result).toHaveLength(1001)
    expect(result.at(-1)?.index).toBe('last')
    expect(request.mock.calls.map(([, options]) => JSON.parse(options.body).variables.skip)).toEqual([0, 1000])
    expect(request.mock.calls.every(([, options]) => options.signal === signal)).toBe(true)
  })

  it('rejects GraphQL errors even when sent with HTTP 200 and partial data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      data: { monsters: [srdMonster('ankheg')] },
      errors: [{ message: 'One field could not load' }],
    })))

    await expect(fetchMonsterCatalog(new AbortController().signal)).rejects.toThrow('Invalid monster catalog response')
  })
})
