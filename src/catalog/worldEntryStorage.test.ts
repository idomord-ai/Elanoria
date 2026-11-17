import { describe, expect, it } from 'vitest'
import { findBacklinks, worldEntries, type WorldEntryDraft } from './worldEntries'
import { loadWorldEntries, saveWorldEntry } from './worldEntryStorage'

function createStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
  }
}

const draft: WorldEntryDraft = {
  title: ' Expedition Journal ',
  kind: 'Location',
  summary: ' Notes from an expedition. ',
  linkedEntries: [{ id: 'elanor' }, { id: 'monster:basilisk', title: 'Basilisk' }],
}

describe('world entry storage', () => {
  it('restores a saved article and its backlinks to both a catalog entry and a monster', () => {
    const storage = createStorage()
    expect(loadWorldEntries(storage)).toEqual(worldEntries)

    const { entry } = saveWorldEntry(storage, draft)
    const restored = loadWorldEntries(storage)

    expect(entry.title).toBe('Expedition Journal')
    expect(entry.summary).toBe('Notes from an expedition.')
    expect(restored).toContainEqual(entry)
    expect(entry.linkedEntries).toEqual(draft.linkedEntries)
    expect(findBacklinks(restored, 'elanor')).toEqual([entry])
    expect(findBacklinks(restored, 'monster:basilisk')).toEqual([entry])
  })

  it('updates a starter article at its existing ID and removes cleared backlinks', () => {
    const storage = createStorage()
    const { entry } = saveWorldEntry(storage, { ...draft, id: 'elanor' })
    expect(findBacklinks(loadWorldEntries(storage), 'monster:basilisk')).toEqual([entry])
    expect(findBacklinks(loadWorldEntries(storage), 'elanor')).toEqual([])

    const { entry: updated } = saveWorldEntry(storage, {
      ...draft,
      id: entry.id,
      title: 'A New Title',
      linkedEntries: [],
    })
    const restored = loadWorldEntries(storage)

    expect(updated.id).toBe('elanor')
    expect(restored.filter(({ id }) => id === 'elanor')).toEqual([updated])
    expect(restored).toHaveLength(worldEntries.length)
    expect(findBacklinks(restored, 'monster:basilisk')).toEqual([])
  })

  it('assigns distinct IDs to articles with the same title as a starter article', () => {
    const storage = createStorage()
    const first = saveWorldEntry(storage, { ...draft, title: 'Elanor' }).entry
    const second = saveWorldEntry(storage, { ...draft, title: 'Elanor' }).entry

    expect(new Set([first.id, second.id, 'elanor']).size).toBe(3)
    expect(loadWorldEntries(storage)).toContainEqual(first)
    expect(loadWorldEntries(storage)).toContainEqual(second)
  })

  it('restores distinct PC and NPC entries with their links and previously saved locations', () => {
    const storage = createStorage()
    const location = saveWorldEntry(storage, draft).entry
    const playerCharacter = saveWorldEntry(storage, {
      ...draft,
      title: 'Mira',
      kind: 'Player Character (PC)',
      linkedEntries: [{ id: location.id }],
    }).entry
    const nonPlayerCharacter = saveWorldEntry(storage, {
      ...draft,
      title: 'Orren',
      kind: 'Non-Player Character (NPC)',
      linkedEntries: [{ id: playerCharacter.id }],
    }).entry

    const restored = loadWorldEntries(storage)
    expect(restored).toEqual(expect.arrayContaining([location, playerCharacter, nonPlayerCharacter]))
    expect(findBacklinks(restored, location.id)).toEqual([playerCharacter])
    expect(findBacklinks(restored, playerCharacter.id)).toEqual([nonPlayerCharacter])
  })

  it('preserves stored data when the stored article format is invalid', () => {
    let stored = '{"entries":[]}'
    const storage = {
      getItem: () => stored,
      setItem: (_key: string, value: string) => { stored = value },
    }

    expect(() => saveWorldEntry(storage, draft)).toThrow('Saved articles could not be read.')
    expect(stored).toBe('{"entries":[]}')
  })
})
