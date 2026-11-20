import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Rotation } from './diceGeometry'
import { dieLabel, drawDice, getDiceLayout, positionDie, rollLength, type DiceSceneDie, type DiePose } from './diceRendering'
import { defaultDiceSkin, diceMaterial, type DiceSkin } from './diceSkins'
import './diceScene.css'

interface DiceSceneProps {
  dice: readonly DiceSceneDie[]
  rollId: number | undefined
  shaking: boolean
  shakeStrength: number
  reducedMotion: boolean
  onSettled: (rollId: number) => void
  skin?: DiceSkin
  keptIndex?: number
}

function canvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  try {
    return canvas.getContext('2d')
  } catch {
    return null
  }
}

export default function DiceScene(props: DiceSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const latestProps = useRef(props)
  const requestDraw = useRef<() => void>(undefined)
  const [showFallback, setShowFallback] = useState(false)

  useLayoutEffect(() => {
    latestProps.current = props
    requestDraw.current?.()
  }, [props])

  useEffect(() => {
    const scene = sceneRef.current
    const canvas = canvasRef.current
    if (!scene || !canvas) return

    const context = canvasContext(canvas)
    if (!context) setShowFallback(true)

    let frame: number | undefined
    let currentRoll: number | undefined
    let settledRoll: number | undefined
    let startedRolling = 0
    let startedShaking: number | undefined
    let poses: DiePose[] = []
    let launchRotations: Rotation[] = []

    function schedule() {
      if (frame === undefined) frame = requestAnimationFrame(draw)
    }

    function draw(time: number) {
      frame = undefined
      const { dice, rollId, shaking, shakeStrength, reducedMotion, onSettled, skin = defaultDiceSkin, keptIndex } = latestProps.current
      const canAnimate = Boolean(context) && !reducedMotion
      const strength = Math.max(0, Math.min(1, shakeStrength))

      if (rollId !== currentRoll) {
        currentRoll = rollId
        startedRolling = time
        launchRotations = poses.map(({ rotation }) => rotation)
      }
      startedShaking = shaking ? startedShaking ?? time : undefined

      const rolling = rollId !== undefined && rollId !== settledRoll && !shaking
      const elapsed = time - startedRolling
      const stillRolling = canAnimate && rolling && elapsed < rollLength(dice.length)
      const animatingShake = canAnimate && shaking

      if (scene && canvas && context && scene.clientWidth > 0) {
        const layout = getDiceLayout(scene.clientWidth, dice.length)
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
        const width = Math.ceil(layout.width * pixelRatio)
        const height = Math.ceil(layout.height * pixelRatio)
        if (canvas.width !== width) canvas.width = width
        if (canvas.height !== height) canvas.height = height
        const heightStyle = `${layout.height}px`
        if (canvas.style.height !== heightStyle) canvas.style.height = heightStyle

        poses = dice.map((die, index) => positionDie(die, index, {
          shaking: animatingShake,
          strength,
          time: startedShaking === undefined ? elapsed : time - startedShaking,
          rollId: stillRolling ? rollId : undefined,
          start: launchRotations[index],
        }))
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
        drawDice(context, layout, dice, poses, skin, keptIndex)
      }

      if (rolling && !stillRolling) {
        settledRoll = rollId
        onSettled(rollId)
      }
      if (stillRolling || animatingShake) schedule()
    }

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null
    observer?.observe(scene)
    window.addEventListener('resize', schedule)
    requestDraw.current = schedule
    schedule()

    return () => {
      requestDraw.current = undefined
      observer?.disconnect()
      window.removeEventListener('resize', schedule)
      if (frame !== undefined) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="dice-scene" ref={sceneRef} aria-hidden="true">
      <canvas className="dice-scene__canvas" ref={canvasRef} hidden={showFallback} />
      {showFallback && (
        <div className="dice-scene__fallback">
          {props.dice.map((die, index) => {
            const { hue, saturation, ambient, ink } = diceMaterial(props.skin ?? defaultDiceSkin, die.sides, Boolean(die.percentile))
            const className = index === props.keptIndex ? 'dice-scene__tile dice-scene__tile--kept' : 'dice-scene__tile'
            const lit = `hsl(${hue} ${46 * saturation}% ${ambient + 19}%)`
            const shaded = `hsl(${hue} ${57 * saturation}% ${ambient + 7}%)`
            return (
              <div className={className} key={index} style={{
                background: `linear-gradient(155deg, ${lit}, ${shaded})`,
                borderColor: `hsl(${hue} ${42 * saturation}% ${ambient + 26}%)`,
                color: ink,
              }}>
                <span>{dieLabel(die, die.value)}</span>
                <small>{die.percentile ? 'd%' : `d${die.sides}`}</small>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
