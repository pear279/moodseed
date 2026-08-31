import { describe, expect, it } from 'vitest'
import { initializeGame, organizeLoosePieces, resetGame } from '../../src/engine/puzzle/game'
import { mergeGroups } from '../../src/engine/puzzle/groups'
import { finalizeIfComplete } from '../../src/engine/puzzle/completion'
import { mulberry32 } from '../../src/engine/puzzle/random'
import { PIECES } from '../../src/engine/puzzle/geometry'

describe('完成 / 整理 / 重新打乱（Phase 8）', () => {
  it('finalizeIfComplete：未完成保持 playing', () => {
    const game = initializeGame('cactus_boundary', mulberry32(1))
    expect(finalizeIfComplete(game).status).toBe('playing')
  })

  it('finalizeIfComplete：单 Group 36 块置为 completed（幂等）', () => {
    let g = initializeGame('cactus_boundary', mulberry32(1))
    for (let i = 1; i < PIECES; i++) g = mergeGroups(g, 'g0', `g${i}`)
    const done = finalizeIfComplete(g)
    expect(done.status).toBe('completed')
    expect(finalizeIfComplete(done).status).toBe('completed')
  })

  it('整理碎片：已连接 Group 不动，单片重新排列', () => {
    const g0 = initializeGame('cactus_boundary', mulberry32(1))
    const g = mergeGroups(g0, 'g0', 'g1') // 0+1 连成 Group
    const before = new Map(g.pieces.map((p) => [p.id, { x: p.x, y: p.y }]))
    const org = organizeLoosePieces(g, mulberry32(9))

    // 0、1 不动
    expect(org.pieces.find((p) => p.id === 0)).toMatchObject(before.get(0)!)
    expect(org.pieces.find((p) => p.id === 1)).toMatchObject(before.get(1)!)

    // 有单片被移动
    let changed = 0
    for (const p of org.pieces) {
      const b = before.get(p.id)!
      if (p.x !== b.x || p.y !== b.y) changed++
    }
    expect(changed).toBeGreaterThan(0)

    // Group 数量不变（连接关系未变）
    expect(org.groups).toHaveLength(g.groups.length)
  })

  it('重新打乱：36 个单片 Group、status playing', () => {
    let g = initializeGame('cactus_boundary', mulberry32(1))
    for (let i = 1; i < 10; i++) g = mergeGroups(g, 'g0', `g${i}`)
    const r = resetGame('cactus_boundary', mulberry32(7))
    expect(r.groups).toHaveLength(PIECES)
    expect(r.status).toBe('playing')
    for (const grp of r.groups) expect(grp.pieceIds).toHaveLength(1)
  })
})
