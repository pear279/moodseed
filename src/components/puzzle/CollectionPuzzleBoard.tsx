import { useRef } from 'react'
import { getTemplate } from '../../engine/puzzle/template'
import { BOARD_SIZE } from '../../engine/puzzle/geometry'
import type { PuzzleTheme } from '../../types/puzzle'

let boardIdCounter = 0

interface Props {
  theme: PuzzleTheme
  /** 已解锁拼块 id 集合（0..35）；未解锁显示米白半透明占位，不透露原图 */
  unlockedIds: ReadonlySet<number>
  className?: string
  /** 是否播放解锁 reveal 动画（默认开启） */
  reveal?: boolean
}

/**
 * 收集模式拼图板：6×6 共 36 块，固定在正确位置、不可拖动。
 * 已解锁块用 SVG ClipPath 显示原图对应区域；未解锁块显示米白半透明占位。
 * 只保留一张完整原图，不提前切 36 张图。
 */
export function CollectionPuzzleBoard({ theme, unlockedIds, className, reveal = true }: Props) {
  const idRef = useRef('')
  if (idRef.current === '') idRef.current = `pz-collection-${++boardIdCounter}`
  const prefix = idRef.current

  const pieces = getTemplate()

  return (
    <svg
      viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
      className={className}
      role="img"
      aria-label={`${theme.name}拼图`}
    >
      <defs>
        {pieces.map((p) => (
          <clipPath key={p.id} id={`${prefix}-clip-${p.id}`}>
            <path d={p.path} />
          </clipPath>
        ))}
      </defs>

      <g>
        {pieces.map((p) => {
          const unlocked = unlockedIds.has(p.id)
          return (
            <g
              key={p.id}
              transform={`translate(${p.correctX} ${p.correctY})`}
              className={reveal && unlocked ? 'piece-reveal' : undefined}
              style={reveal && unlocked ? { animationDelay: `${p.id * 12}ms` } : undefined}
            >
              {unlocked ? (
                <>
                  <image
                    href={theme.imageUrl}
                    x={-p.correctX}
                    y={-p.correctY}
                    width={BOARD_SIZE}
                    height={BOARD_SIZE}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#${prefix}-clip-${p.id})`}
                  />
                  <path d={p.path} fill="none" stroke="rgba(46,58,46,0.08)" strokeWidth={1} />
                </>
              ) : (
                <path
                  d={p.path}
                  fill="rgba(248,245,237,0.65)"
                  stroke="rgba(90,90,90,0.12)"
                  strokeWidth={1}
                />
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
