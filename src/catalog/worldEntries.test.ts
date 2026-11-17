import { describe, expect, it } from 'vitest'
import { searchWorldEntries, type WorldEntry } from './worldEntries'

const entries: WorldEntry[] = [
  { id: 'valoria', title: 'Valoria', kind: 'Kingdom', summary: 'A coastal kingdom.' },
  { id: 'thurenderin', title: 'Thuren’derin', kind: 'City', summary: 'A mountain city.' },
  { id: 'silvervale', title: 'Silvervale', kind: 'Region', summary: 'A wooded valley.' },
]

function titlesMatching(query: string): string[] {
  return searchWorldEntries(entries, query).map((entry) => entry.title)
}

describe('searchWorldEntries', () => {
  it('returns all entries in their original order for a blank search', () => {
    expect(searchWorldEntries(entries, '  ')).toEqual(entries)
  })

  it('ignores capitalization and surrounding whitespace', () => {
    expect(titlesMatching('  VALORIA  ')).toEqual(['Valoria'])
  })

  it('finds partial title matches in their original order', () => {
    expect(titlesMatching('val')).toEqual(['Valoria', 'Silvervale'])
  })

  it('matches a straight apostrophe against a curly apostrophe in the title', () => {
    expect(titlesMatching("Thuren'derin")).toEqual(['Thuren’derin'])
  })

  it('searches titles without matching summaries or entry kinds', () => {
    expect(titlesMatching('coastal')).toEqual([])
    expect(titlesMatching('region')).toEqual([])
  })

  it('returns an empty list for an unknown title', () => {
    expect(titlesMatching('Basilisk')).toEqual([])
  })
})
