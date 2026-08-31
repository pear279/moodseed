import { useCallback, useEffect, useMemo, useState } from 'react'
import { getPuzzleThemeById } from '../../lib/content/puzzles'
import { bringToFront, initializeGame, moveGroup, organizeLoosePieces, resetGame } from '../../engine/puzzle/game'
import { snapOnDrop } from '../../engine/puzzle/snap'
import { finalizeIfComplete } from '../../engine/puzzle/completion'
import { SNAP_THRESHOLD } from '../../engine/puzzle/geometry'
import { hashSeed, mulberry32 } from '../../engine/puzzle/random'
import { puzzleStorage } from '../../storage/puzzleStorage'
import type { PuzzleGame, PuzzleTheme } from '../../types/puzzle'

function freshRand(themeId: string): () => number {
  return mulberry32(hashSeed(`puzzle-${themeId}-${Date.now()}-${Math.random()}`))
}

/** 自由拼图游戏状态：加载存档 / 拖动 / 吸附 / 整理 / 重新打乱 / 自动保存 */
export function usePuzzleGame(themeId: string) {
  const [theme] = useState<PuzzleTheme | undefined>(() => getPuzzleThemeById(themeId))
  const [game, setGame] = useState<PuzzleGame | null>(() => {
    if (!theme) return null
    return puzzleStorage.loadGame(themeId) ?? initializeGame(themeId, freshRand(themeId))
  })

  useEffect(() => {
    if (game) puzzleStorage.saveGame(game)
  }, [game])

  const move = useCallback((groupId: string, dx: number, dy: number) => {
    setGame((g) => (g ? moveGroup(g, groupId, dx, dy) : g))
  }, [])

  const front = useCallback((groupId: string) => {
    setGame((g) => (g ? bringToFront(g, groupId) : g))
  }, [])

  // 触摸屏用更大的吸附阈值（手指更难精确对齐）
  const snapThreshold = useMemo(() => {
    const coarse =
      typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
    return coarse ? SNAP_THRESHOLD * 1.4 : SNAP_THRESHOLD
  }, [])

  const drop = useCallback(
    (groupId: string) => {
      setGame((g) => {
        if (!g) return g
        return finalizeIfComplete(snapOnDrop(g, groupId, snapThreshold).game)
      })
    },
    [snapThreshold],
  )

  const organize = useCallback(() => {
    setGame((g) => (g ? organizeLoosePieces(g, freshRand(themeId)) : g))
  }, [themeId])

  const reset = useCallback(() => {
    setGame(resetGame(themeId, freshRand(themeId)))
  }, [themeId])

  return { theme, game, move, front, drop, organize, reset }
}
