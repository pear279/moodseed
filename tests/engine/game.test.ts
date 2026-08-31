import { describe, expect, it } from 'vitest'
import { bringToFront, initializeGame, moveGroup } from '../../src/engine/puzzle/game'
import { mergeGroups } from '../../src/engine/puzzle/groups'
import { getTemplate } from '../../src/engine/puzzle/template'
import { mulberry32 } from '../../src/engine/puzzle/random'
import { CANVAS_HEIGHT, CELL, PIECES } from '../../src/engine/puzzle/geometry'
import type { PuzzleGame } from '../../src/types/puzzle'

describe('自由拼图引擎（Phase 5）', () => {
  const game = initializeGame('cactus_boundary', mulberry32(12345))

  it('初始化：36 块、36 个单片 Group、状态 playing', () => {
    expect(game.themeId).toBe('cactus_boundary')
    expect(game.status).toBe('playing')
    expect(game.pieces).toHaveLength(PIECES)
    expect(game.groups).toHaveLength(PIECES)
    for (const g of game.groups) expect(g.pieceIds).toHaveLength(1)
    for (const p of game.pieces) {
      const g = game.groups.find((x) => x.id === p.groupId)
      expect(g).toBeDefined()
      expect(g!.pieceIds).toContain(p.id)
    }
  })

  it('moveGroup 只移动目标 Group 的块，其余不动', () => {
    const defs = getTemplate()
    const g: PuzzleGame = {
      themeId: 'cactus_boundary',
      status: 'playing',
      pieces: defs.map((d) => ({ id: d.id, x: 600, y: 800, groupId: `g${d.id}` })),
      groups: defs.map((d) => ({ id: `g${d.id}`, pieceIds: [d.id], zIndex: d.id })),
      updatedAt: 0,
    }
    const moved = moveGroup(g, 'g0', 30, -20)
    const p0 = moved.pieces.find((p) => p.id === 0)!
    expect(p0.x).toBe(630)
    expect(p0.y).toBe(780)

    const other = moved.pieces.find((p) => p.id === 1)!
    expect(other.x).toBe(600)
    expect(other.y).toBe(800)
  })

  it('bringToFront 将 Group 提升到最顶层', () => {
    const g = game.groups[5]
    const front = bringToFront(game, g.id)
    const z = front.groups.find((x) => x.id === g.id)!.zIndex
    const maxOther = Math.max(...front.groups.filter((x) => x.id !== g.id).map((x) => x.zIndex))
    expect(z).toBeGreaterThan(maxOther)
  })

  it('大 Group 拖动：整组一起移动，组外不动', () => {
    const defs = getTemplate()
    // 手动放在画布中央，避免边界约束干扰
    const game: PuzzleGame = {
      themeId: 'cactus_boundary',
      status: 'playing',
      pieces: defs.map((d) => ({
        id: d.id,
        x: 900 + (d.id % 3) * 30,
        y: 900 + (d.id % 4) * 30,
        groupId: `g${d.id}`,
      })),
      groups: defs.map((d) => ({ id: `g${d.id}`, pieceIds: [d.id], zIndex: d.id })),
      updatedAt: 0,
    }
    const g = mergeGroups(mergeGroups(game, 'g0', 'g1'), 'g0', 'g2')
    const moved = moveGroup(g, 'g0', 50, 50)
    for (const id of [0, 1, 2]) {
      const p = moved.pieces.find((x) => x.id === id)!
      const b = g.pieces.find((x) => x.id === id)!
      expect(p.x).toBe(b.x + 50)
      expect(p.y).toBe(b.y + 50)
    }
    const p3 = moved.pieces.find((x) => x.id === 3)!
    const b3 = g.pieces.find((x) => x.id === 3)!
    expect(p3.x).toBe(b3.x)
    expect(p3.y).toBe(b3.y)
  })

  it('moveGroup 边界约束：不拖出画布', () => {
    const g = game.groups[0]
    const moved = moveGroup(game, g.id, -999999, 999999)
    const p = moved.pieces.find((x) => x.id === g.pieceIds[0])!
    expect(p.x).toBeGreaterThanOrEqual(0)
    expect(p.y).toBeLessThanOrEqual(CANVAS_HEIGHT - CELL)
  })

  it('纯函数：不修改原状态', () => {
    const before = JSON.stringify(game)
    moveGroup(game, game.groups[0].id, 1, 1)
    bringToFront(game, game.groups[0].id)
    expect(JSON.stringify(game)).toBe(before)
  })
})
