export interface Portal {
  id: string
  name: string
  entryIds: readonly string[]
}

export interface PortalDraft extends Omit<Portal, 'id'> {
  id?: string
}

const storageKey = 'elanoria.portals'

type PortalStorage = Pick<Storage, 'getItem' | 'setItem'>

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPortal(value: unknown): value is Portal {
  if (typeof value !== 'object' || value === null) return false
  const { id, name, entryIds } = value as Record<string, unknown>
  return isNonEmptyString(id) && isNonEmptyString(name)
    && Array.isArray(entryIds) && entryIds.every(isNonEmptyString)
}

export function loadPortals(storage: PortalStorage): Portal[] {
  try {
    const stored = storage.getItem(storageKey)
    if (stored === null) return []

    const portals: unknown = JSON.parse(stored)
    if (Array.isArray(portals) && portals.every(isPortal)
      && new Set(portals.map((portal) => portal.id)).size === portals.length) {
      return portals
    }
    throw new Error('Invalid saved portal data.')
  } catch {
    throw new Error('Saved portals could not be read.')
  }
}

function createPortalId(portals: readonly Portal[]): string {
  const takenIds = new Set(portals.map((portal) => portal.id))
  let number = portals.length + 1
  while (takenIds.has(`portal-${number}`)) number += 1
  return `portal-${number}`
}

export function savePortal(storage: PortalStorage, draft: PortalDraft) {
  const name = draft.name.trim()
  if (!name) throw new Error('Enter a portal name.')
  if (!draft.entryIds.every(isNonEmptyString)) throw new Error('A linked entry is invalid.')

  const savedPortals = loadPortals(storage)
  const existing = savedPortals.find((portal) => portal.id === draft.id)
  if (draft.id !== undefined && !existing) throw new Error('The portal could not be found.')

  const portal: Portal = {
    id: existing?.id ?? createPortalId(savedPortals),
    name,
    entryIds: [...new Set(draft.entryIds)],
  }
  const portals = existing
    ? savedPortals.map((saved) => saved.id === portal.id ? portal : saved)
    : [...savedPortals, portal]

  try {
    storage.setItem(storageKey, JSON.stringify(portals))
  } catch {
    throw new Error('The portal could not be saved in this browser.')
  }
  return { portal, portals }
}
