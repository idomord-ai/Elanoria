import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  PLAYER_CHARACTER_KIND,
  type WorldEntry,
  type WorldEntryDraft,
} from '../catalog/worldEntries'
import CharacterSheet from '../characters/CharacterSheet'
import CharacterArtGallery from '../characters/CharacterArtGallery'
import CharacterSheetForm from '../characters/CharacterSheetForm'
import type { CharacterSheet as SheetData } from '../characters/characterSheets'
import type { DicePreset } from '../dice/DiceTray'
import NotFoundPage from './NotFoundPage'

interface CharacterSheetPageProps {
  entries: readonly WorldEntry[]
  onSave: (draft: WorldEntryDraft) => WorldEntry
  onRoll: (preset: DicePreset) => void
}

interface CharacterSheetContentProps {
  entry: WorldEntry
  onSave: CharacterSheetPageProps['onSave']
  onRoll: CharacterSheetPageProps['onRoll']
}

function CharacterSheetContent({ entry, onSave, onRoll }: CharacterSheetContentProps) {
  const [editing, setEditing] = useState(false)
  const entryUrl = '/compendium/' + encodeURIComponent(entry.id)

  function save(characterSheet: SheetData) {
    onSave({ ...entry, linkedEntries: entry.linkedEntries ?? [], characterSheet })
    setEditing(false)
  }

  return (
    <div className="character-sheet-page">
      <div className="character-sheet-page__actions">
        <Link className="back-link" to={entryUrl}>Back to character entry</Link>
        {entry.characterSheet && !editing && (
          <button className="character-sheet-page__edit" type="button" onClick={() => setEditing(true)}>
            Edit character sheet
          </button>
        )}
      </div>
      {entry.characterSheet && !editing ? (
        <CharacterSheet name={entry.title} sheet={entry.characterSheet} onRoll={onRoll} />
      ) : (
        <>
          <h1>{entry.characterSheet ? 'Edit character sheet' : 'Add character sheet'}</h1>
          <CharacterSheetForm
            name={entry.title}
            initialSheet={entry.characterSheet}
            onSave={save}
            onCancel={() => setEditing(false)}
            cancelTo={entry.characterSheet ? undefined : entryUrl}
          />
        </>
      )}
      <CharacterArtGallery key={entry.id} entryId={entry.id} />
    </div>
  )
}

export default function CharacterSheetPage({ entries, onSave, onRoll }: CharacterSheetPageProps) {
  const { id } = useParams<'id'>()
  const entry = entries.find((item) => item.id === id)
  if (entry?.kind !== PLAYER_CHARACTER_KIND) {
    return <NotFoundPage title="Player character not found" />
  }
  return <CharacterSheetContent key={entry.id} entry={entry} onSave={onSave} onRoll={onRoll} />
}
