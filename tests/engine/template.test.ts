import { describe, expect, it } from 'vitest'
import { getTemplate, TEMPLATE } from '../../src/engine/puzzle/template'
import { BOARD_SIZE, CELL, COLS, PIECES, ROWS, pieceId } from '../../src/engine/puzzle/geometry'
import type { EdgeType } from '../../src/types/puzzle'

interface Pt {
  x: number
  y: number
}

/** 解析模板生成的 path（格式：M x y L x y ... Z，绝对坐标） */
function parsePath(d: string): Pt[] {
  const nums = d
    .replace(/[MLZ]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(Number)
  const pts: Pt[] = []
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] })
  return pts
}

/** Shoelace 多边形面积 */
function polygonArea(pts: Pt[]): number {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    s += a.x * b.y - b.x * a.y
  }
  return Math.abs(s) / 2
}

function inverse(e: EdgeType): EdgeType {
  return e === 'tab' ? 'blank' : e === 'blank' ? 'tab' : 'flat'
}

describe('拼图模板（Phase 1）', () => {
  it('固定 6×6 = 36 块，id 行优先 0..35', () => {
    expect(TEMPLATE).toHaveLength(PIECES)
    expect(TEMPLATE[0].id).toBe(0)
    expect(TEMPLATE[PIECES - 1].id).toBe(PIECES - 1)
    for (const p of TEMPLATE) {
      expect(p.id).toBe(pieceId(p.row, p.column))
      expect(p.row).toBeGreaterThanOrEqual(0)
      expect(p.row).toBeLessThan(ROWS)
      expect(p.column).toBeGreaterThanOrEqual(0)
      expect(p.column).toBeLessThan(COLS)
    }
  })

  it('每块 correctX/correctY 与行列一致', () => {
    for (const p of TEMPLATE) {
      expect(p.correctX).toBe(p.column * CELL)
      expect(p.correctY).toBe(p.row * CELL)
    }
  })

  it('外框四边平直', () => {
    for (const p of TEMPLATE) {
      if (p.row === 0) expect(p.edges.top).toBe('flat')
      if (p.row === ROWS - 1) expect(p.edges.bottom).toBe('flat')
      if (p.column === 0) expect(p.edges.left).toBe('flat')
      if (p.column === COLS - 1) expect(p.edges.right).toBe('flat')
    }
  })

  it('内部邻边严格互补（tab↔blank）', () => {
    const byId = new Map(TEMPLATE.map((p) => [p.id, p]))
    for (const p of TEMPLATE) {
      const right = p.neighbors.right != null ? byId.get(p.neighbors.right) : undefined
      if (right) expect(p.edges.right).toBe(inverse(right.edges.left))
      const bottom = p.neighbors.bottom != null ? byId.get(p.neighbors.bottom) : undefined
      if (bottom) expect(p.edges.bottom).toBe(inverse(bottom.edges.top))
    }
  })

  it('neighbors 边界正确（null 与相邻 id）', () => {
    const byId = new Map(TEMPLATE.map((p) => [p.id, p]))
    const mid = byId.get(pieceId(2, 3))!
    expect(mid.neighbors).toEqual({
      top: pieceId(1, 3),
      bottom: pieceId(3, 3),
      left: pieceId(2, 2),
      right: pieceId(2, 4),
    })
    const corner = byId.get(pieceId(0, 0))!
    expect(corner.neighbors).toEqual({
      top: null,
      bottom: pieceId(1, 0),
      left: null,
      right: pieceId(0, 1),
    })
  })

  it('36 块拼合为完整 1:1 正方形（无裂缝/无重叠）', () => {
    let sum = 0
    for (const p of TEMPLATE) {
      // path 为局部坐标，平移到 correctX/correctY 后得到完整图中的绝对位置
      const abs = parsePath(p.path).map(({ x, y }) => ({ x: x + p.correctX, y: y + p.correctY }))
      sum += polygonArea(abs)
    }
    const expected = BOARD_SIZE * BOARD_SIZE // 1_440_000
    // 坐标保留 2 位小数带来的累计舍入误差 < 600
    expect(Math.abs(sum - expected)).toBeLessThan(600)
  })

  it('局部 path 位于自身格子 ±凸榫幅度范围内', () => {
    for (const p of TEMPLATE) {
      const pts = parsePath(p.path)
      const xs = pts.map((q) => q.x)
      const ys = pts.map((q) => q.y)
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(-CELL * 0.3)
      expect(Math.max(...xs)).toBeLessThanOrEqual(CELL * 1.3)
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(-CELL * 0.3)
      expect(Math.max(...ys)).toBeLessThanOrEqual(CELL * 1.3)
    }
  })

  it('每块 path 闭合且首尾一致', () => {
    for (const p of TEMPLATE) {
      const pts = parsePath(p.path)
      expect(pts.length).toBeGreaterThan(3)
      expect(pts[0]).toEqual(pts[pts.length - 1])
    }
  })

  it('确定性：模板固定，重复获取结果一致', () => {
    expect(getTemplate()).toBe(TEMPLATE)
    expect(JSON.stringify(getTemplate()[0])).toBe(JSON.stringify(TEMPLATE[0]))
  })
})
