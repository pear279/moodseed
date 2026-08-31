import { PIECES } from './geometry'
import type { PuzzleGame } from '../../types/puzzle'

/** 合并两个 Group（保留 groupAId，zIndex 取较大者，纯函数） */
export function mergeGroups(game: PuzzleGame, groupAId: string, groupBId: string): PuzzleGame {
  const a = game.groups.find((g) => g.id === groupAId)
  const b = game.groups.find((g) => g.id === groupBId)
  if (!a || !b || a.id === b.id) return game

  const mergedId = a.id
  const pieceIds = [...a.pieceIds, ...b.pieceIds]
  const zIndex = Math.max(a.zIndex, b.zIndex)
  const groups = game.groups
    .filter((g) => g.id !== groupAId && g.id !== groupBId)
    .concat([{ id: mergedId, pieceIds, zIndex }])
  const pieces = game.pieces.map((p) =>
    p.groupId === groupAId || p.groupId === groupBId ? { ...p, groupId: mergedId } : p,
  )
  return { ...game, groups, pieces, updatedAt: Date.now() }
}

/** 完成判定：全部 36 块组成单个 Group */
export function isPuzzleComplete(game: PuzzleGame): boolean {
  return game.groups.length === 1 && game.groups[0].pieceIds.length === PIECES
}
