// 最低限度内容安全：敏感词过滤（Demo 级别）

const BANNED = [
  // 违法违规
  '诈骗', '赌博', '毒品', '枪支', '色情', '嫖娼',
  // 仇恨 / 暴力
  '杀人', '自杀', '自残', '暴力',
  // 政治敏感（保守占位，仅演示用）
  '颠覆', '分裂国家',
]

export function hasBanned(content: string): boolean {
  const s = content || ''
  return BANNED.some((w) => s.includes(w))
}

/** 简单清理：去除控制字符，限制长度 */
export function sanitize(content: string, maxLen = 500): string {
  return (content || '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').slice(0, maxLen).trim()
}
