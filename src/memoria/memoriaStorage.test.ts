import { describe, expect, it } from 'vitest'
import { loadMemoria, saveCollection, saveMemoryRecord } from './memoriaStorage'

function makeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  }
}

describe('Memoria storage', () => {
  it('persists records and only their character IDs in the selected collection', () => {
    const storage = makeStorage()
    saveCollection(storage, { name: '  Campaign One  ' })
    const [first, second] = saveCollection(storage, { name: 'Campaign Two' })
    saveMemoryRecord(storage, second.id, {
      type: 'scene', title: 'The crossing', narrative: 'They crossed the river.', characterIds: ['auren', 'auren'],
    })

    expect(loadMemoria(storage)).toEqual([
      first,
      { ...second, records: [expect.objectContaining({ type: 'scene', characterIds: ['auren'] })] },
    ])
    expect(first.name).toBe('Campaign One')
  })

  it('renames a collection and edits its record using the original IDs', () => {
    const storage = makeStorage()
    const [collection] = saveCollection(storage, { name: 'First chapter' })
    const [saved] = saveMemoryRecord(storage, collection.id, {
      type: 'memory', title: 'Opening', narrative: 'A memory.', characterIds: ['auren'],
    })
    saveCollection(storage, { id: collection.id, name: 'New name' })
    const [record] = saved.records
    saveMemoryRecord(storage, collection.id, { ...record, type: 'event', characterIds: [] })

    expect(loadMemoria(storage)).toEqual([{
      id: collection.id, name: 'New name', records: [{ ...record, type: 'event', characterIds: [] }],
    }])
  })

  it('preserves previously saved bytes when the record cannot be written', () => {
    const storage = makeStorage()
    const [saved] = saveCollection(storage, { name: 'Existing' })
    const fullStorage = { ...storage, setItem: () => { throw new Error('Quota exceeded') } }
    expect(() => saveMemoryRecord(fullStorage, saved.id, {
      type: 'event', title: 'Missing', narrative: 'This write fails.', characterIds: [],
    })).toThrow('Could not save changes')
    expect(loadMemoria(storage)).toEqual([saved])
  })
})
