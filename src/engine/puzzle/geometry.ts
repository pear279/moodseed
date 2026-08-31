// 拼图几何常量：逻辑坐标 1200×1200，固定 6×6

export const BOARD_SIZE = 1200
export const COLS = 6
export const ROWS = 6
export const PIECES = COLS * ROWS // 36
export const CELL = BOARD_SIZE / COLS // 200

/** 自由拼图画布：矩形（底图占满宽度，上下留散落带） */
export const CANVAS_WIDTH = 1300
export const CANVAS_HEIGHT = 2400
/** 板面（底图）在画布中的水平偏移（居中，约 15px 屏幕边距） */
export const CANVAS_OFFSET_X = (CANVAS_WIDTH - BOARD_SIZE) / 2 // 50
/** 板面（底图）在画布中的垂直偏移（上下散落带） */
export const CANVAS_OFFSET_Y = (CANVAS_HEIGHT - BOARD_SIZE) / 2 // 600
/** Snap 吸附阈值（逻辑坐标） */
export const SNAP_THRESHOLD = CELL * 0.15

/** 一维 id（0..35，行优先） */
export function pieceId(row: number, col: number): number {
  return row * COLS + col
}

/** 该列在完整图中的理论 X 坐标（左上角） */
export function correctX(col: number): number {
  return col * CELL
}

/** 该行在完整图中的理论 Y 坐标（左上角） */
export function correctY(row: number): number {
  return row * CELL
}

export interface Pt {
  x: number
  y: number
}
