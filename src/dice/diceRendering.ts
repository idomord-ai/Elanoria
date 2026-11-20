import {
  add, axisRotation, combineRotation, dieMeshes, dot, interpolateRotation,
  normalize, presentFace, rotate, scale,
  type DiceSides, type DieFace, type Rotation, type Vec3,
} from './diceGeometry'
import { diceMaterial, type DiceMaterial, type DiceSkin } from './diceSkins'

export interface DiceSceneDie {
  sides: DiceSides
  value: number
  percentile?: boolean
  percentileUnit?: boolean
}

export interface DiceLayout {
  width: number
  height: number
  columns: number
  cell: number
}

interface ProjectedPoint {
  x: number
  y: number
}

interface Perspective {
  centerX: number
  centerY: number
  radius: number
}

export interface DiePose {
  rotation: Rotation
  lateral: number
  air: number
}

interface DieMotion {
  shaking: boolean
  strength: number
  time: number
  rollId: number | undefined
  start: Rotation | undefined
}

const cameraDistance = 4.4
const lightDirection = normalize([-0.52, 0.72, 0.8])
const clamp = (value: number) => Math.max(0, Math.min(1, value))

export function dieLabel(die: DiceSceneDie, value: number): string {
  if (die.percentile) return value === 10 ? '00' : String(value * 10)
  return String(die.percentileUnit && value === 10 ? 0 : value)
}

export function getDiceLayout(width: number, count: number): DiceLayout {
  const columns = Math.max(1, Math.min(count, Math.floor(width / 78), Math.ceil(Math.sqrt(count * 1.85))))
  const cell = Math.min(160, width / columns)
  const rows = Math.ceil(count / columns)
  return { width, columns, cell, height: Math.ceil(Math.max(width < 420 ? 176 : 208, rows * cell)) }
}

function rollDelay(index: number): number {
  return (index % 8) * 23
}

export function rollLength(count: number): number {
  return 1100 + (count > 0 ? rollDelay(Math.min(count - 1, 7)) : 0)
}

function hop(progress: number, start: number, end: number): number {
  const fraction = clamp((progress - start) / (end - start))
  return 4 * fraction * (1 - fraction)
}

export function positionDie(die: DiceSceneDie, index: number, motion: DieMotion): DiePose {
  const mesh = dieMeshes[die.sides]
  const face = mesh.faces[die.value - 1] ?? mesh.faces[0]
  const resting = presentFace(face, die.sides, index)
  const { strength, time, start, shaking, rollId } = motion

  if (shaking) {
    const beat = time / 1000
    const energy = 0.26 + strength * 0.74
    const side = axisRotation([0, 1, 0], Math.sin(beat * 19 + index * 1.3) * energy * 1.1)
    const pitch = axisRotation([1, 0, 0], Math.sin(beat * 24 + index) * energy * 0.78)
    return {
      rotation: combineRotation(side, combineRotation(pitch, resting)),
      lateral: Math.sin(beat * 29 + index) * energy * 0.25,
      air: 0.19 + Math.sin(beat * 22 + index) * energy * 0.12,
    }
  }

  if (rollId === undefined) return { rotation: resting, lateral: 0, air: 0 }

  const progress = clamp((time - rollDelay(index)) / 1100)
  if (progress === 1) return { rotation: resting, lateral: 0, air: 0 }

  const offset = rollId * 2.4 + index * 1.7
  const axis = normalize([Math.cos(offset), 0.65, Math.sin(offset) * 0.85])
  const incoming = start ?? combineRotation(axisRotation(axis, 0.9), resting)
  const spinCount = 2 + ((rollId + index) % 2) + Math.round(strength)
  const spinAngle = spinCount * 2 * Math.PI * (1 - (1 - progress) ** 2.65)
  const alignment = interpolateRotation(incoming, resting, progress ** 2 * (3 - 2 * progress))
  const firstBounce = hop(progress, 0, 0.52) * (0.42 + strength * 0.19)
  const laterBounces = hop(progress, 0.52, 0.75) * 0.19 + hop(progress, 0.75, 0.88) * 0.072
  return {
    rotation: combineRotation(axisRotation(axis, spinAngle), alignment),
    lateral: Math.cos(offset) * Math.sin(progress * Math.PI) * (0.42 + strength * 0.14),
    air: firstBounce + laterBounces,
  }
}

function project([x, y, z]: Vec3, { centerX, centerY, radius }: Perspective): ProjectedPoint {
  const size = radius * cameraDistance / (cameraDistance - z)
  return { x: centerX + x * size, y: centerY - y * size }
}

function drawShadow(context: CanvasRenderingContext2D, { centerX, centerY, radius }: Perspective, pose: DiePose) {
  const reach = radius * (0.95 + pose.air * 0.1)
  context.save()
  context.translate(centerX + pose.lateral * radius * 0.3, centerY + radius * 0.72)
  context.scale(1, 0.32)
  const shadow = context.createRadialGradient(0, 0, 0, 0, 0, reach)
  shadow.addColorStop(0, `rgba(0, 0, 0, ${0.63 - pose.air * 0.3})`)
  shadow.addColorStop(1, 'transparent')
  context.fillStyle = shadow
  context.fillRect(-reach, -reach, 2 * reach, 2 * reach)
  context.restore()
}

