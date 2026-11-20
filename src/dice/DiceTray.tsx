import { lazy, Suspense, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  diceSides, formatDiceFormula, getDiceRollMode, getSceneDice, maxDiceCount, maxDiceModifier, rollDice,
  type DicePreset, type DiceRoll, type DiceRollMode, type DiceSides,
} from './diceRoll'
import { defaultDiceSkin, diceSkins, isDiceSkin, type DiceSkin } from './diceSkins'
import { useDiceMotion } from './useDiceMotion'
import './diceTray.css'

export type { DicePreset } from './diceRoll'

const DiceScene = lazy(() => import('./DiceScene'))
const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
const skinStorageKey = 'elanoria.diceSkin'
const skinChoices = Object.keys(diceSkins) as DiceSkin[]
const modeLabels = { normal: 'Normal', advantage: 'Advantage', disadvantage: 'Disadvantage' } as const
const modeChoices = Object.keys(modeLabels) as DiceRollMode[]

interface DiceTrayProps {
  open: boolean
  preset?: DicePreset
  onClose: () => void
}

interface VisibleRoll {
  id: number
  result: DiceRoll
  strength: number
  settled: boolean
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.(reducedMotionQuery)?.matches ?? false)

  useEffect(() => {
    const preference = window.matchMedia?.(reducedMotionQuery)
    if (!preference) return
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    preference.addEventListener('change', onChange)
    return () => preference.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function DiceResult({ result }: { result: DiceRoll }) {
  const { preset, total, values, keptIndex, omittedIndex } = result
  const mode = getDiceRollMode(preset)
  const formula = [preset.label, mode !== 'normal' && modeLabels[mode], formatDiceFormula(preset)].filter(Boolean).join(' · ')

  return (
    <>
      <div className="dice-tray__total"><span>Total</span> <strong>{total}</strong></div>
      <div>
        <p className="dice-tray__formula">{formula}</p>
        {keptIndex !== undefined && omittedIndex !== undefined ? (
          <p className="dice-tray__faces">Kept <strong>{values[keptIndex]}</strong> · Dropped {values[omittedIndex]}</p>
        ) : (
          <p className="dice-tray__faces">{values.length === 1 ? 'Die' : 'Dice'} {values.join(', ')}</p>
        )}
      </div>
    </>
  )
}

function readDiceSkin(): DiceSkin {
  try {
    const saved = localStorage.getItem(skinStorageKey)
    return isDiceSkin(saved) ? saved : defaultDiceSkin
  } catch {
    return defaultDiceSkin
  }
}

function DiceSkinSwatch({ skin }: { skin: DiceSkin }) {
  const [light, dark] = diceSkins[skin].swatch
  return <span className="dice-tray__skin-swatch" aria-hidden="true" style={{ background: `linear-gradient(135deg, ${light}, ${dark})` }} />
}

export default function DiceTray({ open, preset, onClose }: DiceTrayProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const motionHintId = useId()
  const countErrorId = useId()
  const modifierErrorId = useId()
  const modeHintId = useId()
  const [sides, setSides] = useState<DiceSides>(20)
  const [countText, setCountText] = useState('1')
  const [modifierText, setModifierText] = useState('0')
  const [mode, setMode] = useState<DiceRollMode>('normal')
  const [skin, setSkin] = useState(readDiceSkin)
  const [label, setLabel] = useState<string>()
  const [roll, setRoll] = useState<VisibleRoll>()
  const [previousSession, setPreviousSession] = useState<{ open: boolean; preset?: DicePreset }>({ open: false })
  const nextId = useRef(0)
  const activeRoll = useRef<number>(undefined)
  const reducedMotion = useReducedMotion()

  if (previousSession.open !== open || (open && previousSession.preset !== preset)) {
    setPreviousSession({ open, preset })
    if (open && preset) {
      setSides(preset.sides)
      setCountText(String(preset.count))
      setModifierText(String(preset.modifier))
      setMode(getDiceRollMode(preset))
      setLabel(preset.label)
      setRoll(undefined)
    } else if (!open && roll && !roll.settled) {
      setRoll({ ...roll, settled: true })
    }
  }

  const count = Number(countText)
  const modifier = Number(modifierText)
  const validCount = Number.isInteger(count) && count >= 1 && count <= maxDiceCount
  const validModifier = Number.isInteger(modifier) && Math.abs(modifier) <= maxDiceModifier
  const selectionValid = validCount && validModifier
  const allowMode = sides === 20 && count === 1
  const rollMode = getDiceRollMode({ sides, count, mode })
  const rolling = roll !== undefined && !roll.settled
  const previewCount = rollMode === 'normal' ? (validCount ? count : 1) : 2
  const previewDice = useMemo(() => getSceneDice(sides, Array.from({ length: previewCount }, () => 1)), [sides, previewCount])

  const settle = useCallback((id: number) => {
    if (id !== activeRoll.current) return
    activeRoll.current = undefined
    setRoll((current) => current?.id === id ? { ...current, settled: true } : current)
  }, [])

  function throwDice(strength = 0) {
    if (!selectionValid || activeRoll.current !== undefined) return
    const id = ++nextId.current
    if (!reducedMotion) activeRoll.current = id
    setRoll({ id, result: rollDice({ sides, count, modifier, label, mode: rollMode }), strength, settled: reducedMotion })
  }

  const motion = useDiceMotion(open, reducedMotion, throwDice)

  useLayoutEffect(() => {
    const element = dialog.current
    if (!element) return
    if (!open) {
      activeRoll.current = undefined
      if (element.open) element.close()
      return
    }
    if (preset) activeRoll.current = undefined
    if (!element.open) element.showModal()
  }, [open, preset])

  function clearResult() {
    setLabel(undefined)
    setRoll(undefined)
  }

  function selectSkin(choice: DiceSkin) {
    setSkin(choice)
    try {
      localStorage.setItem(skinStorageKey, choice)
    } catch {
      // Storage restrictions still allow a skin for the current session.
    }
  }

  function closeTray() {
    motion.stopHolding()
    onClose()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!motion.shaking) throwDice()
  }

  const sceneDice = motion.shaking ? previewDice : roll?.result.dice ?? previewDice
  const motionEnabled = motion.mode === 'sensor' || motion.mode === 'touch'
  const inputLocked = rolling || motion.shaking
  const actionDisabled = !selectionValid || inputLocked

  return (
    <dialog
      ref={dialog}
      className="dice-tray"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        closeTray()
      }}
    >
      <header className="dice-tray__header">
        <h2 id={titleId}>Dice tray</h2>
        <button className="dice-tray__close" type="button" aria-label="Close dice tray" onClick={closeTray}>×</button>
      </header>
      <form className="dice-tray__form" onSubmit={submit} noValidate>
        <fieldset className="dice-tray__selector" disabled={inputLocked}>
          <legend>Dice type</legend>
          <div className="dice-tray__sides">
            {diceSides.map((choice) => (
              <button
                key={choice}
                type="button"
                aria-pressed={sides === choice}
                onClick={() => {
                  if (sides === choice) return
                  setSides(choice)
                  setMode('normal')
                  clearResult()
                }}
              >
                d{choice}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="dice-tray__inputs">
          <label>
            Dice count
            <input
              type="number"
              min={1}
              max={maxDiceCount}
              value={countText}
              disabled={inputLocked}
              aria-invalid={!validCount || undefined}
              aria-describedby={validCount ? undefined : countErrorId}
              onChange={(event) => {
                const nextCount = event.currentTarget.value
                setCountText(nextCount)
                if (Number(nextCount) !== 1) setMode('normal')
                clearResult()
              }}
            />
          </label>
          <label>
            Modifier
            <input
              type="number"
              min={-maxDiceModifier}
              max={maxDiceModifier}
              value={modifierText}
              placeholder="0"
              disabled={inputLocked}
              aria-invalid={!validModifier || undefined}
              aria-describedby={validModifier ? undefined : modifierErrorId}
              onChange={(event) => {
                setModifierText(event.currentTarget.value)
                clearResult()
              }}
            />
          </label>
        </div>
        {!validCount && <p id={countErrorId} className="dice-tray__error">Enter a whole dice count between 1 and {maxDiceCount}.</p>}
        {!validModifier && <p id={modifierErrorId} className="dice-tray__error">Enter a whole modifier between −{maxDiceModifier} and {maxDiceModifier}.</p>}
        {sides === 20 && (
          <fieldset className="dice-tray__selector" disabled={inputLocked} aria-describedby={allowMode ? undefined : modeHintId}>
            <legend>Roll mode</legend>
            <div className="dice-tray__modes">
              {modeChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={rollMode === choice}
                  disabled={!allowMode && choice !== 'normal'}
                  onClick={() => {
                    if (rollMode === choice) return
                    setMode(choice)
                    setRoll(undefined)
                  }}
                >
                  {modeLabels[choice]}
                </button>
              ))}
            </div>
            {!allowMode && <p id={modeHintId} className="dice-tray__mode-note">Set dice count to 1 to use advantage or disadvantage.</p>}
          </fieldset>
        )}
        <details className="dice-tray__skins">
          <summary>
            Dice skin
            <span className="dice-tray__selected-skin"><DiceSkinSwatch skin={skin} />{diceSkins[skin].label}</span>
          </summary>
          <fieldset className="dice-tray__selector dice-tray__skin-options" aria-label="Dice skins" disabled={inputLocked}>
            {skinChoices.map((choice) => (
              <button key={choice} type="button" aria-pressed={skin === choice} onClick={() => selectSkin(choice)}>
                <DiceSkinSwatch skin={choice} />
                {diceSkins[choice].label}
              </button>
            ))}
          </fieldset>
        </details>
        {label && <p className="dice-tray__preset">{label} <span>{formatDiceFormula({ sides, count, modifier, mode: rollMode })}</span></p>}
        <div className="dice-tray__stage" aria-hidden="true" data-shaking={motion.shaking || undefined}>
          {open && (
            <Suspense fallback={null}>
              <DiceScene
                dice={sceneDice}
                skin={skin}
                keptIndex={!motion.shaking && roll?.settled ? roll.result.keptIndex : undefined}
                rollId={rolling ? roll.id : undefined}
                shaking={motion.shaking}
                shakeStrength={motion.shaking ? motion.shakeStrength : roll?.strength ?? 0}
                reducedMotion={reducedMotion}
                onSettled={settle}
              />
            </Suspense>
          )}
        </div>
        <div className="dice-tray__result" role="status" aria-atomic="true">
          {roll && (roll.settled ? <DiceResult result={roll.result} /> : <p>Rolling…</p>)}
        </div>
        <div className="dice-tray__actions">
          <button className="dice-tray__roll" type="submit" aria-disabled={actionDisabled}>Roll dice</button>
          {motion.touchAvailable && (motionEnabled ? (
            <button
              className="dice-tray__shake"
              type="button"
              aria-describedby={motionHintId}
              aria-disabled={!selectionValid || rolling}
              onPointerDown={(event) => {
                if (!actionDisabled) motion.startHolding(event)
              }}
              onPointerUp={motion.release}
              onPointerCancel={motion.cancel}
              onLostPointerCapture={motion.cancel}
              onClick={(event) => {
                if (event.detail === 0 && !actionDisabled) throwDice()
              }}
            >
              {motion.shaking ? 'Release to throw' : motion.mode === 'sensor' ? 'Hold to shake' : 'Hold to throw'}
            </button>
          ) : (
            <button className="dice-tray__enable" type="button" disabled={motion.mode === 'asking'} onClick={() => void motion.enable()}>
              {motion.mode === 'asking' ? 'Waiting for permission…' : 'Enable shake to roll'}
            </button>
          ))}
        </div>
        {motionEnabled && (
          <div className="dice-tray__motion-settings">
            <p className="dice-tray__motion-hint" id={motionHintId}>
              {motion.mode === 'sensor' ? 'Hold the button, shake your phone, then release to throw.' : 'Press and hold, then release to throw.'}
            </p>
            <button type="button" className="dice-tray__motion-off" onClick={motion.disable}>Turn off phone throw</button>
          </div>
        )}
      </form>
    </dialog>
  )
}
