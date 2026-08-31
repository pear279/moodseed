import messages from '../../content/fortune/messages.json'
import colors from '../../content/fortune/colors.json'
import foods from '../../content/fortune/foods.json'
import activities from '../../content/fortune/activities.json'
import config from '../../content/fortune/fortune-config.json'

export interface FortuneCard {
  date: string
  lucky_color: { name: string; hex: string }
  lucky_numbers: number[]
  lucky_food: string
  daily_message: string
  recommended: string[]
  avoid: string[]
}

/** FNV-1a 字符串哈希（确定性） */
function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 伪随机数生成器（确定性） */
function mulberry32(a: number): () => number {
  let seed = a | 0
  return function () {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates 洗牌（使用给定 rng，保证确定性） */
function shuffled<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

function pickOne<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

/**
 * 每日幸运卡：date + anonymous_user_id 生成稳定随机 Seed。
 * 同一用户同一天无论刷新多少次结果一致；第二天重新生成。
 * 不调用 AI，不产生额外 Token 成本。
 */
export function generateFortune(date: string, userId: string): FortuneCard {
  const rng = mulberry32(hashStr(`${date}:${userId}`))

  const lucky_color = pickOne(colors, rng)
  const lucky_numbers = shuffled(
    Array.from({ length: 9 }, (_, i) => i + 1),
    rng,
  )
    .slice(0, config.lucky_number_count)
    .sort((a, b) => a - b)
  const lucky_food = pickOne(foods, rng).name
  const daily_message = pickOne(messages, rng)
  const recommended = shuffled(activities.recommended, rng).slice(0, config.recommended_count)
  const avoid = shuffled(activities.avoid, rng).slice(0, config.avoid_count)

  return {
    date,
    lucky_color,
    lucky_numbers,
    lucky_food,
    daily_message,
    recommended,
    avoid,
  }
}

export function getFortuneMessages(): string[] {
  return messages as string[]
}

export function getFortuneColors(): { name: string; hex: string }[] {
  return colors as { name: string; hex: string }[]
}

export interface FoodItem {
  name: string
  emoji: string
}

export function getFoods(): FoodItem[] {
  return foods as FoodItem[]
}

export function getFoodEmoji(name: string): string {
  return getFoods().find((f) => f.name === name)?.emoji ?? '🍽️'
}
