import { getPlants, getPuzzlePieceCount, type Plant } from '../../src/lib/content/plants'
import { nowIso, parseJson, seededShuffle } from './util'

export const PIECES = getPuzzlePieceCount()

export function orderedPlants(): Plant[] {
  return getPlants()
}

export interface ProgressRow {
  user_id: string
  plant_id: string
  unlocked_count: number
  positions: string
  status: 'active' | 'completed'
  completed_at: string | null
}

/** 当前植物 = 第一株未完成的植物（顺序成长路线，不随单条情绪切换） */
export function currentPlantOf(rows: ProgressRow[]): string {
  const completed = new Set(rows.filter((r) => r.status === 'completed').map((r) => r.plant_id))
  const ordered = orderedPlants()
  return (ordered.find((p) => !completed.has(p.id)) ?? ordered[ordered.length - 1]).id
}

export function nextPlantOf(currentId: string): string | null {
  const ordered = orderedPlants()
  const idx = ordered.findIndex((p) => p.id === currentId)
  return idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1].id : null
}

export interface AwardResult {
  plantId: string
  unlockedCount: number
  newPositions: number[]
  completed: boolean
}

/**
 * 向「当前植物」授予 count 块碎片（确定性位置洗牌，同一用户同一株顺序稳定）。
 * 达到 48 块自动标记 completed。
 */
export async function awardPieces(db: any, userId: string, count: number): Promise<AwardResult> {
  const all = await db.prepare('SELECT * FROM puzzle_progress WHERE user_id = ?').bind(userId).all()
  const rows = (all.results ?? []) as ProgressRow[]
  const plantId = currentPlantOf(rows)
  const existing = rows.find((r) => r.plant_id === plantId)

  const positions = parseJson<number[]>(existing?.positions, [])
  if (count <= 0) {
    return { plantId, unlockedCount: positions.length, newPositions: [], completed: positions.length >= PIECES }
  }
  const shuffled = seededShuffle(PIECES, `${userId}:${plantId}`)
  const newPositions: number[] = []
  for (const p of shuffled) {
    if (newPositions.length >= count) break
    if (!positions.includes(p)) {
      positions.push(p)
      newPositions.push(p)
    }
  }

  const unlockedCount = positions.length
  const completed = unlockedCount >= PIECES
  const status = completed ? 'completed' : 'active'
  const completedAt = completed ? existing?.completed_at ?? nowIso() : existing?.completed_at ?? null

  await db
    .prepare(
      `INSERT INTO puzzle_progress
        (user_id, plant_id, unlocked_count, positions, status, completed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, plant_id) DO UPDATE SET
        unlocked_count = excluded.unlocked_count,
        positions = excluded.positions,
        status = excluded.status,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at`,
    )
    .bind(
      userId,
      plantId,
      unlockedCount,
      JSON.stringify(positions),
      status,
      completedAt,
      nowIso(),
    )
    .run()

  return { plantId, unlockedCount, newPositions, completed }
}
