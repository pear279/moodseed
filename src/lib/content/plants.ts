import plantsData from '../../content/plants/plants.json'

export interface Plant {
  id: string
  order: number
  plant_name: string
  card_name: string
  emotion_theme: string
  related_emotions: string[]
  related_cognitive_patterns: string[]
  quote: string
  image_path: string
  puzzle_piece_count: number
}

/** 全部植物，按解锁顺序排序 */
export function getPlants(): Plant[] {
  return [...(plantsData as Plant[])].sort((a, b) => a.order - b.order)
}

export function getPlantById(id: string): Plant | undefined {
  return getPlants().find((p) => p.id === id)
}

/** 情绪所属的植物主题（仅用于内容匹配，不用于切换当前植物） */
export function getPlantByEmotion(emotionId: string): Plant | undefined {
  return getPlants().find((p) => p.related_emotions.includes(emotionId))
}

/** 每株植物的拼图块数（首版固定 48） */
export function getPuzzlePieceCount(): number {
  return getPlants()[0]?.puzzle_piece_count ?? 48
}
