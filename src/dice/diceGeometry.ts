export type DiceSides = 4 | 6 | 8 | 10 | 12 | 20
export type Vec3 = readonly [number, number, number]
export type Rotation = readonly [number, number, number, number]

interface Plane {
  indices: readonly number[]
  normal: Vec3
}

export interface DieFace extends Plane {
  center: Vec3
  right: Vec3
  up: Vec3
  labelSize: number
}

interface DieMesh {
  vertices: readonly Vec3[]
  faces: readonly DieFace[]
}

const tolerance = 0.00001
const signs = [-1, 1]

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

export function scale([x, y, z]: Vec3, factor: number): Vec3 {
  return [x * factor, y * factor, z * factor]
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return add(a, scale(b, -1))
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function length(vector: Vec3): number {
  return Math.hypot(...vector)
}

export function normalize(vector: Vec3): Vec3 {
  return scale(vector, 1 / length(vector))
}

function centroid(points: readonly Vec3[]): Vec3 {
  return scale(points.reduce(add, [0, 0, 0]), 1 / points.length)
}

function orderPlane(vertices: readonly Vec3[], indices: readonly number[], normal: Vec3): number[] {
  const center = centroid(indices.map((index) => vertices[index]))
  const right = normalize(subtract(vertices[indices[0]], center))
  const up = cross(normal, right)
  const angles = indices.map((index) => {
    const position = subtract(vertices[index], center)
    return { index, angle: Math.atan2(dot(position, up), dot(position, right)) }
  })
  return angles.sort((a, b) => a.angle - b.angle).map(({ index }) => index)
}

// Each supporting plane of the hull is one face, including squares, kites, and pentagons.
function hullPlanes(vertices: readonly Vec3[]): Plane[] {
  const planes = new Map<string, Plane>()
  for (let a = 0; a < vertices.length - 2; a += 1) {
    for (let b = a + 1; b < vertices.length - 1; b += 1) {
      for (let c = b + 1; c < vertices.length; c += 1) {
        const triangleNormal = cross(subtract(vertices[b], vertices[a]), subtract(vertices[c], vertices[a]))
        if (length(triangleNormal) < tolerance) continue
        const normalized = normalize(triangleNormal)
        const normal = dot(normalized, vertices[a]) > 0 ? normalized : scale(normalized, -1)
        const distances = vertices.map((vertex) => dot(normal, vertex) - dot(normal, vertices[a]))
        if (distances.some((distance) => distance > tolerance)) continue

        const indices = distances.flatMap((distance, index) => Math.abs(distance) < tolerance ? [index] : [])
        const key = indices.join(',')
        if (!planes.has(key)) planes.set(key, { indices: orderPlane(vertices, indices, normal), normal })
      }
    }
  }
  return [...planes.values()]
}

function numberFaces(faces: readonly DieFace[]): DieFace[] {
  const remaining = [...faces]
  const low: DieFace[] = []
  const high: DieFace[] = []
  while (remaining.length > 0) {
    const [face] = remaining.splice(0, 1)
    low.push(face)
    const opposite = remaining.findIndex((other) => dot(face.normal, other.normal) < -1 + tolerance)
    if (opposite !== -1) high.push(...remaining.splice(opposite, 1))
  }
  return [...low, ...high.reverse()]
}

function makeMesh(rawVertices: readonly Vec3[]): DieMesh {
  const radius = Math.max(...rawVertices.map(length))
  const vertices = rawVertices.map((vertex) => scale(vertex, 1 / radius))
  const faces = hullPlanes(vertices).map((plane): DieFace => {
    const corners = plane.indices.map((index) => vertices[index])
    const center = centroid(corners)
    const right = normalize(subtract(corners[1], corners[0]))
    const up = cross(plane.normal, right)
    const edgeDistances = corners.map((corner, index) => {
      const edge = normalize(subtract(corners[(index + 1) % corners.length], corner))
      return length(cross(edge, subtract(center, corner)))
    })
    return { ...plane, center, right, up, labelSize: Math.min(...edgeDistances) * 1.55 }
  })
  return { vertices, faces: numberFaces(faces) }
}

function dualVertices(vertices: readonly Vec3[]): Vec3[] {
  return hullPlanes(vertices).map(({ indices, normal }) => scale(normal, 1 / dot(normal, vertices[indices[0]])))
}

const cube = signs.flatMap((x) => signs.flatMap((y) => signs.map((z): Vec3 => [x, y, z])))
const icosahedron = signs.flatMap((a) => signs.flatMap((b): Vec3[] => {
  const long = b * (1 + Math.sqrt(5)) / 2
  return [[0, a, long], [long, 0, a], [a, long, 0]]
}))

const antiprismHeight = Math.sqrt((2 * Math.sin(Math.PI / 5)) ** 2 - (2 * Math.sin(Math.PI / 10)) ** 2) / 2
const pentagonalAntiprism = signs.flatMap((direction) => Array.from({ length: 5 }, (_, index): Vec3 => {
  const angle = (index + (direction > 0 ? 0.5 : 0)) * 2 * Math.PI / 5
  return [Math.cos(angle), direction * antiprismHeight, Math.sin(angle)]
}))

export const dieMeshes: Record<DiceSides, DieMesh> = {
  4: makeMesh(cube.filter(([x, y, z]) => x * y * z > 0)),
  6: makeMesh(cube),
  8: makeMesh(signs.flatMap((s): Vec3[] => [[s, 0, 0], [0, s, 0], [0, 0, s]])),
  10: makeMesh(dualVertices(pentagonalAntiprism)),
  12: makeMesh(dualVertices(icosahedron)),
  20: makeMesh(icosahedron),
}

export function axisRotation(axis: Vec3, angle: number): Rotation {
  const [x, y, z] = scale(axis, Math.sin(angle / 2))
  return [x, y, z, Math.cos(angle / 2)]
}

export function combineRotation(a: Rotation, b: Rotation): Rotation {
  const av: Vec3 = [a[0], a[1], a[2]]
  const bv: Vec3 = [b[0], b[1], b[2]]
  const [x, y, z] = add(add(scale(av, b[3]), scale(bv, a[3])), cross(av, bv))
  return [x, y, z, a[3] * b[3] - dot(av, bv)]
}

export function rotate([x, y, z, w]: Rotation, point: Vec3): Vec3 {
  const axis: Vec3 = [x, y, z]
  const intermediate = scale(cross(axis, point), 2)
  return add(point, add(scale(intermediate, w), cross(axis, intermediate)))
}

export function interpolateRotation(from: Rotation, to: Rotation, proportion: number): Rotation {
  const similarity = from.reduce((sum, component, index) => sum + component * to[index], 0)
  const direction = similarity < 0 ? -1 : 1
  const angle = Math.acos(Math.min(Math.abs(similarity), 1))
  const sine = Math.sin(angle)
  const fromWeight = sine > tolerance ? Math.sin((1 - proportion) * angle) / sine : 1 - proportion
  const toWeight = direction * (sine > tolerance ? Math.sin(proportion * angle) / sine : proportion)
  const [x, y, z, w] = from.map((component, index) => fromWeight * component + toWeight * to[index])
  const size = Math.hypot(x, y, z, w)
  return [x / size, y / size, z / size, w / size]
}

export function presentFace(face: DieFace, sides: DiceSides, index: number): Rotation {
  const horizontalTilt = (index % 2 === 0 ? 1 : -1) * (sides === 4 ? 0.12 : 0.21)
  const verticalTilt = sides === 4 ? 0.55 : 0.23 + (index % 3) * 0.04
  const outward = normalize([horizontalTilt, verticalTilt, 1])
  const viewerRight = normalize(cross([0, 1, 0], outward))
  const angle = Math.acos(Math.min(1, Math.max(-1, dot(face.normal, outward))))
  const turned = axisRotation(normalize(cross(face.normal, outward)), angle)
  const faceRight = rotate(turned, face.right)
  const twist = Math.atan2(dot(cross(faceRight, viewerRight), outward), dot(faceRight, viewerRight))
  return combineRotation(axisRotation(outward, twist), turned)
}
