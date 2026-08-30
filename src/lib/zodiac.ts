// 西方星座：纯日期区间计算，无需引入农历库（保持前端轻量）
const ZODIAC: { name: string; from: [number, number]; to: [number, number] }[] = [
  { name: '摩羯座', from: [12, 22], to: [1, 19] },
  { name: '水瓶座', from: [1, 20], to: [2, 18] },
  { name: '双鱼座', from: [2, 19], to: [3, 20] },
  { name: '白羊座', from: [3, 21], to: [4, 19] },
  { name: '金牛座', from: [4, 20], to: [5, 20] },
  { name: '双子座', from: [5, 21], to: [6, 21] },
  { name: '巨蟹座', from: [6, 22], to: [7, 22] },
  { name: '狮子座', from: [7, 23], to: [8, 22] },
  { name: '处女座', from: [8, 23], to: [9, 22] },
  { name: '天秤座', from: [9, 23], to: [10, 23] },
  { name: '天蝎座', from: [10, 24], to: [11, 22] },
  { name: '射手座', from: [11, 23], to: [12, 21] },
]

function inRange(m: number, d: number, from: [number, number], to: [number, number]): boolean {
  // 跨年（摩羯）
  if (from[0] > to[0]) return (m === from[0] && d >= from[1]) || (m === to[0] && d <= to[1])
  if (m < from[0] || m > to[0]) return false
  if (m === from[0] && d < from[1]) return false
  if (m === to[0] && d > to[1]) return false
  return true
}

export function zodiacOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return ''
  const hit = ZODIAC.find((z) => inRange(m, d, z.from, z.to))
  return hit?.name ?? ''
}

export function isValidBirthday(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() <= Date.now()
}
