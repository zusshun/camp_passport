/** Shared stamp look: used by the SVG stamps in the UI and the canvas share card. */

export type StampShape = 'scallop' | 'hex' | 'squircle' | 'burst'

export const STAMP_COLORS = [
  '#E5654B', // coral
  '#1E9E9A', // teal
  '#EE9F23', // amber
  '#7B5BD6', // violet
  '#3FA56F', // green
  '#DC5A98', // pink
  '#3E7BDA', // blue
] as const

const SHAPES: StampShape[] = ['scallop', 'hex', 'squircle', 'burst']

function polar(points: number, radius: (t: number, i: number) => number): string {
  let d = ''
  for (let i = 0; i < points; i++) {
    const t = (2 * Math.PI * i) / points - Math.PI / 2
    const r = radius(t, i)
    const x = 50 + r * Math.cos(t)
    const y = 50 + r * Math.sin(t)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return `${d}Z`
}

/** SVG path data in a 100 x 100 box. Works as a Path2D in canvas too. */
export const SHAPE_PATHS: Record<StampShape, string> = {
  scallop: polar(180, (t) => 44 + 2.6 * Math.cos(18 * t)),
  hex: polar(6, () => 46),
  squircle: polar(120, (t) => 45 / Math.pow(Math.pow(Math.abs(Math.cos(t)), 4) + Math.pow(Math.abs(Math.sin(t)), 4), 0.25)),
  burst: polar(24, (_t, i) => (i % 2 === 0 ? 47 : 41)),
}

export interface StampStyle {
  color: string
  shape: StampShape
  rotation: number
}

function hash(value: string): number {
  let h = 5381
  for (let i = 0; i < value.length; i++) h = ((h << 5) + h + value.charCodeAt(i)) >>> 0
  return h
}

/** Deterministic per-lesson look, so a stamp keeps its style when lessons are reordered. */
export function stampStyleFor(id: string): StampStyle {
  const h = hash(id)
  return {
    color: STAMP_COLORS[h % STAMP_COLORS.length],
    shape: SHAPES[(h >>> 3) % SHAPES.length],
    rotation: ((h >>> 6) % 15) - 7,
  }
}
