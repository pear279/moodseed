import { Solar } from 'lunar-javascript'
import phrases from '../../data/lucky-phrases.json'
import colors from '../../data/lucky-colors.json'
import { hashStr, todayStr } from './util'

export interface LuckyCard {
  phrase: string
  yi: string[]
  ji: string[]
  color: { name: string; hex: string }
  date: string
}

function almanac(d: Date): { yi: string[]; ji: string[] } {
  try {
    const solar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate())
    const lunar = solar.getLunar()
    return {
      yi: (lunar.getDayYi() || []).slice(0, 3),
      ji: (lunar.getDayJi() || []).slice(0, 3),
    }
  } catch {
    return { yi: [], ji: [] }
  }
}

/**
 * 每日幸运卡：按 日期 + userId 确定性生成（同人同天刷新不变）。
 * 宜忌来自黄历（lunar-javascript，按日期）；幸运语/幸运色按日期+用户哈希。
 */
export function buildLuckyCard(userId: string, d = new Date()): LuckyCard {
  const date = todayStr()
  const seed = hashStr(`${date}:${userId}`)
  const phrase = phrases[seed % phrases.length]
  const color = colors[(seed >>> 8) % colors.length]
  const { yi, ji } = almanac(d)
  return { phrase, yi, ji, color, date }
}
