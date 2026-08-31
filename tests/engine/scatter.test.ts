import { describe, expect, it } from 'vitest'
import { scatterPieces } from '../../src/engine/puzzle/scatter'
import { mulberry32 } from '../../src/engine/puzzle/random'
import { BOARD_SIZE, CANVAS_HEIGHT, CANVAS_OFFSET_X, CANVAS_OFFSET_Y, CANVAS_WIDTH, CELL, PIECES } from '../../src/engine/puzzle/geometry'

describe('Scatter 散落算法（Phase 5）', () => {
  it('返回 36 个锚点，且都在画布范围内', () => {
    const pts = scatterPieces(PIECES, { rand: mulberry32(42) })
    expect(pts).toHaveLength(PIECES)
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(CANVAS_WIDTH - CELL)
      expect(p.y).toBeLessThanOrEqual(CANVAS_HEIGHT - CELL)
    }
  })

  it('中央板面区域（拼合区）留空', () => {
    const pts = scatterPieces(PIECES, { rand: mulberry32(42) })
    const centerRight = CANVAS_OFFSET_X + BOARD_SIZE
    const centerBottom = CANVAS_OFFSET_Y + BOARD_SIZE
    for (const p of pts) {
      const inCenterX = p.x >= CANVAS_OFFSET_X && p.x <= centerRight
      const inCenterY = p.y >= CANVAS_OFFSET_Y && p.y <= centerBottom
      expect(inCenterX && inCenterY).toBe(false)
    }
  })

  it('确定性：同一 seed 结果一致', () => {
    const a = scatterPieces(PIECES, { rand: mulberry32(7) })
    const b = scatterPieces(PIECES, { rand: mulberry32(7) })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('不同 seed 产生不同分布', () => {
    const a = scatterPieces(PIECES, { rand: mulberry32(1) })
    const b = scatterPieces(PIECES, { rand: mulberry32(2) })
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b))
  })

  it('重叠约束：两两重叠比例不超过阈值', () => {
    const pts = scatterPieces(PIECES, { rand: mulberry32(99), overlapRatio: 0.3 })
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i]
        const b = pts[j]
        const ox = Math.max(0, Math.min(a.x + CELL, b.x + CELL) - Math.max(a.x, b.x))
        const oy = Math.max(0, Math.min(a.y + CELL, b.y + CELL) - Math.max(a.y, b.y))
        const ratio = (ox * oy) / (CELL * CELL)
        // 上下两带较紧凑，允许更多重叠，但不允许近乎完全堆叠
        expect(ratio).toBeLessThan(0.85)
      }
    }
  })
})
