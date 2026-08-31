import { describe, expect, it } from 'vitest'
import { getTemplate } from '../../src/engine/puzzle/template'
import { CANVAS_OFFSET_X, CANVAS_OFFSET_Y, SNAP_THRESHOLD } from '../../src/engine/puzzle/geometry'
import { mergeGroups, isPuzzleComplete } from '../../src/engine/puzzle/groups'
import { snapOnDrop } from '../../src/engine/puzzle/snap'
import type { PuzzleGame, PuzzleGroup, PuzzlePiece } from '../../src/types/puzzle'

const defs = getTemplate()
const defById = new Map(defs.map((d) => [d.id, d]))

function correct(id: number) {
  const d = defById.get(id)!
  return { x: CANVAS_OFFSET_X + d.correctX, y: CANVAS_OFFSET_Y + d.correctY }
}

function makeGame(positions: Record<number, { x: number; y: number }>): PuzzleGame {
  const pieces: PuzzlePiece[] = defs.map((d) => ({
    id: d.id,
    x: positions[d.id]?.x ?? 0,
    y: positions[d.id]?.y ?? 0,
    groupId: `g${d.id}`,
  }))
  const groups: PuzzleGroup[] = defs.map((d) => ({ id: `g${d.id}`, pieceIds: [d.id], zIndex: d.id }))
  return { themeId: 'cactus_boundary', status: 'playing', pieces, groups, updatedAt: 0 }
}

describe('Snap + Group（Phase 6/7）', () => {
  it('正确邻块在阈值内 → 吸附并合并、精确对齐', () => {
    const c0 = correct(0)
    const c1 = correct(1)
    const game = makeGame({
      0: c0,
      1: { x: c1.x + 20, y: c1.y + 10 }, // 误差 20,10 在阈值内
    })
    const res = snapOnDrop(game, 'g0', SNAP_THRESHOLD)
    expect(res.snapped).toBe(true)
    const p0 = res.game.pieces.find((p) => p.id === 0)!
    const p1 = res.game.pieces.find((p) => p.id === 1)!
    expect(p1.x - p0.x).toBe(defById.get(1)!.correctX - defById.get(0)!.correctX)
    expect(p1.y - p0.y).toBe(defById.get(1)!.correctY - defById.get(0)!.correctY)
    expect(p0.groupId).toBe(p1.groupId)
    expect(res.game.groups).toHaveLength(35)
  })

  it('正确邻块但超出阈值 → 不吸附', () => {
    const c0 = correct(0)
    const c1 = correct(1)
    const game = makeGame({ 0: c0, 1: { x: c1.x + 60, y: c1.y } })
    const res = snapOnDrop(game, 'g0', SNAP_THRESHOLD)
    expect(res.snapped).toBe(false)
    expect(res.game.groups).toHaveLength(36)
  })

  it('多候选边：选择误差最小者吸附', () => {
    const c3 = correct(3)
    const c4 = correct(4)
    const c10 = correct(10)
    const game = makeGame({
      3: c3,
      4: c4,
      10: { x: c10.x + 25, y: c10.y }, // 底邻块误差 25（在阈值内，但比左邻块误差大）
    })
    const res = snapOnDrop(game, 'g4', SNAP_THRESHOLD)
    expect(res.snapped).toBe(true)
    const p4 = res.game.pieces.find((p) => p.id === 4)!
    const p3 = res.game.pieces.find((p) => p.id === 3)!
    const p10 = res.game.pieces.find((p) => p.id === 10)!
    expect(p4.groupId).toBe(p3.groupId) // 与误差更小的左邻块合并
    expect(p4.groupId).not.toBe(p10.groupId)
  })

  it('非邻块靠近 → 不吸附（错误拼块不吸附）', () => {
    const c0 = correct(0)
    // 7 是 0 的对角块，不是 0 的邻居
    const game = makeGame({ 0: c0, 7: { x: c0.x + 205, y: c0.y } })
    const res = snapOnDrop(game, 'g0', SNAP_THRESHOLD)
    expect(res.snapped).toBe(false)
  })

  it('mergeGroups 合并两块到同一 Group', () => {
    const game = makeGame({})
    const merged = mergeGroups(game, 'g0', 'g1')
    expect(merged.groups).toHaveLength(35)
    expect(merged.pieces.find((p) => p.id === 0)!.groupId).toBe(
      merged.pieces.find((p) => p.id === 1)!.groupId,
    )
  })

  it('isPuzzleComplete：单 Group 36 块才完成', () => {
    const game = makeGame({})
    expect(isPuzzleComplete(game)).toBe(false)
    const all = Array.from({ length: 36 }, (_, i) => i)
    const complete: PuzzleGame = {
      ...game,
      groups: [{ id: 'all', pieceIds: all, zIndex: 0 }],
      pieces: game.pieces.map((p) => ({ ...p, groupId: 'all' })),
    }
    expect(isPuzzleComplete(complete)).toBe(true)
  })

  it('35+1 最后合并 → 完成', () => {
    const game = makeGame({})
    let g = game
    for (let i = 1; i < 35; i++) g = mergeGroups(g, 'g0', `g${i}`)
    expect(isPuzzleComplete(g)).toBe(false)
    g = mergeGroups(g, 'g0', 'g35')
    expect(isPuzzleComplete(g)).toBe(true)
  })
})
