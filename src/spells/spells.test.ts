import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSpellCatalog, fetchSpellDetail, isSpellReference, searchSpells, spellKey, spellPath } from './spells'

const counterspell = { index: 'counterspell', name: 'Counterspell', level: 3 }
const fireball = { index: 'fireball', name: 'Fireball', level: 3 }

afterEach(() => vi.unstubAllGlobals())

describe('spell references', () => {
  it('keeps equal spell names from different editions independently addressable', () => {
    const legacy = { ...counterspell, edition: '2014' } as const
    const revised = { ...counterspell, edition: '2024' } as const
    expect(spellKey(legacy)).not.toEqual(spellKey(revised))
    expect(spellPath(legacy)).toBe('/spells/2014/counterspell')
    expect(spellPath(revised)).toBe('/spells/2024/counterspell')
    expect(isSpellReference({ ...legacy, edition: 'mixed' })).toBe(false)
    expect(isSpellReference({ ...revised, index: '../other' })).toBe(false)
    expect(searchSpells([{ ...fireball, edition: '2024' }, revised, legacy], ' COUNTER  ')).toEqual([legacy, revised])
  })
})

describe('SRD spell requests', () => {
  it('loads the correct edition catalogue and validates its entries', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(Response.json({ results: [fireball] }))
      .mockResolvedValueOnce(Response.json({ results: [{ ...counterspell, level: null }] }))
    vi.stubGlobal('fetch', request)

    const signal = new AbortController().signal
    await expect(fetchSpellCatalog('2024', signal)).resolves.toEqual([{ ...fireball, edition: '2024' }])
    expect(request).toHaveBeenCalledWith('https://www.dnd5eapi.co/api/2024/spells', { signal })
    await expect(fetchSpellCatalog('2014')).rejects.toThrow('invalid entry')
  })

  it('normalizes the legacy array and revised text shapes without mixing their text', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(Response.json({ ...counterspell, desc: ['Legacy description'], higher_level: ['Legacy upcast'] }))
      .mockResolvedValueOnce(Response.json({ ...counterspell, description: 'Revised description\n\nAnother paragraph', casting_time: 'Reaction' }))
    vi.stubGlobal('fetch', request)

    await expect(fetchSpellDetail('2014', 'counterspell')).resolves.toMatchObject({
      edition: '2014', description: ['Legacy description'], higherLevels: ['Legacy upcast'],
    })
    await expect(fetchSpellDetail('2024', 'counterspell')).resolves.toMatchObject({
      edition: '2024', description: ['Revised description', 'Another paragraph'], higherLevels: [], castingTime: 'Reaction',
    })
  })

  it('distinguishes a missing spell from failed or mismatched responses', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ ...fireball, desc: ['A different spell'] }))
    vi.stubGlobal('fetch', request)

    await expect(fetchSpellDetail('2024', 'counterspell')).resolves.toBeNull()
    await expect(fetchSpellDetail('2024', 'counterspell')).rejects.toThrow('Could not load this spell')
    await expect(fetchSpellDetail('2014', 'counterspell')).rejects.toThrow('response was invalid')
  })
})
