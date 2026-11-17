import { useState } from 'react'
import { worldEntries, type WorldEntryDraft } from './worldEntries'
import { loadWorldEntries, saveWorldEntry } from './worldEntryStorage'

export function useWorldEntries() {
  const [entries, setEntries] = useState(() => {
    try {
      return loadWorldEntries(window.localStorage)
    } catch {
      return worldEntries
    }
  })

  function saveEntry(draft: WorldEntryDraft) {
    const saved = saveWorldEntry(window.localStorage, draft)
    setEntries(saved.entries)
    return saved.entry
  }

  return { entries, saveEntry }
}
