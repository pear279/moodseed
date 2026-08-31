import { COLS, ROWS, pieceId } from './geometry'
import type { Neighbors } from '../../types/puzzle'

/** 计算一块拼图上下左右邻接 id（边缘为 null） */
export function computeNeighbors(row: number, col: number): Neighbors {
  return {
    top: row > 0 ? pieceId(row - 1, col) : null,
    bottom: row < ROWS - 1 ? pieceId(row + 1, col) : null,
    left: col > 0 ? pieceId(row, col - 1) : null,
    right: col < COLS - 1 ? pieceId(row, col + 1) : null,
  }
}
