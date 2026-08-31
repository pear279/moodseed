const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

/** "2026-08-31" → "8月31日 星期一" */
export function formatDateCN(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  const date = new Date(y, m - 1, d)
  return `${m}月${d}日 ${WEEKDAYS[date.getDay()]}`
}
