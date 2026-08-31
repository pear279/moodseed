import { CELL, COLS, ROWS, correctX, correctY, pieceId } from './geometry'
import type { Pt } from './geometry'
import { horizontalEdgePoints, pointsToPath, verticalEdgePoints } from './shapes'
import { hashSeed, mulberry32 } from './random'
import { computeNeighbors } from './neighbors'
import type { PieceEdges, PuzzlePieceDef } from '../../types/puzzle'

const TEMPLATE_SEED = hashSeed('moodseed-36-piece-template')

function generateTemplate(): PuzzlePieceDef[] {
  const rand = mulberry32(TEMPLATE_SEED)

  // 内部边界凸起方向：+1 / -1（确定性，固定后不每次重随机）
  // vBulge[r][c]：第 r 行、列 c 与 c+1 之间的竖直边界（r 0..5, c 0..4）
  const vBulge: number[][] = []
  for (let r = 0; r < ROWS; r++) {
    const row: number[] = []
    for (let c = 0; c < COLS - 1; c++) row.push(rand() < 0.5 ? 1 : -1)
    vBulge.push(row)
  }
  // hBulge[r][c]：列 c、行 r 与 r+1 之间的水平边界（r 0..4, c 0..5）
  const hBulge: number[][] = []
  for (let r = 0; r < ROWS - 1; r++) {
    const row: number[] = []
    for (let c = 0; c < COLS; c++) row.push(rand() < 0.5 ? 1 : -1)
    hBulge.push(row)
  }

  const pieces: PuzzlePieceDef[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // 局部坐标：以该块自身左上角为原点（0..CELL，凸榫可延伸到 ±AMP）。
      // 拼块在完整图中的位置由 correctX/correctY 表达，渲染时用 translate(x,y)。
      const x0 = 0
      const x1 = CELL
      const y0 = 0
      const y1 = CELL

      // 顶边（左 → 右）
      const top: Pt[] =
        r === 0
          ? [{ x: x0, y: y0 }, { x: x1, y: y0 }]
          : horizontalEdgePoints(y0, x0, x1, hBulge[r - 1][c])
      // 右边（上 → 下）
      const right: Pt[] =
        c === COLS - 1
          ? [{ x: x1, y: y0 }, { x: x1, y: y1 }]
          : verticalEdgePoints(x1, y0, y1, vBulge[r][c])
      // 底边（右 → 左）
      const bottom: Pt[] =
        r === ROWS - 1
          ? [{ x: x1, y: y1 }, { x: x0, y: y1 }]
          : horizontalEdgePoints(y1, x0, x1, hBulge[r][c]).slice().reverse()
      // 左边（下 → 上）
      const left: Pt[] =
        c === 0
          ? [{ x: x0, y: y1 }, { x: x0, y: y0 }]
          : verticalEdgePoints(x0, y0, y1, vBulge[r][c - 1]).slice().reverse()

      const pts: Pt[] = [...top, ...right.slice(1), ...bottom.slice(1), ...left.slice(1)]

      const edges: PieceEdges = {
        top: r === 0 ? 'flat' : hBulge[r - 1][c] === 1 ? 'blank' : 'tab',
        bottom: r === ROWS - 1 ? 'flat' : hBulge[r][c] === 1 ? 'tab' : 'blank',
        left: c === 0 ? 'flat' : vBulge[r][c - 1] === 1 ? 'blank' : 'tab',
        right: c === COLS - 1 ? 'flat' : vBulge[r][c] === 1 ? 'tab' : 'blank',
      }

      pieces.push({
        id: pieceId(r, c),
        row: r,
        column: c,
        path: pointsToPath(pts),
        neighbors: computeNeighbors(r, c),
        correctX: correctX(c),
        correctY: correctY(r),
        edges,
      })
    }
  }
  return pieces
}

/** 36 块模板（固定，进程内只生成一次；更换主题仅替换 imageUrl） */
export const TEMPLATE: PuzzlePieceDef[] = generateTemplate()

export const PIECES_BY_ID: ReadonlyMap<number, PuzzlePieceDef> = new Map(
  TEMPLATE.map((p) => [p.id, p]),
)

export function getTemplate(): readonly PuzzlePieceDef[] {
  return TEMPLATE
}
