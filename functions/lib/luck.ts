import { generateFortune, type FortuneCard } from '../../src/lib/content/fortune'
import { todayStr } from './util'

export type LuckyCard = FortuneCard

/**
 * 每日幸运卡：date + anonymous_user_id 确定性生成。
 * 同一用户同一天刷新结果一致，第二天重新生成；不调用 AI。
 */
export function buildLuckyCard(userId: string): LuckyCard {
  return generateFortune(todayStr(), userId)
}
