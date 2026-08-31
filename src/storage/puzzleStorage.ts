import type { PuzzleGame } from '../types/puzzle'

/** 自由拼图游戏状态存储层（Adapter：组件不直接碰 LocalStorage，未来可换数据库实现） */
export interface PuzzleStorage {
  loadGame(themeId: string): PuzzleGame | null
  saveGame(game: PuzzleGame): void
  removeGame(themeId: string): void
}

const KEY_PREFIX = 'moodseed_puzzle_game_'

export class LocalPuzzleStorage implements PuzzleStorage {
  private key(themeId: string): string {
    return `${KEY_PREFIX}${themeId}`
  }

  loadGame(themeId: string): PuzzleGame | null {
    try {
      const raw = localStorage.getItem(this.key(themeId))
      if (!raw) return null
      return JSON.parse(raw) as PuzzleGame
    } catch {
      return null
    }
  }

  saveGame(game: PuzzleGame): void {
    try {
      localStorage.setItem(this.key(game.themeId), JSON.stringify(game))
    } catch {
      /* 存储满/隐私模式等失败时静默，不影响游戏 */
    }
  }

  removeGame(themeId: string): void {
    try {
      localStorage.removeItem(this.key(themeId))
    } catch {
      /* ignore */
    }
  }
}

export const puzzleStorage: PuzzleStorage = new LocalPuzzleStorage()
