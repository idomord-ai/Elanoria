import { entryKindGroups, type EntryKind, type WorldEntry } from '../catalog/worldEntries'
import CatalogCard, { type CatalogCardTone } from './CatalogCard'

type EntryKindGroup = keyof typeof entryKindGroups

const groupTones: Record<EntryKindGroup, CatalogCardTone> = {
  'Characters and groups': 'actors',
  Places: 'places',
  'Items and magic': 'magic',
  Lore: 'lore',
  Campaign: 'campaign',
}

const tonesByKind = new Map<EntryKind, CatalogCardTone>()
for (const group of Object.keys(groupTones) as EntryKindGroup[]) {
  for (const kind of entryKindGroups[group]) tonesByKind.set(kind, groupTones[group])
}

interface WorldEntryCardProps {
  entry: WorldEntry
  kingdom?: WorldEntry
}

export default function WorldEntryCard({ entry, kingdom }: WorldEntryCardProps) {
  return (
    <CatalogCard
      title={entry.title}
      kind={entry.kind}
      tone={tonesByKind.get(entry.kind) ?? 'places'}
      to={'/compendium/' + encodeURIComponent(entry.id)}
      summary={entry.summary}
      kingdomTheme={kingdom?.kingdomTheme}
      kingdomName={kingdom?.id === entry.id ? undefined : kingdom?.title}
    />
  )
}
