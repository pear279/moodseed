import emotionsData from '../../content/cbt/emotions.json'

export interface Emotion {
  id: string
  name: string
  english: string
  definition: string
  category: 'positive' | 'stress' | 'low' | 'self'
  emoji: string
  related_cognitive_patterns: string[]
  plant_id: string | null
}

export function getEmotions(): Emotion[] {
  return emotionsData as Emotion[]
}

export function getEmotionById(id: string): Emotion | undefined {
  return getEmotions().find((e) => e.id === id)
}

export function getEmotionByName(name: string): Emotion | undefined {
  return getEmotions().find((e) => e.name === name)
}

/** 全部情绪中文名列表（供 AI Prompt 使用） */
export function getEmotionNames(): string[] {
  return getEmotions().map((e) => e.name)
}
