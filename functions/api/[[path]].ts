import { json, jsonError, uuid, nowIso, todayStr, dayStr, parseJson } from '../lib/util'
import { buildLuckyCard } from '../lib/luck'
import { analyzeRecord } from '../lib/ai'
import { hasBanned, sanitize } from '../lib/security'
import { orderedPlants, currentPlantOf, nextPlantOf, awardPieces, type ProgressRow } from '../lib/plants'

const DAILY_PIECE_CAP = 3
const STREAK_INTERVAL = 7
const STREAK_PIECES = 3
const POINTS_PER_PIECE = 21
const DAILY_BOTTLE_CAP = 5

interface Env {
  DB: any
  R2: any
  DEEPSEEK_API_KEY?: string
  DEEPSEEK_BASE_URL?: string
  DEEPSEEK_MODEL?: string
}

/** 给定 YYYY-MM-DD 的前一天（纯日期运算，时区无关） */
function prevDay(s: string): string {
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - 1)
  return dt.toISOString().slice(0, 10)
}

async function body<T = Record<string, any>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    return {} as T
  }
}

function serializeRecord(r: any) {
  if (!r) return r
  return {
    ...r,
    emotion_tags: parseJson<string[]>(r.emotion_tags, []),
    ai_emotion_tags: parseJson<string[] | null>(r.ai_emotion_tags, null),
  }
}

function serializeComment(r: any) {
  return { id: r.id, bottle_id: r.bottle_id, content: r.content, created_at: r.created_at }
}

async function serializeBottle(db: any, r: any, viewerId?: string | null) {
  let liked = false
  if (viewerId && r) {
    const l = await db
      .prepare('SELECT 1 FROM bottle_likes WHERE bottle_id = ? AND user_id = ?')
      .bind(r.id, viewerId)
      .first()
    liked = !!l
  }
  return {
    id: r.id,
    plant_id: r.plant_id,
    content: r.content,
    emotion_tags: parseJson<string[]>(r.emotion_tags, []),
    likes_count: r.likes_count,
    created_at: r.created_at,
    liked,
  }
}

// ============ 用户 ============
async function userRoutes(env: Env, method: string, segs: string[], request: Request) {
  const db = env.DB

  if (method === 'POST' && segs.length === 1) {
    const { id } = await body(request)
    if (!id) return jsonError('缺少 id')
    await db.prepare('INSERT INTO users (id) VALUES (?) ON CONFLICT(id) DO NOTHING').bind(id).run()
    const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
    return json(row)
  }

  if (segs[1]) {
    const id = segs[1]

    if (method === 'GET') {
      const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
      if (!row) return jsonError('用户不存在', 404)
      const stats = await getUserStats(db, id)
      return json({ ...row, stats, activity: stats.activity })
    }

    if (method === 'PATCH') {
      const current = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
      if (!current) return jsonError('用户不存在', 404)
      const p = await body(request)
      const nickname = p.nickname != null ? sanitize(p.nickname, 12) : current.nickname
      const birthday = p.birthday !== undefined ? p.birthday || null : current.birthday
      const mbti = p.mbti !== undefined ? p.mbti || null : current.mbti
      await db
        .prepare('UPDATE users SET nickname = ?, birthday = ?, mbti = ?, updated_at = ? WHERE id = ?')
        .bind(nickname, birthday, mbti, nowIso(), id)
        .run()
      const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
      return json(row)
    }
  }

  return jsonError('Not found', 404)
}

async function getUserStats(db: any, userId: string) {
  const all = await db.prepare('SELECT local_date, piece_awarded FROM records WHERE user_id = ?').bind(userId).all()
  const rs = (all.results ?? []) as { local_date: string; piece_awarded: number }[]

  const days = new Set<string>()
  const activity = new Map<string, number>()
  for (const r of rs) {
    days.add(r.local_date)
    activity.set(r.local_date, (activity.get(r.local_date) ?? 0) + (r.piece_awarded || 0))
  }

  let streak = 0
  let cur = todayStr()
  if (!days.has(cur)) cur = prevDay(cur)
  while (days.has(cur)) {
    streak++
    cur = prevDay(cur)
  }

  const pu = await db
    .prepare("SELECT COUNT(*) AS c FROM puzzle_progress WHERE user_id = ? AND status = 'completed'")
    .bind(userId)
    .first()

  const since = new Date()
  since.setDate(since.getDate() - 59)
  const sinceStr = dayStr(since)
  const activityArr = [...activity.entries()]
    .filter(([d]) => d >= sinceStr)
    .map(([date, pieces]) => ({ date, pieces }))

  return { streak_days: streak, total_days: days.size, plants_unlocked: pu?.c ?? 0, activity: activityArr }
}

