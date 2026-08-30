// 服务端通用工具（Workers 运行时）

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export function jsonError(message: string, status = 400): Response {
  return json({ error: message }, status)
}

export function uuid(): string {
  return crypto.randomUUID()
}

/** 当前时刻（UTC ISO） */
export function nowIso(): string {
  return new Date().toISOString()
}

const SH_TZ = 'Asia/Shanghai'

/** 某时刻在 Asia/Shanghai 的 YYYY-MM-DD */
export function dayStr(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SH_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** 今天（上海时区）YYYY-MM-DD */
export function todayStr(): string {
  return dayStr(new Date())
}

/** FNV-1a 字符串哈希（确定性） */
export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 0..n-1 的确定性伪随机洗牌（同一 seed 结果一致） */
export function seededShuffle(n: number, seed: string): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  let s = hashStr(seed)
  for (let i = arr.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0
    const j = s % (i + 1)
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

/** 解析 JSON 字段，失败返回 fallback */
export function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try {
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}
