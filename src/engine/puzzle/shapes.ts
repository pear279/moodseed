import { CELL } from './geometry'
import type { Pt } from './geometry'

// 圆润凸榫 / 凹槽参数
export const KNOB_AMPLITUDE = CELL * 0.22 // 凸起幅度 ≈ 44
export const KNOB_SHOULDER = 0.18 // 两端平直肩部占比
export const SAMPLES = 24 // 每条弧线采样点数

/**
 * 凸榫轮廓：t ∈ [0,1]，返回归一化垂直偏移 0..1。
 * 两端为平直肩部（偏移 0），中段为平滑 cos 圆拱，端点斜率连续（C1）。
 */
export function knobOffset(t: number): number {
  if (t < KNOB_SHOULDER || t > 1 - KNOB_SHOULDER) return 0
  const u = (t - KNOB_SHOULDER) / (1 - 2 * KNOB_SHOULDER)
  return (1 - Math.cos(2 * Math.PI * u)) / 2
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * 水平边采样点（y 恒定，x 从 x0 到 x1）。
 * bulge：+1 圆拱凸向 +y（向下），-1 凸向 -y（向上），0 平直。
 */
export function horizontalEdgePoints(y: number, x0: number, x1: number, bulge: number): Pt[] {
  const amp = KNOB_AMPLITUDE * bulge
  const pts: Pt[] = [{ x: round(x0), y: round(y) }]
  for (let i = 1; i <= SAMPLES; i++) {
    const t = i / SAMPLES
    pts.push({ x: round(x0 + (x1 - x0) * t), y: round(y + knobOffset(t) * amp) })
  }
  return pts
}

/**
 * 垂直边采样点（x 恒定，y 从 y0 到 y1）。
 * bulge：+1 圆拱凸向 +x（向右），-1 凸向 -x（向左），0 平直。
 */
export function verticalEdgePoints(x: number, y0: number, y1: number, bulge: number): Pt[] {
  const amp = KNOB_AMPLITUDE * bulge
  const pts: Pt[] = [{ x: round(x), y: round(y0) }]
  for (let i = 1; i <= SAMPLES; i++) {
    const t = i / SAMPLES
    pts.push({ x: round(x + knobOffset(t) * amp), y: round(y0 + (y1 - y0) * t) })
  }
  return pts
}

/** 点序列 → SVG path（M/L + Z 闭合） */
export function pointsToPath(pts: Pt[]): string {
  let d = ''
  for (let i = 0; i < pts.length; i++) {
    d += `${i === 0 ? 'M' : 'L'} ${pts[i].x} ${pts[i].y}`
  }
  return d + ' Z'
}
