/**
 * Draws the shareable progress card onto a canvas.
 * Only public details are used: nickname, camp name, stamps and the completion count.
 * Lesson titles, links and notes are never drawn.
 */
import { progressLabel, type Passport } from '@/lib/passport'
import { SHAPE_PATHS, stampStyleFor } from '@/lib/stampArt'

export const CARD_CAPTION = 'One lesson closer ✨'
const W = 1080
const H = 1350
const NAVY = '#1B2A4A'
const LAV = '#6A52CC'
const MAX_STAMPS = 30

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: (px: number) => string, start: number, min: number): number {
  let size = start
  ctx.font = font(size)
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 2
    ctx.font = font(size)
  }
  return size
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawNoise(ctx: CanvasRenderingContext2D) {
  // Deterministic speckle so the paper looks textured but the file stays small.
  let seed = 1337
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(110, 85, 50, ${0.03 + rand() * 0.05})`
    ctx.fillRect(rand() * W, rand() * H, 2, 2)
  }
}

function drawStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  number: number,
  id: string,
  filled: boolean,
) {
  const style = stampStyleFor(id)
  const k = size / 100
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(filled ? (style.rotation * Math.PI) / 180 : 0)
  ctx.translate(-size / 2, -size / 2)
  ctx.scale(k, k)
  const path = new Path2D(SHAPE_PATHS[style.shape])
  ctx.lineJoin = 'round'
  if (filled) {
    ctx.globalAlpha = 0.12
    ctx.fillStyle = style.color
    ctx.fill(path)
    ctx.globalAlpha = 1
    ctx.strokeStyle = style.color
    ctx.lineWidth = 3
    ctx.stroke(path)
  } else {
    ctx.globalAlpha = 0.3
    ctx.strokeStyle = NAVY
    ctx.lineWidth = 2
    ctx.setLineDash([5, 4])
    ctx.stroke(path)
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }
  ctx.beginPath()
  ctx.arc(50, 50, 33, 0, Math.PI * 2)
  ctx.globalAlpha = filled ? 0.85 : 0.14
  ctx.strokeStyle = filled ? style.color : NAVY
  ctx.lineWidth = 1.2
  ctx.setLineDash([1.5, 3])
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  ctx.textAlign = 'center'
  ctx.fillStyle = filled ? style.color : NAVY
  ctx.globalAlpha = filled ? 1 : 0.3
  ctx.font = '700 27px "Space Grotesk", sans-serif'
  ctx.fillText(String(number), 50, 60)
  ctx.font = '700 6.5px "Space Grotesk", sans-serif'
  ctx.globalAlpha = filled ? 1 : 0.35
  ctx.fillText('LESSON', 50, 33)
  ctx.restore()
}

export async function renderShareCard(passport: Passport): Promise<Blob> {
  await Promise.all([
    document.fonts.load('700 48px "Space Grotesk"'),
    document.fonts.load('500 32px "DM Sans"'),
  ]).catch(() => undefined)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available in this browser.')

  // Paper
  ctx.fillStyle = '#FAF3E3'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(150, 120, 20, 150, 120, 520)
  glow.addColorStop(0, 'rgba(185,168,240,0.38)')
  glow.addColorStop(1, 'rgba(185,168,240,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  drawNoise(ctx)

  // Dashed frame
  ctx.strokeStyle = 'rgba(27,42,74,0.3)'
  ctx.lineWidth = 4
  ctx.setLineDash([16, 12])
  roundRect(ctx, 44, 44, W - 88, H - 88, 44)
  ctx.stroke()
  ctx.setLineDash([])

  // Header pill
  ctx.font = '700 26px "Space Grotesk", sans-serif'
  const pill = 'CAMP PASSPORT'
  ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '4px'
  const pillW = ctx.measureText(pill).width + 56
  ctx.fillStyle = '#E9E3FB'
  roundRect(ctx, 100, 100, pillW, 58, 29)
  ctx.fill()
  ctx.fillStyle = LAV
  ctx.textAlign = 'left'
  ctx.fillText(pill, 128, 139)
  ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0px'

  // Identity
  const name = passport.nickname.trim() || 'Camp traveler'
  const camp = passport.campName.trim() || 'My camp'
  ctx.fillStyle = NAVY
  ctx.textAlign = 'left'
  fitText(ctx, name, W - 200, (px) => `700 ${px}px "Space Grotesk", sans-serif`, 92, 44)
  ctx.fillText(name, 100, 270)
  fitText(ctx, camp, W - 200, (px) => `500 ${px}px "DM Sans", sans-serif`, 40, 24)
  ctx.fillStyle = 'rgba(27,42,74,0.7)'
  ctx.fillText(camp, 100, 330)

  // Progress
  const total = passport.lessons.length
  const done = passport.lessons.filter((l) => l.completed).length
  ctx.fillStyle = NAVY
  ctx.font = '700 44px "Space Grotesk", sans-serif'
  ctx.fillText(progressLabel(done, total), 100, 430)
  roundRect(ctx, 100, 462, W - 200, 26, 13)
  ctx.fillStyle = 'rgba(242,232,207,0.9)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(27,42,74,0.18)'
  ctx.lineWidth = 2
  ctx.stroke()
  if (total > 0 && done > 0) {
    const grad = ctx.createLinearGradient(100, 0, W - 100, 0)
    grad.addColorStop(0, '#B9A8F0')
    grad.addColorStop(1, '#6A52CC')
    ctx.save()
    roundRect(ctx, 100, 462, W - 200, 26, 13)
    ctx.clip()
    ctx.fillStyle = grad
    ctx.fillRect(100, 462, ((W - 200) * done) / total, 26)
    ctx.restore()
  }

  // Stamp grid
  const shown = passport.lessons.slice(0, MAX_STAMPS)
  const hidden = passport.lessons.length - shown.length
  const areaTop = 540
  const areaBottom = H - 230
  const areaW = W - 200
  const areaH = areaBottom - areaTop
  const n = Math.max(shown.length, 1)
  let cols = 1
  let cell = 0
  for (let c = 1; c <= 10; c++) {
    const rows = Math.ceil(n / c)
    const s = Math.min(areaW / c, areaH / rows)
    if (s > cell) {
      cell = s
      cols = c
    }
  }
  cell = Math.min(cell, 250)
  const rows = Math.ceil(n / cols)
  const gridW = cols * cell
  const gridH = rows * cell
  const startX = 100 + (areaW - gridW) / 2
  const startY = areaTop + (areaH - gridH) / 2
  shown.forEach((lesson, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    drawStamp(ctx, startX + col * cell + cell / 2, startY + row * cell + cell / 2, cell * 0.82, i + 1, lesson.id, lesson.completed)
  })
  if (hidden > 0) {
    ctx.fillStyle = 'rgba(27,42,74,0.6)'
    ctx.font = '500 28px "DM Sans", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`+${hidden} more`, W - 100, areaBottom + 20)
    ctx.textAlign = 'left'
  }

  // Caption
  ctx.textAlign = 'center'
  ctx.fillStyle = NAVY
  ctx.font = '700 54px "Space Grotesk", sans-serif'
  ctx.fillText(CARD_CAPTION, W / 2, H - 130)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image.'))), 'image/png')
  })
}
