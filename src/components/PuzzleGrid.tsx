import { REWARDS } from '../lib/constants'

interface Props {
  image: string
  positions: number[]
  cols?: number
  rows?: number
}

function cellBackground(image: string, index: number, cols: number, rows: number) {
  const col = index % cols
  const row = Math.floor(index / cols)
  return {
    backgroundImage: `url(${image})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${(col * 100) / (cols - 1)}% ${(row * 100) / (rows - 1)}%`,
  }
}

function PuzzleCell({
  image,
  index,
  cols,
  rows,
  unlocked,
}: {
  image: string
  index: number
  cols: number
  rows: number
  unlocked: boolean
}) {
  const bg = cellBackground(image, index, cols, rows)
  const rot = (index * 37) % 360
  const offX = (index * 53) % 45
  const offY = (index * 29) % 45

  return (
    <div className="relative overflow-hidden">
      {/* 完整彩色层（恢复后） */}
      <div className="absolute inset-0" style={bg} />

      {/* 破败层：灰度 + 蜘蛛网 + 暗色，解锁后淡出 */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          unlocked ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div
          className="absolute inset-0"
          style={{ ...bg, filter: 'grayscale(1) brightness(0.6) contrast(0.85)' }}
        />
        <div className="absolute inset-0 bg-ink/25" />
        <img
          src="/assets/spiderweb.svg"
          alt=""
          className="absolute opacity-70"
          style={{
            width: '68%',
            height: '68%',
            left: `${offX}%`,
            top: `${offY}%`,
            transform: `rotate(${rot}deg)`,
          }}
        />
      </div>

      {/* 解锁后的柔和光感 */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          unlocked ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ boxShadow: 'inset 0 0 12px rgba(201, 227, 184, 0.5)' }}
      />
    </div>
  )
}

export function PuzzleGrid({ image, positions, cols = REWARDS.gridCols, rows = REWARDS.gridRows }: Props) {
  const cells = Array.from({ length: cols * rows }, (_, i) => i)
  return (
    <div
      className="grid gap-px overflow-hidden rounded-2xl bg-ink/10"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, aspectRatio: `${cols} / ${rows}` }}
    >
      {cells.map((i) => (
        <PuzzleCell key={i} image={image} index={i} cols={cols} rows={rows} unlocked={positions.includes(i)} />
      ))}
    </div>
  )
}