// ============ 签到 ============
async function checkinRoutes(env: Env, method: string, segs: string[], request: Request) {
  const db = env.DB

  if (method === 'POST' && segs.length === 1) {
    const { userId } = await body(request)
    if (!userId) return jsonError('缺少 userId')
    const today = todayStr()
    const lucky = buildLuckyCard(userId)
    const ins = await db
      .prepare(
        `INSERT INTO checkins (id, user_id, checkin_date, points, lucky, created_at)
         VALUES (?, ?, ?, 1, ?, ?)
         ON CONFLICT(user_id, checkin_date) DO NOTHING`,
      )
      .bind(uuid(), userId, today, JSON.stringify(lucky), nowIso())
      .run()

    if (ins.meta?.changes === 1) {
      await db.prepare('UPDATE users SET points = points + 1 WHERE id = ?').bind(userId).run()
      await db
        .prepare(
          `INSERT INTO point_transactions (id, user_id, local_date, delta, reason, created_at)
           VALUES (?, ?, ?, 1, 'checkin', ?)`,
        )
        .bind(uuid(), userId, today, nowIso())
        .run()
    }
    const user = await db.prepare('SELECT points FROM users WHERE id = ?').bind(userId).first()
    return json({ checked_in: true, points: user?.points ?? 0, lucky })
  }

  if (method === 'GET' && segs[1] === 'today') {
    const userId = new URL(request.url).searchParams.get('userId')
    if (!userId) return jsonError('缺少 userId')
    const today = todayStr()
    const row = await db
      .prepare('SELECT * FROM checkins WHERE user_id = ? AND checkin_date = ?')
      .bind(userId, today)
      .first()
    const user = await db.prepare('SELECT points FROM users WHERE id = ?').bind(userId).first()
    if (row) return json({ checked_in: true, points: user?.points ?? 0, lucky: parseJson(row.lucky, null) })
    return json({ checked_in: false, points: user?.points ?? 0, lucky: null })
  }

  return jsonError('Not found', 404)
}

