import { getTemplate } from './template'
import { scatterPieces } from './scatter'
import { CANVAS_HEIGHT, CANVAS_OFFSET_X, CANVAS_OFFSET_Y, CANVAS_WIDTH, CELL } from './geometry'
import type { PuzzleGame, PuzzleGroup, PuzzlePiece, PuzzlePieceDef } from '../../types/puzzle'

/** 初始化自由拼图：36 块各自成为 1-piece Group，散落到画布四周 */
export function initializeGame(themeId: string, rand: () => number): PuzzleGame {
  const defs = getTemplate()
  const positions = scatterPieces(defs.length, { rand })
  const groups: PuzzleGroup[] = []
  const pieces: PuzzlePiece[] = defs.map((d, i) => {
    const groupId = `g${d.id}`
    groups.push({ id: groupId, pieceIds: [d.id], zIndex: i })
    return { id: d.id, x: positions[i].x, y: positions[i].y, groupId }
  })
  return { themeId, status: 'playing', pieces, groups, updatedAt: Date.now() }
}

/** 移动某个 Group 的全部拼块（纯函数，返回新状态；锚点约束在画布内） */
export function moveGroup(game: PuzzleGame, groupId: string, dx: number, dy: number): PuzzleGame {
  const group = game.groups.find((g) => g.id === groupId)
  if (!group) return game
  const members = new Set(group.pieceIds)

  // 边界约束：Group 整体锚点保持在画布内
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of game.pieces) {
    if (!members.has(p.id)) continue
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  const cdx = Math.min(Math.max(dx, -minX), CANVAS_WIDTH - CELL - maxX)
  const cdy = Math.min(Math.max(dy, -minY), CANVAS_HEIGHT - CELL - maxY)

  const pieces = game.pieces.map((p) =>
    members.has(p.id) ? { ...p, x: p.x + cdx, y: p.y + cdy } : p,
  )
  return { ...game, pieces, updatedAt: Date.now() }
}

/** 把某个 Group 提升到最顶层（拖动选中时） */
export function bringToFront(game: PuzzleGame, groupId: string): PuzzleGame {
  const group = game.groups.find((g) => g.id === groupId)
  if (!group) return game
  const maxZ = game.groups.reduce((m, g) => Math.max(m, g.zIndex), 0)
  const groups = game.groups.map((g) => (g.id === groupId ? { ...g, zIndex: maxZ + 1 } : g))
  return { ...game, groups, updatedAt: Date.now() }
}

/** 拼块在自由画布中的「正确」锚点（用于 Snap / 完成居中） */
export function canvasCorrectPos(def: PuzzlePieceDef): { x: number; y: number } {
  return { x: CANVAS_OFFSET_X + def.correctX, y: CANVAS_OFFSET_Y + def.correctY }
}

/** 重新打乱：清空连接状态，36 块重新散落（收藏进度不受影响） */
export function resetGame(themeId: string, rand: () => number): PuzzleGame {
  return initializeGame(themeId, rand)
}

/** 整理碎片：已连接 Group 保持原位，仅把未连接单片重新排列到画布四周 */
export function organizeLoosePieces(game: PuzzleGame, rand: () => number): PuzzleGame {
  const looseIds: number[] = []
  for (const g of game.groups) {
    if (g.pieceIds.length === 1) looseIds.push(g.pieceIds[0])
  }
  if (looseIds.length === 0) return game

  const positions = scatterPieces(looseIds.length, { rand })
  const posById = new Map(looseIds.map((id, i) => [id, positions[i]]))
  const pieces = game.pieces.map((p) => {
    const pos = posById.get(p.id)
    return pos ? { ...p, x: pos.x, y: pos.y } : p
  })
  return { ...game, pieces, updatedAt: Date.now() }
}
