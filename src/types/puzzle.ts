// —— 拼图核心类型（与 UI / 引擎解耦） ——

export type EdgeType = 'flat' | 'tab' | 'blank'

/** 主题 id 复用项目 plant id（cactus_boundary / mushroom_calm / dandelion_release） */
export type ThemeId = string

export interface PuzzleTheme {
  id: ThemeId
  name: string
  imageUrl: string
  totalPieces: number
}

export interface Neighbors {
  top: number | null
  bottom: number | null
  left: number | null
  right: number | null
}

export interface PieceEdges {
  top: EdgeType
  bottom: EdgeType
  left: EdgeType
  right: EdgeType
}

/** 模板定义：一块拼图在完整图中的静态属性（不可变，进程内固定） */
export interface PuzzlePieceDef {
  /** 0..35（行优先），与后端 positions 下标一致 */
  id: number
  row: number
  column: number
  /** SVG path（局部坐标：以自身左上角为原点，凸榫可延伸到 ±AMP） */
  path: string
  neighbors: Neighbors
  correctX: number
  correctY: number
  edges: PieceEdges
}

/** 游戏运行时的一块拼图（轻量：路径/邻接从模板取，仅存位置与归属） */
export interface PuzzlePiece {
  id: number
  x: number
  y: number
  groupId: string
}

export interface PuzzleGroup {
  id: string
  pieceIds: number[]
  zIndex: number
}

export type PuzzleGameStatus = 'idle' | 'playing' | 'completed'

export interface PuzzleGame {
  themeId: ThemeId
  status: PuzzleGameStatus
  pieces: PuzzlePiece[]
  groups: PuzzleGroup[]
  updatedAt: number
}

/** 收藏进度（V1 由 D1 后端 /api/progress 提供，不落 LocalStorage） */
export interface PuzzleCollection {
  themeId: ThemeId
  unlockedPieces: number[]
  unlockedCount: number
  completed: boolean
}
