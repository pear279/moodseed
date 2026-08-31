import { CANVAS_HEIGHT, CANVAS_OFFSET_Y, CANVAS_WIDTH, CELL } from './geometry'

export interface Pt {
  x: number
  y: number
}

export interface ScatterOptions {
  rand: () => number
  canvasWidth?: number
  canvasHeight?: number
  offsetY?: number
  cell?: number
  /** 允许的最大重叠比例（相对单片面积，0..1） */
  overlapRatio?: number
  maxRetries?: number
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

function overlapRatioOf(a: Box, b: Box): number {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
  return (ox * oy) / (a.w * a.h)
}

/**
 * 上下散落：把 count 块分布到画布顶部 / 底部两带，
 * 中间（板面区域，正方形）留空用于拼合。轮询分区避免连续编号聚集。
 * 返回按 id 顺序的锚点坐标（自由画布坐标系）。
 */
export function scatterPieces(count: number, opts: ScatterOptions): Pt[] {
  const rand = opts.rand
  const width = opts.canvasWidth ?? CANVAS_WIDTH
  const height = opts.canvasHeight ?? CANVAS_HEIGHT
  const offsetY = opts.offsetY ?? CANVAS_OFFSET_Y
  const cell = opts.cell ?? CELL
  const overlapRatio = opts.overlapRatio ?? 0.3
  const maxRetries = opts.maxRetries ?? 40

  const bottomY = height - offsetY
  // 顶部 / 底部两带（中间板面区域不放入）
  const bands = [
    { x0: 0, y0: 0, x1: width, y1: offsetY }, // top
    { x0: 0, y0: bottomY, x1: width, y1: height }, // bottom
  ]

  const placed: Pt[] = []
  const boxes: Box[] = []

  for (let k = 0; k < count; k++) {
    const band = bands[k % bands.length]
    let best: Pt | null = null
    let bestOverlap = Infinity
    for (let r = 0; r < maxRetries; r++) {
      const x = band.x0 + rand() * Math.max(0, band.x1 - band.x0 - cell)
      const y = band.y0 + rand() * Math.max(0, band.y1 - band.y0 - cell)
      const box: Box = { x, y, w: cell, h: cell }
      let max = 0
      for (const b of boxes) max = Math.max(max, overlapRatioOf(box, b))
      if (max <= overlapRatio) {
        best = { x, y }
        break
      }
      if (max < bestOverlap) {
        bestOverlap = max
        best = { x, y }
      }
    }
    const pt = best ?? { x: band.x0, y: band.y0 }
    placed.push(pt)
    boxes.push({ x: pt.x, y: pt.y, w: cell, h: cell })
  }

  return placed
}
