import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { SpellReference } from '../spells/spells'
import CharacterPdfImport from './CharacterPdfImport'
import CharacterSheet from './CharacterSheet'
import CharacterSpellEditor from './CharacterSpellEditor'
import type { CharacterPdfDraft } from './characterPdfDraft'
import {
  abilities,
  ancestryLabels,
  editionNames,
  editions,
  isCharacterSheet,
  themes,
  type CharacterEdition,
  type CharacterSheet as CharacterSheetData,
  type CharacterTheme,
} from './characterSheets'

interface CharacterSheetFormProps {
  name: string
  initialSheet?: CharacterSheetData
  onSave: (sheet: CharacterSheetData) => void
  onCancel?: () => void
  cancelTo?: string
}

const themeNames = { atlas: 'Atlas', ember: 'Ember', moon: 'Moon' } satisfies Record<CharacterTheme, string>

const defaultSheet: CharacterSheetData = {
  edition: '2014',
  theme: 'atlas',
  level: 1,
  className: '',
  ancestry: '',
  background: '',
  armorClass: 10,
  currentHitPoints: 1,
  maxHitPoints: 1,
  abilityScores: {
    strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10,
  },
}

interface NumberFieldProps {
  label: string
  value: string
  min: number
  max?: number
  onChange: (value: string) => void
}

function NumberField({ label, value, min, max = Number.MAX_SAFE_INTEGER, onChange }: NumberFieldProps) {
  return (
    <label className="editor-field character-form__number">
      {label}
      <input
        required
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  )
}

function readNumber(value: string) {
  return value === '' ? NaN : Number(value)
}

function previewNumber(value: number, fallback: number, min: number, max = Number.MAX_SAFE_INTEGER) {
  return Number.isSafeInteger(value) && value >= min && value <= max ? value : fallback
}

