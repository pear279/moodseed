import { getTemplate } from './template'
import { moveGroup } from './game'
import { mergeGroups } from './groups'
import type { PuzzleGame } from '../../types/puzzle'

export interface SnapCandidate {
  /** 被拖动、需要移动的 Group */
  groupId: string
  /** 静止、将要合并进来的 Group */
  otherGroupId: string
  /** 施加到 groupId 的位移，使其对齐到 otherGroupId */
  dx: number
  dy: number
  /** 对齐误差（越小越贴合，用于多候选择优） */
  error: number
}

/**
 * 基于「开放边」检测吸附候选：对 groupId 中每块的每个邻居，
 * 若邻居不在本 Group，比较「当前相对位移 vs 正确相对位移」，
 * 误差在阈值内即候选。错误邻块因不在 neighbors 中天然不会命中。
 */
export function findSnapCandidates(
  game: PuzzleGame,
  groupId: string,
  threshold: number,
): SnapCandidate[] {
  const defs = getTemplate()
  const defById = new Map(defs.map((d) => [d.id, d]))
  const group = game.groups.find((g) => g.id === groupId)
  if (!group) return []
  const members = new Set(group.pieceIds)
  const pieceById = new Map(game.pieces.map((p) => [p.id, p]))

  const candidates: SnapCandidate[] = []
  for (const pid of group.pieceIds) {
    const p = pieceById.get(pid)
    const def = defById.get(pid)
    if (!p || !def) continue
    const nids = [def.neighbors.top, def.neighbors.bottom, def.neighbors.left, def.neighbors.right]
    for (const nid of nids) {
      if (nid == null || members.has(nid)) continue
      const n = pieceById.get(nid)
      if (!n || n.groupId === groupId) continue
      const ndef = defById.get(nid)!
      const expectedDx = ndef.correctX - def.correctX
      const expectedDy = ndef.correctY - def.correctY
      const actualDx = n.x - p.x
      const actualDy = n.y - p.y
      const errX = expectedDx - actualDx
      const errY = expectedDy - actualDy
      if (Math.abs(errX) < threshold && Math.abs(errY) < threshold) {
        candidates.push({
          groupId,
          otherGroupId: n.groupId,
          dx: -errX,
          dy: -errY,
          error: Math.abs(errX) + Math.abs(errY),
        })
      }
    }
  }
  return candidates
}

/** 应用吸附：移动被拖动 Group 并对齐，然后合并两个 Group */
export function applySnap(game: PuzzleGame, cand: SnapCandidate): PuzzleGame {
  const moved = moveGroup(game, cand.groupId, cand.dx, cand.dy)
  return mergeGroups(moved, cand.groupId, cand.otherGroupId)
}

/** pointerup 时调用：寻找最佳候选并吸附合并 */
export function snapOnDrop(
  game: PuzzleGame,
  groupId: string,
  threshold: number,
): { game: PuzzleGame; snapped: boolean } {
  const candidates = findSnapCandidates(game, groupId, threshold)
  if (candidates.length === 0) return { game, snapped: false }
  const best = candidates.reduce((a, b) => (a.error <= b.error ? a : b))
  return { game: applySnap(game, best), snapped: true }
}
