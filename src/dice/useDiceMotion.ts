import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

type MotionMode = 'off' | 'asking' | 'sensor' | 'touch'
type MotionConstructor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<PermissionState>
}

interface PointerHold {
  id: number
  target: HTMLButtonElement
}

function magnitude(...values: (number | null | undefined)[]): number | undefined {
  const readings = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  return readings.length ? Math.hypot(...readings) : undefined
}

export function useDiceMotion(open: boolean, reducedMotion: boolean, onRelease: (strength: number) => void) {
  const touchAvailable = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0
  const [mode, setMode] = useState<MotionMode>('off')
  const [currentStrength, setCurrentStrength] = useState<number | null>(null)
  const [wasOpen, setWasOpen] = useState(open)
  const pointer = useRef<PointerHold>(null)
  const strength = useRef(0)

  if (wasOpen !== open) {
    setWasOpen(open)
    if (!open) setCurrentStrength(null)
  }

  const shaking = currentStrength !== null
  const shakeStrength = currentStrength ?? 0

  const releaseCapture = useCallback(() => {
    const held = pointer.current
    pointer.current = null
    if (held?.target.hasPointerCapture(held.id)) held.target.releasePointerCapture(held.id)
  }, [])

  const stopHolding = useCallback(() => {
    releaseCapture()
    setCurrentStrength(null)
  }, [releaseCapture])

  async function enable() {
    const sensor = window.isSecureContext ? window.DeviceMotionEvent as MotionConstructor | undefined : undefined
    if (!sensor) {
      setMode('touch')
      return
    }

    setMode('asking')
    try {
      const permission = await sensor.requestPermission?.()
      setMode(permission === undefined || permission === 'granted' ? 'sensor' : 'touch')
    } catch {
      setMode('touch')
    }
  }

  function disable() {
    stopHolding()
    setMode('off')
  }

  function startHolding(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.pointerType !== 'touch' || pointer.current) return
    event.preventDefault()

    pointer.current = { id: event.pointerId, target: event.currentTarget }
    event.currentTarget.setPointerCapture(event.pointerId)
    strength.current = 0.16
    setCurrentStrength(strength.current)
  }

  function release(event: PointerEvent<HTMLButtonElement>) {
    if (pointer.current?.id !== event.pointerId) return
    event.preventDefault()
    const measuredStrength = strength.current
    stopHolding()
    onRelease(measuredStrength)
  }

  function cancel(event: PointerEvent<HTMLButtonElement>) {
    if (pointer.current?.id === event.pointerId) stopHolding()
  }

  useEffect(() => {
    if (!open || !shaking) return

    const cancelIfHidden = () => {
      if (document.hidden) stopHolding()
    }
    window.addEventListener('blur', stopHolding)
    document.addEventListener('visibilitychange', cancelIfHidden)

    return () => {
      releaseCapture()
      window.removeEventListener('blur', stopHolding)
      document.removeEventListener('visibilitychange', cancelIfHidden)
    }
  }, [open, shaking, releaseCapture, stopHolding])

  useEffect(() => {
    if (!open || !shaking || mode !== 'sensor' || reducedMotion) return

    let lastReadingTime = 0
    function updateStrength(event: DeviceMotionEvent) {
      if (!pointer.current || event.timeStamp - lastReadingTime < 32) return
      lastReadingTime = event.timeStamp

      const linear = event.acceleration
      const raw = event.accelerationIncludingGravity
      const rawAcceleration = magnitude(raw?.x, raw?.y, raw?.z)
      const acceleration = magnitude(linear?.x, linear?.y, linear?.z) ?? Math.abs((rawAcceleration ?? 9.81) - 9.81)
      const rate = event.rotationRate
      const turn = magnitude(rate?.alpha, rate?.beta, rate?.gamma) ?? 0
      strength.current = Math.min(1, Math.max(0.16, strength.current * 0.7, acceleration / 14, turn / 320))
      setCurrentStrength(strength.current)
    }

    window.addEventListener('devicemotion', updateStrength)
    return () => window.removeEventListener('devicemotion', updateStrength)
  }, [open, shaking, mode, reducedMotion])

  return { touchAvailable, mode, enable, disable, shaking, shakeStrength, startHolding, release, cancel, stopHolding }
}