export default function CharacterSheetForm({
  name, initialSheet = defaultSheet, onSave, onCancel, cancelTo,
}: CharacterSheetFormProps) {
  const themeGroup = useId()
  const previewId = useId()
  const [edition, setEdition] = useState(initialSheet.edition)
  const [theme, setTheme] = useState(initialSheet.theme)
  const [level, setLevel] = useState(String(initialSheet.level))
  const [className, setClassName] = useState(initialSheet.className)
  const [subclassName, setSubclassName] = useState(initialSheet.subclassName ?? '')
  const [ancestry, setAncestry] = useState(initialSheet.ancestry)
  const [background, setBackground] = useState(initialSheet.background)
  const [armorClass, setArmorClass] = useState(String(initialSheet.armorClass))
  const [currentHitPoints, setCurrentHitPoints] = useState(String(initialSheet.currentHitPoints))
  const [maxHitPoints, setMaxHitPoints] = useState(String(initialSheet.maxHitPoints))
  const [spells, setSpells] = useState<SpellReference[]>(initialSheet.spells ?? [])
  const [scores, setScores] = useState(() => Object.fromEntries(abilities.map((ability) => (
    [ability, String(initialSheet.abilityScores[ability])]
  ))))
  const [error, setError] = useState('')

  const draft: CharacterSheetData = {
    edition,
    theme,
    level: readNumber(level),
    className: className.trim(),
    subclassName: subclassName.trim() || undefined,
    ancestry: ancestry.trim(),
    background: background.trim(),
    armorClass: readNumber(armorClass),
    currentHitPoints: readNumber(currentHitPoints),
    maxHitPoints: readNumber(maxHitPoints),
    spells: spells.length ? spells : undefined,
    abilityScores: {
      strength: readNumber(scores.strength),
      dexterity: readNumber(scores.dexterity),
      constitution: readNumber(scores.constitution),
      intelligence: readNumber(scores.intelligence),
      wisdom: readNumber(scores.wisdom),
      charisma: readNumber(scores.charisma),
    },
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (draft.currentHitPoints > draft.maxHitPoints) {
      setError('Current hit points cannot exceed maximum hit points.')
      return
    }
    if (!isCharacterSheet(draft)) {
      setError('Check the numbers on the sheet and try again.')
      return
    }

    try {
      onSave(draft)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this character sheet in this browser.')
    }
  }

  function applyPdfDraft(imported: CharacterPdfDraft) {
    if (imported.edition !== undefined) setEdition(imported.edition)
    if (imported.className !== undefined) setClassName(imported.className)
    if (imported.subclassName !== undefined) setSubclassName(imported.subclassName)
    if (imported.ancestry !== undefined) setAncestry(imported.ancestry)
    if (imported.background !== undefined) setBackground(imported.background)
    if (imported.level !== undefined) setLevel(String(imported.level))
    if (imported.armorClass !== undefined) setArmorClass(String(imported.armorClass))
    if (imported.currentHitPoints !== undefined) setCurrentHitPoints(String(imported.currentHitPoints))
    if (imported.maxHitPoints !== undefined) setMaxHitPoints(String(imported.maxHitPoints))
    const importedScores = imported.abilityScores
    if (importedScores) {
      setScores((previous) => ({
        ...previous,
        ...Object.fromEntries(Object.entries(importedScores).map(([ability, score]) => [ability, String(score)])),
      }))
    }
    setError('')
  }

  const preview: CharacterSheetData = {
    ...initialSheet,
    edition,
    theme,
    className: draft.className,
    subclassName: draft.subclassName,
    ancestry: draft.ancestry,
    background: draft.background,
    level: previewNumber(draft.level, initialSheet.level, 1, 20),
    armorClass: previewNumber(draft.armorClass, initialSheet.armorClass, 0),
    currentHitPoints: previewNumber(draft.currentHitPoints, initialSheet.currentHitPoints, 0),
    maxHitPoints: previewNumber(draft.maxHitPoints, initialSheet.maxHitPoints, 0),
    abilityScores: { ...initialSheet.abilityScores },
  }
  for (const ability of abilities) {
    preview.abilityScores[ability] = previewNumber(draft.abilityScores[ability], initialSheet.abilityScores[ability], 1, 30)
  }

  return (
    <div className="character-form-layout">
      <form className="character-form editor-form" onSubmit={submit} onChange={() => setError('')}>
        <CharacterPdfImport onApply={applyPdfDraft} />
        <label className="editor-field">
          Rules edition
          <select value={edition} onChange={(event) => setEdition(event.currentTarget.value as CharacterEdition)}>
            {editions.map((item) => <option key={item} value={item}>{editionNames[item]}</option>)}
          </select>
        </label>
        <fieldset className="character-form__section">
          <legend>Sheet design</legend>
          <div className="character-form__themes">
            {themes.map((item) => (
              <label key={item} className="character-form__theme" data-theme={item}>
                <input name={themeGroup} type="radio" value={item} checked={theme === item} onChange={() => setTheme(item)} />
                <span className="character-form__swatch" aria-hidden="true" />
                {themeNames[item]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="character-form__section">
          <legend>Character details</legend>
          <div className="character-form__fields">
            <label className="editor-field">
              Class
              <input value={className} onChange={(event) => setClassName(event.currentTarget.value)} />
            </label>
            <NumberField label="Level" value={level} min={1} max={20} onChange={setLevel} />
            <label className="editor-field">
              Subclass
              <input value={subclassName} onChange={(event) => setSubclassName(event.currentTarget.value)} />
            </label>
            <label className="editor-field">
              {ancestryLabels[edition]}
              <input value={ancestry} onChange={(event) => setAncestry(event.currentTarget.value)} />
            </label>
            <label className="editor-field">
              Background
              <input value={background} onChange={(event) => setBackground(event.currentTarget.value)} />
            </label>
          </div>
        </fieldset>
        <fieldset className="character-form__section">
          <legend>Combat stats</legend>
          <div className="character-form__fields character-form__fields--three">
            <NumberField label="Armor class" value={armorClass} min={0} onChange={setArmorClass} />
            <NumberField label="Current hit points" value={currentHitPoints} min={0} onChange={setCurrentHitPoints} />
            <NumberField label="Maximum hit points" value={maxHitPoints} min={0} onChange={setMaxHitPoints} />
          </div>
        </fieldset>
        <fieldset className="character-form__section">
          <legend>Ability scores</legend>
          <div className="character-form__fields character-form__fields--three">
            {abilities.map((ability) => (
              <NumberField
                key={ability}
                label={ability.charAt(0).toUpperCase() + ability.slice(1)}
                value={scores[ability]}
                min={1}
                max={30}
                onChange={(value) => setScores((previous) => ({ ...previous, [ability]: value }))}
              />
            ))}
          </div>
        </fieldset>
        <CharacterSpellEditor spells={spells} sheetEdition={edition} onChange={setSpells} />
        {error && <p className="editor-error" role="alert">{error}</p>}
        <div className="editor-actions">
          <button type="submit">Save character sheet</button>
          {cancelTo ? <Link className="back-link" to={cancelTo}>Cancel</Link> : onCancel && (
            <button type="button" onClick={onCancel}>Cancel</button>
          )}
        </div>
      </form>
      <section className="character-form__preview" aria-labelledby={previewId}>
        <h2 id={previewId}>Sheet preview</h2>
        <CharacterSheet name={name} sheet={preview} preview />
      </section>
    </div>
  )
}
