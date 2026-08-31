import { getPlants } from './plants'
import type { PuzzleTheme } from '../../types/puzzle'

/** 全部拼图主题（每株植物一个主题，共用同一套 36 块模板，仅替换 imageUrl） */
export function getPuzzleThemes(): PuzzleTheme[] {
  return getPlants().map((p) => ({
    id: p.id,
    name: p.plant_name,
    imageUrl: p.puzzle_image_path,
    totalPieces: p.puzzle_piece_count,
  }))
}

export function getPuzzleThemeById(id: string): PuzzleTheme | undefined {
  return getPuzzleThemes().find((t) => t.id === id)
}
