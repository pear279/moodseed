import { beforeEach, describe, expect, it } from 'vitest'
import { LocalPuzzleStorage } from '../../src/storage/puzzleStorage'
import { initializeGame } from '../../src/engine/puzzle/game'
import { mulberry32 } from '../../src/engine/puzzle/random'

let store: Record<string, string>

beforeEach(() => {
  store = {}
  const mock = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v)
    },
    removeItem: (k: string) => {
      delete store[k]
    },
    clear: () => {
      store = {}
    },
    key: () => null,
    get length() {
      return Object.keys(store).length
    },
  }
  ;(globalThis as any).localStorage = mock
})

describe('LocalPuzzleStorage（Phase 8）', () => {
  it('save/load 往返一致', () => {
    const s = new LocalPuzzleStorage()
    const game = initializeGame('mushroom_calm', mulberry32(1))
    game.updatedAt = 123
    s.saveGame(game)
    expect(s.loadGame('mushroom_calm')).toEqual(game)
  })

  it('无存档返回 null', () => {
    expect(new LocalPuzzleStorage().loadGame('nope')).toBeNull()
  })

  it('removeGame 清除存档', () => {
    const s = new LocalPuzzleStorage()
    s.saveGame(initializeGame('cactus_boundary', mulberry32(1)))
    s.removeGame('cactus_boundary')
    expect(s.loadGame('cactus_boundary')).toBeNull()
  })

  it('损坏数据返回 null（不抛异常）', () => {
    const s = new LocalPuzzleStorage()
    s.saveGame(initializeGame('cactus_boundary', mulberry32(1)))
    store['moodseed_puzzle_game_v2_cactus_boundary'] = '{bad json'
    expect(s.loadGame('cactus_boundary')).toBeNull()
  })
})