function drawKeptMarker(context: CanvasRenderingContext2D, { centerX, centerY, radius }: Perspective) {
  context.beginPath()
  context.ellipse(centerX, centerY + radius * 0.89, radius * 0.8, radius * 0.18, 0, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(225, 195, 138, 0.78)'
  context.lineWidth = 1.35
  context.stroke()
}

function drawPolygon(context: CanvasRenderingContext2D, points: readonly ProjectedPoint[]) {
  context.beginPath()
  context.moveTo(points[0].x, points[0].y)
  for (const point of points.slice(1)) context.lineTo(point.x, point.y)
  context.closePath()
  context.fill()
}

function drawLabel(
  context: CanvasRenderingContext2D,
  label: string,
  face: DieFace,
  rotation: Rotation,
  center: Vec3,
  perspective: Perspective,
  material: DiceMaterial,
) {
  const size = perspective.radius * face.labelSize * (label.length > 1 ? 0.9 : 1)
  const origin = project(center, perspective)
  const sampleDistance = 0.25
  const screenRight = project(add(center, scale(rotate(rotation, face.right), sampleDistance)), perspective)
  const screenDown = project(add(center, scale(rotate(rotation, face.up), -sampleDistance)), perspective)
  const sampleWidth = perspective.radius * sampleDistance

  context.save()
  context.transform(
    (screenRight.x - origin.x) / sampleWidth,
    (screenRight.y - origin.y) / sampleWidth,
    (screenDown.x - origin.x) / sampleWidth,
    (screenDown.y - origin.y) / sampleWidth,
    origin.x, origin.y,
  )
  context.font = `750 ${size}px system-ui, sans-serif`
  context.textBaseline = 'middle'
  context.textAlign = 'center'
  context.lineWidth = Math.max(0.7, size * 0.09)
  context.strokeStyle = material.engraving
  context.fillStyle = material.ink
  context.strokeText(label, 0, 0)
  context.fillText(label, 0, 0)
  if (label === '6' || label === '9') context.fillRect(-size * 0.16, size * 0.39, size * 0.32, size * 0.055)
  context.restore()
}

function drawDie(context: CanvasRenderingContext2D, die: DiceSceneDie, pose: DiePose, base: Perspective, skin: DiceSkin, kept: boolean) {
  drawShadow(context, base, pose)
  if (kept) drawKeptMarker(context, base)
  const perspective = {
    centerX: base.centerX + pose.lateral * base.radius,
    centerY: base.centerY - pose.air * base.radius,
    radius: base.radius * (1 + pose.air * 0.075),
  }
  const { faces, vertices } = dieMeshes[die.sides]
  const transformed = vertices.map((vertex) => project(rotate(pose.rotation, vertex), perspective))
  const material = diceMaterial(skin, die.sides, Boolean(die.percentile))
  const { hue, saturation, ambient, diffuse } = material
  const visible = faces.map((face, index) => ({
    face, index,
    center: rotate(pose.rotation, face.center),
    normal: rotate(pose.rotation, face.normal),
  })).filter(({ center, normal }) => normal[2] * cameraDistance > dot(normal, center))
    .sort((a, b) => a.center[2] - b.center[2])

  for (const { face, index, center, normal } of visible) {
    const light = ambient + Math.max(0, dot(normal, lightDirection)) * diffuse
    const corners = face.indices.map((vertex) => transformed[vertex])
    context.fillStyle = `hsl(${hue} ${53 * saturation}% ${Math.max(12, light - 10)}%)`
    drawPolygon(context, corners)
    context.lineWidth = 0.7
    context.strokeStyle = `hsl(${hue - 7} ${43 * saturation}% 75% / 0.44)`
    context.stroke()

    const origin = project(center, perspective)
    const faceShading = context.createLinearGradient(
      origin.x - perspective.radius * 0.25, origin.y - perspective.radius * 0.37,
      origin.x + perspective.radius * 0.25, origin.y + perspective.radius * 0.37,
    )
    faceShading.addColorStop(0, `hsl(${hue - 6} ${48 * saturation}% ${light + 10}%)`)
    faceShading.addColorStop(1, `hsl(${hue + 5} ${59 * saturation}% ${Math.max(13, light - 6)}%)`)
    context.fillStyle = faceShading
    drawPolygon(context, corners.map((corner) => ({
      x: corner.x * 0.935 + origin.x * 0.065,
      y: corner.y * 0.935 + origin.y * 0.065,
    })))

    if (normal[2] > 0.24) drawLabel(context, dieLabel(die, index + 1), face, pose.rotation, center, perspective, material)
  }
}

export function drawDice(
  context: CanvasRenderingContext2D,
  layout: DiceLayout,
  dice: readonly DiceSceneDie[],
  poses: readonly DiePose[],
  skin: DiceSkin,
  keptIndex?: number,
) {
  const { width, height, columns, cell } = layout
  const rows = Math.ceil(dice.length / columns)
  const top = (height - rows * cell) / 2
  context.clearRect(0, 0, width, height)
  dice.forEach((die, index) => {
    const row = Math.floor(index / columns)
    const columnsInRow = Math.min(columns, dice.length - row * columns)
    drawDie(context, die, poses[index], {
      centerX: (width - columnsInRow * cell) / 2 + (index % columns + 0.5) * cell,
      centerY: top + (row + 0.58) * cell,
      radius: cell * 0.34,
    }, skin, keptIndex === index)
  })
}
