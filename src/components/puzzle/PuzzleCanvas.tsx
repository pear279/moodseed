import { useRef } from 'react'
import { getTemplate } from '../../engine/puzzle/template'
import { BOARD_SIZE, CANVAS_HEIGHT, CANVAS_OFFSET_X, CANVAS_OFFSET_Y, CANVAS_WIDTH } from '../../engine/puzzle/geometry'
import type { PuzzleGame, PuzzlePiece, PuzzleTheme } from '../../types/puzzle'

let canvasIdCounter = 0

interface Props {
  theme: PuzzleTheme
  game: PuzzleGame
  onMove: (groupId: string, dx: number, dy: number) => void
  onFront: (groupId: string) => void
  /** pointerup 时回调（Phase 6 起做 Snap 检测） */
  onDrop?: (groupId: string) => void
  /** 是否显示 5% 透明度底图提示 */
  showReference?: boolean
}

/**
 * 自由拼图画布：逻辑坐标 CANVAS_SIZE×CANVAS_SIZE，屏幕通过 scale 映射。
 * 拼块用 Pointer Events 拖动，touch-action:none 避免拖块时触发页面滚动。
 */
export function PuzzleCanvas({ theme, game, onMove, onFront, onDrop, showReference = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ groupId: string; x: number; y: number; scale: number } | null>(null)
  const idRef = useRef('')
  if (idRef.current === '') idRef.current = `pz-canvas-${++canvasIdCounter}`
  const prefix = idRef.current

  const template = getTemplate()
  const defById = new Map(template.map((p) => [p.id, p]))

  const getScale = () => {
    const svg = svgRef.current
    if (!svg) return 1
    return svg.getBoundingClientRect().width / CANVAS_WIDTH
  }

  const handleDown = (e: React.PointerEvent, piece: PuzzlePiece) => {
    e.preventDefault()
    ;(e.currentTarget as SVGGElement).setPointerCapture?.(e.pointerId)
    onFront(piece.groupId)
    dragRef.current = { groupId: piece.groupId, x: e.clientX, y: e.clientY, scale: getScale() }
  }

  const handleMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.x) / d.scale
    const dy = (e.clientY - d.y) / d.scale
    if (dx !== 0 || dy !== 0) onMove(d.groupId, dx, dy)
    d.x = e.clientX
    d.y = e.clientY
  }

  const handleUp = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    ;(e.currentTarget as SVGGElement).releasePointerCapture?.(e.pointerId)
    onDrop?.(d.groupId)
  }

  const zOf = (groupId: string) => game.groups.find((g) => g.id === groupId)?.zIndex ?? 0
  const ordered = [...game.pieces].sort((a, b) => zOf(a.groupId) - zOf(b.groupId))

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      className="block"
      style={{ width: '100%', aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`, touchAction: 'pan-x pan-y' }}
    >
      <defs>
        {template.map((p) => (
          <clipPath key={p.id} id={`${prefix}-clip-${p.id}`}>
            <path d={p.path} />
          </clipPath>
        ))}
      </defs>

      {/* 底图淡提示：5% 透明度，微微可见目标图（由「显示原图」按钮切换） */}
      {showReference && (
        <image
          href={theme.imageUrl}
          x={CANVAS_OFFSET_X}
          y={CANVAS_OFFSET_Y}
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          preserveAspectRatio="xMidYMid slice"
          opacity={0.05}
          className="pointer-events-none"
        />
      )}

      {/* 边界范围框：矩形界面，碎片散落与拖动的边界 */}
      <rect
        x={2}
        y={2}
        width={CANVAS_WIDTH - 4}
        height={CANVAS_HEIGHT - 4}
        fill="none"
        stroke="rgba(47, 93, 62, 0.3)"
        strokeWidth={3}
        className="pointer-events-none"
      />

      {ordered.map((piece) => {
        const def = defById.get(piece.id)!
        return (
          <g
            key={piece.id}
            transform={`translate(${piece.x} ${piece.y})`}
            onPointerDown={(e) => handleDown(e, piece)}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleUp}
            style={{
              touchAction: 'none',
              cursor: 'grab',
              filter: 'drop-shadow(0 1px 2px rgba(46,58,46,0.25))',
            }}
          >
            <image
              href={theme.imageUrl}
              x={-def.correctX}
              y={-def.correctY}
              width={BOARD_SIZE}
              height={BOARD_SIZE}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${prefix}-clip-${piece.id})`}
            />
            <path d={def.path} fill="none" stroke="rgba(46,58,46,0.3)" strokeWidth={2} />
          </g>
        )
      })}
    </svg>
  )
}
