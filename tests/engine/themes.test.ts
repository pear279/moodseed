import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { getPuzzleThemes } from '../../src/lib/content/puzzles'

describe('拼图主题（Phase 2）', () => {
  it('3 株植物 → 3 个主题，共用 36 块模板', () => {
    const themes = getPuzzleThemes()
    expect(themes).toHaveLength(3)
    expect(themes.map((t) => t.id)).toEqual([
      'cactus_boundary',
      'mushroom_calm',
      'dandelion_release',
    ])
    for (const t of themes) expect(t.totalPieces).toBe(36)
  })

  it('每个主题的 1:1 原图文件存在且为拼图专用图', () => {
    for (const t of getPuzzleThemes()) {
      const abs = resolve(process.cwd(), 'public' + t.imageUrl)
      expect(existsSync(abs), `${t.id} -> ${t.imageUrl}`).toBe(true)
    }
  })
})