// ============ 记录 ============
async function createRecord(env: Env, request: Request) {
  const db = env.DB
  const p = await body(request)
  const userId = p.userId as string
  const content = sanitize(p.content, 5000)
  if (!userId || !content) return jsonError('内容不能为空')
  const title = p.title ? sanitize(p.title, 60) : null
  const emotionTags = Array.isArray(p.emotionTags) ? (p.emotionTags as string[]).slice(0, 10) : []
  const imageUrl = typeof p.imageUrl === 'string' ? p.imageUrl : null
  const analyze = !!p.analyze
  const today = todayStr()
  const id = uuid()
  const now = nowIso()

  // AI 分析
  let analysis: Awaited<ReturnType<typeof analyzeRecord>> | null = null
  let aiStatus = 'skipped'
  if (analyze) {
    try {
      analysis = await analyzeRecord(env, { title: title ?? undefined, content, tags: emotionTags })
      aiStatus = 'done'
    } catch {
      aiStatus = 'failed'
    }
  }

  // 每日记录碎片（上限 3）
  const capRow = await db
    .prepare('SELECT COUNT(*) AS c FROM records WHERE user_id = ? AND local_date = ? AND piece_awarded = 1')
    .bind(userId, today)
    .first()
  const recordPiece = (capRow?.c ?? 0) < DAILY_PIECE_CAP ? 1 : 0

  await db
    .prepare(
      `INSERT INTO records
        (id, user_id, local_date, title, content, image_url, emotion_tags,
         ai_emotion_tags, ai_summary, ai_reason, ai_suggestion, ai_status, piece_awarded, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      userId,
      today,
      title,
      content,
      imageUrl,
      JSON.stringify(emotionTags),
      analysis ? JSON.stringify(analysis.emotion_tags) : null,
      analysis?.summary ?? null,
      analysis?.reason ?? null,
      analysis?.suggestion ?? null,
      aiStatus,
      recordPiece,
      now,
    )
    .run()

  // 连续记录奖励（每 7 天 +3，每天最多触发一次）
  let streakPieces = 0
  const streak = await computeStreak(db, userId)
  if (streak > 0 && streak % STREAK_INTERVAL === 0) {
    const already = await db
      .prepare("SELECT COUNT(*) AS c FROM point_transactions WHERE user_id = ? AND reason = 'streak' AND local_date = ?")
      .bind(userId, today)
      .first()
    if (!(already?.c ?? 0)) {
      streakPieces = STREAK_PIECES
      await db
        .prepare(
          `INSERT INTO point_transactions (id, user_id, local_date, delta, reason, created_at)
           VALUES (?, ?, ?, 0, 'streak', ?)`,
        )
        .bind(uuid(), userId, today, now)
        .run()
    }
  }

  const totalPieces = recordPiece + streakPieces
  const award = await awardPieces(db, userId, totalPieces)

  const row = await db.prepare('SELECT * FROM records WHERE id = ?').bind(id).first()
  return json({
    record: serializeRecord(row),
    analysis,
    pieceAwarded: totalPieces,
    recordPiece,
    streakPieces,
    unlockedCount: award?.unlockedCount ?? null,
    newPositions: award?.newPositions ?? [],
  })
}

async function computeStreak(db: any, userId: string): Promise<number> {
  const all = await db
    .prepare('SELECT DISTINCT local_date AS d FROM records WHERE user_id = ?')
    .bind(userId)
    .all()
  const days = new Set((all.results ?? []).map((r: any) => r.d as string))
  let streak = 0
  let cur = todayStr()
  if (!days.has(cur)) cur = prevDay(cur)
  while (days.has(cur)) {
    streak++
    cur = prevDay(cur)
  }
  return streak
}

async function recordRoutes(env: Env, method: string, segs: string[], request: Request) {
  const db = env.DB

  if (method === 'POST' && segs.length === 1) return createRecord(env, request)

  if (method === 'GET' && segs.length === 1) {
    const userId = new URL(request.url).searchParams.get('userId')
    if (!userId) return jsonError('缺少 userId')
    const rows = await db
      .prepare('SELECT * FROM records WHERE user_id = ? ORDER BY created_at DESC LIMIT 200')
      .bind(userId)
      .all()
    return json((rows.results ?? []).map(serializeRecord))
  }

  if (segs[1]) {
    const id = segs[1]

    if (method === 'GET') {
      const row = await db.prepare('SELECT * FROM records WHERE id = ?').bind(id).first()
      if (!row) return jsonError('记录不存在', 404)
      return json(serializeRecord(row))
    }

    if (method === 'POST' && segs[2] === 'analyze') {
      const row = await db.prepare('SELECT * FROM records WHERE id = ?').bind(id).first()
      if (!row) return jsonError('记录不存在', 404)
      const analysis = await analyzeRecord(env, {
        title: row.title ?? undefined,
        content: row.content,
        tags: parseJson<string[]>(row.emotion_tags, []),
      })
      await db
        .prepare('UPDATE records SET ai_emotion_tags = ?, ai_summary = ?, ai_reason = ?, ai_suggestion = ?, ai_status = ? WHERE id = ?')
        .bind(JSON.stringify(analysis.emotion_tags), analysis.summary, analysis.reason, analysis.suggestion, 'done', id)
        .run()
      return json(analysis)
    }
  }

  return jsonError('Not found', 404)
}

// ============ 进度 / 兑换 ============
async function progressRoute(env: Env, request: Request) {
  const db = env.DB
  const userId = new URL(request.url).searchParams.get('userId')
  if (!userId) return jsonError('缺少 userId')
  const all = await db.prepare('SELECT * FROM puzzle_progress WHERE user_id = ?').bind(userId).all()
  const rows = (all.results ?? []) as ProgressRow[]
  const byPlant = new Map(rows.map((r) => [r.plant_id, r]))
  const ordered = orderedPlants()

  const currentPlantId = currentPlantOf(rows)
  const currentIdx = ordered.findIndex((p) => p.id === currentPlantId)

  const progress = ordered.map((plant, idx) => {
    const r = byPlant.get(plant.id)
    let status = r?.status ?? 'active'
    if (!r && idx > currentIdx) status = 'locked'
    return {
      plant_id: plant.id,
      unlocked_count: r?.unlocked_count ?? 0,
      positions: r ? parseJson<number[]>(r.positions, []) : [],
      status,
      completed_at: r?.completed_at ?? null,
    }
  })

  return json({
    plants: ordered,
    progress,
    currentPlantId,
    nextPlantId: nextPlantOf(currentPlantId),
  })
}

async function exchangeRoute(env: Env, request: Request) {
  const db = env.DB
  const { userId } = await body(request)
  if (!userId) return jsonError('缺少 userId')
  const user = await db.prepare('SELECT points FROM users WHERE id = ?').bind(userId).first()
  if (!user || (user.points ?? 0) < POINTS_PER_PIECE) return jsonError('积分不足')

  await db.prepare('UPDATE users SET points = points - ? WHERE id = ?').bind(POINTS_PER_PIECE, userId).run()
  await db
    .prepare(
      `INSERT INTO point_transactions (id, user_id, local_date, delta, reason, created_at)
       VALUES (?, ?, ?, ?, 'exchange', ?)`,
    )
    .bind(uuid(), userId, todayStr(), -POINTS_PER_PIECE, nowIso())
    .run()

  const award = await awardPieces(db, userId, 1)
  const u = await db.prepare('SELECT points FROM users WHERE id = ?').bind(userId).first()
  return json({ points: u.points, pieceAwarded: 1, unlockedCount: award.unlockedCount, plantId: award.plantId })
}

// ============ 漂流瓶 ============
async function bottleRoutes(env: Env, method: string, segs: string[], request: Request) {
  const db = env.DB

  // POST /api/bottles
  if (method === 'POST' && segs.length === 1) {
    const p = await body(request)
    const userId = p.userId as string
    const plantId = p.plantId as string
    const content = sanitize(p.content, 500)
    if (!userId || !plantId || !content) return jsonError('内容不能为空')
    if (hasBanned(content)) return jsonError('内容包含敏感信息，请修改后发布')
    const id = uuid()
    await db
      .prepare(
        `INSERT INTO bottles (id, user_id, plant_id, content, emotion_tags, status, likes_count, created_at)
         VALUES (?, ?, ?, ?, ?, 'normal', 0, ?)`,
      )
      .bind(id, userId, plantId, content, JSON.stringify(Array.isArray(p.emotionTags) ? p.emotionTags : []), nowIso())
      .run()
    const row = await db.prepare('SELECT * FROM bottles WHERE id = ?').bind(id).first()
    return json(await serializeBottle(db, row, userId))
  }

  // GET /api/bottles/random
  if (method === 'GET' && segs[1] === 'random') {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const plantId = url.searchParams.get('plantId')
    if (!userId || !plantId) return jsonError('缺少参数')

    const today = todayStr()
    const user = await db
      .prepare('SELECT bottle_view_date, bottle_view_count FROM users WHERE id = ?')
      .bind(userId)
      .first()
    let count = user?.bottle_view_count ?? 0
    if (user?.bottle_view_date !== today) count = 0
    if (count >= DAILY_BOTTLE_CAP) return jsonError(`今天最多看 ${DAILY_BOTTLE_CAP} 个漂流瓶哦`, 429)

    const row = await db
      .prepare(
        `SELECT * FROM bottles WHERE plant_id = ? AND status = 'normal' AND user_id != ? ORDER BY RANDOM() LIMIT 1`,
      )
      .bind(plantId, userId)
      .first()
    if (!row) return json(null)

    await db
      .prepare('UPDATE users SET bottle_view_date = ?, bottle_view_count = ? WHERE id = ?')
      .bind(today, count + 1, userId)
      .run()
    return json(await serializeBottle(db, row, userId))
  }

  // 其它 /api/bottles/:id 与子路由
  if (segs[1]) {
    const id = segs[1]

    if (method === 'GET') {
      const userId = new URL(request.url).searchParams.get('userId')
      const row = await db
        .prepare("SELECT * FROM bottles WHERE id = ? AND status != 'deleted'")
        .bind(id)
        .first()
      if (!row) return jsonError('漂流瓶不存在', 404)
      const comments = await db
        .prepare("SELECT * FROM comments WHERE bottle_id = ? AND status = 'normal' ORDER BY created_at ASC")
        .bind(id)
        .all()
      const bottle = await serializeBottle(db, row, userId)
      return json({ ...bottle, comments: (comments.results ?? []).map(serializeComment) })
    }

    if (method === 'POST' && segs[2] === 'like') {
      const { userId } = await body(request)
      if (!userId) return jsonError('缺少 userId')
      const existing = await db
        .prepare('SELECT 1 FROM bottle_likes WHERE bottle_id = ? AND user_id = ?')
        .bind(id, userId)
        .first()
      if (existing) {
        await db.prepare('DELETE FROM bottle_likes WHERE bottle_id = ? AND user_id = ?').bind(id, userId).run()
        await db.prepare('UPDATE bottles SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').bind(id).run()
      } else {
        await db
          .prepare('INSERT INTO bottle_likes (bottle_id, user_id, created_at) VALUES (?, ?, ?)')
          .bind(id, userId, nowIso())
          .run()
        await db.prepare('UPDATE bottles SET likes_count = likes_count + 1 WHERE id = ?').bind(id).run()
      }
      const b = await db.prepare('SELECT likes_count FROM bottles WHERE id = ?').bind(id).first()
      return json({ liked: !existing, likes_count: b?.likes_count ?? 0 })
    }

    if (method === 'POST' && segs[2] === 'comments') {
      const p = await body(request)
      const userId = p.userId as string
      const content = sanitize(p.content, 300)
      if (!userId || !content) return jsonError('评论不能为空')
      if (hasBanned(content)) return jsonError('评论包含敏感信息')
      await db
        .prepare(`INSERT INTO comments (id, bottle_id, user_id, content, status, created_at) VALUES (?, ?, ?, ?, 'normal', ?)`)
        .bind(uuid(), id, userId, content, nowIso())
        .run()
      return json({ ok: true })
    }

    if (method === 'POST' && segs[2] === 'report') {
      await db.prepare("UPDATE bottles SET status = 'hidden' WHERE id = ?").bind(id).run()
      return json({ ok: true })
    }

    if (method === 'DELETE') {
      const { userId } = await body(request)
      await db.prepare("UPDATE bottles SET status = 'deleted' WHERE id = ? AND user_id = ?").bind(id, userId).run()
      return json({ ok: true })
    }
  }

  return jsonError('Not found', 404)
}

// ============ 上传 / 图片 ============
async function uploadRoute(env: Env, request: Request) {
  const form = await request.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') return jsonError('缺少文件')
  const f = file as File
  const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const key = `images/${uuid()}.${ext || 'jpg'}`
  await env.R2.put(key, await f.arrayBuffer(), {
    httpMetadata: { contentType: f.type || 'image/jpeg' },
  })
  return json({ url: `/api/image/${key}` })
}

async function serveImage(env: Env, key: string) {
  const obj = await env.R2.get(key)
  if (!obj) return new Response('Not found', { status: 404 })
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('etag', obj.httpEtag)
  return new Response(obj.body, { headers })
}

// ============ 路由分发 ============
export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context
  const url = new URL(request.url)
  const method = request.method
  const segs = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)

  try {
    if (segs[0] === 'image' && segs[1]) return await serveImage(env, segs[1])
    if (segs[0] === 'user') return await userRoutes(env, method, segs, request)
    if (segs[0] === 'checkin') return await checkinRoutes(env, method, segs, request)
    if (segs[0] === 'records') return await recordRoutes(env, method, segs, request)
    if (segs[0] === 'progress') return await progressRoute(env, request)
    if (segs[0] === 'exchange') return await exchangeRoute(env, request)
    if (segs[0] === 'bottles') return await bottleRoutes(env, method, segs, request)
    if (segs[0] === 'upload' && method === 'POST') return await uploadRoute(env, request)
    return jsonError('Not found', 404)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : '服务器错误', 500)
  }
}
