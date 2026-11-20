import { useId } from 'react'
import type { DicePreset } from '../dice/DiceTray'
import { CharacterSpellLinks } from './CharacterSpellEditor'
import {
  abilities,
  ancestryLabels,
  editionNames,
  getAbilityModifier,
  getProficiencyBonus,
  type CharacterSheet as CharacterSheetData,
} from './characterSheets'
import './characterSheets.css'

interface CharacterSheetProps {
  name: string
  sheet: CharacterSheetData
  preview?: boolean
  onRoll?: (preset: DicePreset) => void
}

function signed(value: number) {
  return value >= 0 ? `+${value}` : `−${Math.abs(value)}`
}

export default function CharacterSheet({ name, sheet, preview = false, onRoll }: CharacterSheetProps) {
  const id = useId()
  const Title = preview ? 'h3' : 'h1'
  const SectionTitle = preview ? 'h4' : 'h2'
  const initiativeModifier = getAbilityModifier(sheet.abilityScores.dexterity)

  function rollButton(label: string, modifier: number) {
    if (!onRoll || preview) return null
    return (
      <button
        className="character-sheet__roll"
        type="button"
        aria-label={`Roll ${label} for ${name}`}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.currentTarget.focus({ preventScroll: true })
          onRoll({ sides: 20, count: 1, modifier, label: `${name} · ${label}` })
        }}
      >
        Roll d20
      </button>
    )
  }

  return (
    <article className="character-sheet" data-theme={sheet.theme} aria-labelledby={id}>
      <header className="character-sheet__header">
        <div className="character-sheet__identity">
          <p className="character-sheet__edition">{editionNames[sheet.edition]}</p>
          <Title id={id} className="character-sheet__name">{name}</Title>
          <p className="character-sheet__class">Level {sheet.level}{sheet.className && ` · ${sheet.className}`}</p>
          {(sheet.subclassName || sheet.ancestry || sheet.background) && (
            <dl className="character-sheet__details">
              {sheet.subclassName && <div><dt>Subclass</dt><dd>{sheet.subclassName}</dd></div>}
              {sheet.ancestry && (
                <div><dt>{ancestryLabels[sheet.edition]}</dt><dd>{sheet.ancestry}</dd></div>
              )}
              {sheet.background && <div><dt>Background</dt><dd>{sheet.background}</dd></div>}
            </dl>
          )}
        </div>
        <span className="character-sheet__crest" aria-hidden="true" />
      </header>
      <div className="character-sheet__body">
        <section className="character-sheet__combat" aria-labelledby={`${id}-combat`}>
          <SectionTitle id={`${id}-combat`}>Combat stats</SectionTitle>
          <dl className="character-sheet__stats">
            <div><dt>Armor class</dt><dd>{sheet.armorClass}</dd></div>
            <div><dt>Hit points</dt><dd>{sheet.currentHitPoints} <span>/ {sheet.maxHitPoints}</span></dd></div>
            <div>
              <dt>Base initiative</dt>
              <dd>{signed(initiativeModifier)}{rollButton('initiative', initiativeModifier)}</dd>
            </div>
            <div><dt>Proficiency bonus</dt><dd>{signed(getProficiencyBonus(sheet.level))}</dd></div>
          </dl>
        </section>
        <section className="character-sheet__abilities" aria-labelledby={`${id}-abilities`}>
          <SectionTitle id={`${id}-abilities`}>Ability scores</SectionTitle>
          <dl className="character-sheet__stats">
            {abilities.map((ability) => {
              const score = sheet.abilityScores[ability]
              const modifier = getAbilityModifier(score)
              return (
                <div key={ability} className="character-sheet__ability">
                  <dt>{ability}</dt>
                  <dd>{score} <span>{signed(modifier)}</span>{rollButton(`${ability} check`, modifier)}</dd>
                </div>
              )
            })}
          </dl>
        </section>
        {!preview && sheet.spells && sheet.spells.length > 0 && (
          <section aria-labelledby={`${id}-spells`}>
            <SectionTitle id={`${id}-spells`}>Spells</SectionTitle>
            <CharacterSpellLinks spells={sheet.spells} />
          </section>
        )}
      </div>
    </article>
  )
}
