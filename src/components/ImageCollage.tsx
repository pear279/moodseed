interface Props {
  images: string[]
  className?: string
}

function Cell({ url, extra, rounded = true }: { url: string; extra?: number; rounded?: boolean }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-ink/5 ${rounded ? 'rounded-lg' : ''}`}>
      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
      {extra != null && (
        <div className="absolute inset-0 grid place-items-center bg-ink/55 text-base font-semibold text-white">
          +{extra}
        </div>
      )}
    </div>
  )
}

/**
 * 手记多图拼贴（等比例裁切 object-cover，统一圆角间距，不拉伸）。
 * 规则：1 单图 / 2 左右并列 / 3 左大右二 / 4 二乘二 / 5~6 主图+小图（最多预览 5 张，多余 +N）。
 */
export function ImageCollage({ images, className = '' }: Props) {
  const n = images.length
  if (n === 0) return null

  if (n === 1) {
    return (
      <div className={`aspect-[4/3] ${className}`}>
        <Cell url={images[0]} />
      </div>
    )
  }

  if (n === 2) {
    return (
      <div className={`grid aspect-[4/3] grid-cols-2 gap-1 ${className}`}>
        <Cell url={images[0]} />
        <Cell url={images[1]} />
      </div>
    )
  }

  if (n === 3) {
    return (
      <div className={`grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-1 ${className}`}>
        <div className="row-span-2">
          <Cell url={images[0]} />
        </div>
        <Cell url={images[1]} />
        <Cell url={images[2]} />
      </div>
    )
  }

  if (n === 4) {
    return (
      <div className={`grid aspect-square grid-cols-2 grid-rows-2 gap-1 ${className}`}>
        <Cell url={images[0]} />
        <Cell url={images[1]} />
        <Cell url={images[2]} />
        <Cell url={images[3]} />
      </div>
    )
  }

  // 5~6 张：主图 + 2×2 小图；最多预览 5 张，多余 +N
  const extra = n - 5
  return (
    <div className={`grid aspect-[4/3] grid-cols-[1.45fr_1fr] gap-1 ${className}`}>
      <div className="h-full w-full">
        <Cell url={images[0]} />
      </div>
      <div className="grid grid-rows-2 gap-1">
        <div className="grid grid-cols-2 gap-1">
          <Cell url={images[1]} />
          <Cell url={images[2]} />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <Cell url={images[3]} />
          <Cell url={images[4]} extra={extra > 0 ? extra : undefined} />
        </div>
      </div>
    </div>
  )
}
