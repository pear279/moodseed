import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CollectionPuzzleBoard } from '../../src/components/puzzle/CollectionPuzzleBoard'
import { getPuzzleThemeById } from '../../src/lib/content/puzzles'

const theme = getPuzzleThemeById('cactus_boundary')!
const all = new Set(Array.from({ length: 36 }, (_, i) => i))

describe('CollectionPuzzleBoard（Phase 2/3）', () => {
  it('全解锁：渲染 36 个 clipPath 与 36 个 image，viewBox 1:1', () => {
    const html = renderToStaticMarkup(<CollectionPuzzleBoard theme={theme} unlockedIds={all} />)
    expect(html.match(/<clipPath\b/g)?.length).toBe(36)
    expect(html.match(/<image\b/g)?.length).toBe(36)
    expect(html).toContain('viewBox="0 0 1200 1200"')
  })

  it('全锁定：每块渲染 5% 透明度底图', () => {
    const html = renderToStaticMarkup(<CollectionPuzzleBoard theme={theme} unlockedIds={new Set()} />)
    expect(html.match(/<image\b/g)?.length).toBe(36)
    expect(html).toContain('opacity="0.05"')
    expect(html.match(/<clipPath\b/g)?.length).toBe(36)
  })

  it('部分解锁：每块都渲染底图（未解锁 5%、已解锁全彩）', () => {
    const partial = new Set([0, 5, 17])
    const html = renderToStaticMarkup(<CollectionPuzzleBoard theme={theme} unlockedIds={partial} />)
    expect(html.match(/<image\b/g)?.length).toBe(36)
    expect(html).toContain('opacity="0.05"')
  })

  it('image 引用对应 clipPath（clip-path url 引用存在）', () => {
    const html = renderToStaticMarkup(<CollectionPuzzleBoard theme={theme} unlockedIds={new Set([0])} />)
    expect(html).toContain('clip-path="url(#')
  })
})
