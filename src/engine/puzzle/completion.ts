import { isPuzzleComplete } from './groups'
import type { PuzzleGame } from '../../types/puzzle'

/** 检测并标记完成（幂等：只在 playing → completed 时生效，完成事件只触发一次） */
export function finalizeIfComplete(game: PuzzleGame): PuzzleGame {
  if (game.status === 'completed') return game
  if (isPuzzleComplete(game)) {
    return { ...game, status: 'completed', updatedAt: Date.now() }
  }
  return game
}
