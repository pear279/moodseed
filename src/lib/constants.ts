// 产品规则常量 —— 单一事实来源，前后端一致
export const REWARDS = {
  /** 每株植物拼图块数 */
  piecesPerPlant: 48,
  /** 拼图网格列数 */
  gridCols: 6,
  /** 拼图网格行数 */
  gridRows: 8,
  /** 每天通过记录最多获得碎片数 */
  dailyRecordPieceCap: 3,
  /** 连续记录奖励间隔（天） */
  streakIntervalDays: 7,
  /** 每次连续奖励碎片数 */
  streakPieces: 3,
  /** 签到积分 */
  pointsPerCheckin: 1,
  /** 兑换 1 块碎片所需积分 */
  pointsPerPiece: 21,
  /** 每天最多查看漂流瓶数 */
  dailyBottleCap: 5,
} as const

export const DEFAULT_NICKNAME = '小种子'
export const USER_ID_KEY = 'moodseed_uid'
export const ONBOARDED_KEY = 'moodseed_onboarded'
export const TIMEZONE = 'Asia/Shanghai'

/** 返回「今天」在 Asia/Shanghai 时区的 YYYY-MM-DD */
export function todayStr(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return parts // en-CA 输出 YYYY-MM-DD
}
