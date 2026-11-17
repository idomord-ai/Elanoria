import { useState } from 'react'
import { loadPortals, savePortal, type Portal, type PortalDraft } from './portalStorage'

function browserStorage(): Storage {
  try {
    return window.localStorage
  } catch {
    throw new Error('Portal storage is unavailable in this browser.')
  }
}

function initialState(): { portals: Portal[]; loadError?: string } {
  try {
    return { portals: loadPortals(browserStorage()) }
  } catch (error) {
    return {
      portals: [],
      loadError: error instanceof Error ? error.message : 'Saved portals could not be read.',
    }
  }
}

export function usePortals() {
  const [{ portals, loadError }, setState] = useState(initialState)

  function save(draft: PortalDraft) {
    const saved = savePortal(browserStorage(), draft)
    setState({ portals: saved.portals })
    return saved.portal
  }

  return { portals, loadError, savePortal: save }
}
