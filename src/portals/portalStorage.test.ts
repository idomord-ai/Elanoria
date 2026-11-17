import { describe, expect, it } from 'vitest'
import { loadWorldEntries, saveWorldEntry } from '../catalog/worldEntryStorage'
import { loadPortals, savePortal } from './portalStorage'

function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  }
}

describe('portal storage', () => {
  it('creates an empty portal and preserves its ID and position on edit', () => {
    const storage = createStorage()
    expect(loadPortals(storage)).toEqual([])

    const first = savePortal(storage, { name: '  Session notes  ', entryIds: [] }).portal
    const second = savePortal(storage, { name: 'Session notes', entryIds: [] }).portal
    expect(first.name).toBe('Session notes')
    expect(first.id).not.toBe(second.id)

    const entryIds = ['monster:basilisk', 'elanor', 'monster:basilisk']
    const edited = savePortal(storage, { id: first.id, name: 'Session one', entryIds }).portal
    expect(edited).toEqual({ id: first.id, name: 'Session one', entryIds: ['monster:basilisk', 'elanor'] })
    expect(loadPortals(storage)).toEqual([edited, second])
  })

  it('restores portals linked to the same article after its title changes', () => {
    const storage = createStorage()
    const article = saveWorldEntry(storage, {
      title: 'East Gate',
      summary: 'A gate on the road.',
      kind: 'Location',
      linkedEntries: [],
    }).entry
    savePortal(storage, { name: 'Next session', entryIds: [article.id] })
    savePortal(storage, { name: 'Valmyre locations', entryIds: [article.id] })

    saveWorldEntry(storage, { ...article, title: 'North Gate', linkedEntries: [] })
    const articlesById = new Map(loadWorldEntries(storage).map((entry) => [entry.id, entry]))
    const portals = loadPortals(storage)

    expect(portals.map((portal) => portal.entryIds)).toEqual([[article.id], [article.id]])
    expect(portals.map((portal) => articlesById.get(portal.entryIds[0])?.title)).toEqual(['North Gate', 'North Gate'])
  })

  it('surfaces a write failure and leaves the stored portals unchanged', () => {
    const storage = createStorage()
    const original = savePortal(storage, { name: 'Original', entryIds: [] }).portal
    const readOnly = {
      getItem: storage.getItem,
      setItem: () => { throw new Error('Storage is full') },
    }

    expect(() => savePortal(readOnly, { ...original, name: 'Changed' })).toThrow('The portal could not be saved in this browser.')
    expect(loadPortals(storage)).toEqual([original])
  })

  it('leaves unreadable data in place and reports the load error on save', () => {
    const stored = '{"portals":[]}'
    let value = stored
    const storage = {
      getItem: () => value,
      setItem: (_key: string, next: string) => { value = next },
    }

    expect(() => loadPortals(storage)).toThrow('Saved portals could not be read.')
    expect(() => savePortal(storage, { name: 'Next session', entryIds: [] })).toThrow('Saved portals could not be read.')
    expect(value).toBe(stored)
  })
})
