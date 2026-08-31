export type AiStatus = 'pending' | 'done' | 'failed' | 'skipped'

export interface User {
  id: string
  nickname: string
  birthday?: string | null
  mbti?: string | null
  points: number
  created_at: string
  updated_at: string
}

export interface AiAnalysis {
  emotion_tags: string[]
  summary: string
  reason: string
  suggestion: string
}

export interface RecordItem {
  id: string
  user_id: string
  local_date?: string
  title?: string | null
  content: string
  image_url?: string | null
  emotion_tags: string[]
  ai_emotion_tags?: string[] | null
  ai_summary?: string | null
  ai_reason?: string | null
  ai_suggestion?: string | null
  ai_status: AiStatus
  piece_awarded: number
  created_at: string
}

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

export interface PlantProgress {
  plant_id: string
  unlocked_count: number
  positions: number[]
  status: 'active' | 'completed'
  completed_at?: string | null
}

export interface LuckyColor {
  name: string
  hex: string
}

export interface LuckyCard {
  date: string
  lucky_color: LuckyColor
  lucky_numbers: number[]
  lucky_food: string
  daily_message: string
  recommended: string[]
  avoid: string[]
}

export interface CheckinToday {
  checked_in: boolean
  points: number
  lucky: LuckyCard | null
}

export interface Comment {
  id: string
  bottle_id: string
  content: string
  created_at: string
}

export interface Bottle {
  id: string
  plant_id: string
  content: string
  emotion_tags: string[]
  likes_count: number
  created_at: string
  liked?: boolean
  comments?: Comment[]
}

export interface UserStats {
  streak_days: number
  total_days: number
  plants_unlocked: number
}

export interface DayActivity {
  date: string
  pieces: number
}

export interface ProgressOverview {
  plants: Plant[]
  progress: PlantProgress[]
  currentPlantId: string
  nextPlantId: string | null
}
