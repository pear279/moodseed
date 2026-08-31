// Moodseed API 冒烟测试：对本地 wrangler pages dev（默认 8788）跑核心规则断言。
// 用法：先 `pnpm build && pnpm dev:api`，再 `node scripts/smoke.mjs`
const BASE = process.env.BASE_URL || 'http://localhost:8788'

let failures = 0
function assert(cond, msg) {
  if (cond) console.log('  ✓', msg)
  else {
    console.error('  ✗', msg)
    failures++
  }
}

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text
  }
  return { status: res.status, json }
}

const uid = 'smoke-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

async function main() {
  console.log(`\nMoodseed 冒烟测试（user=${uid}）\n`)

  // 1. 用户创建
  const u = await req('POST', '/api/user', { id: uid })
  assert(u.status === 200 && u.json.id === uid, '创建匿名用户')
  assert(u.json.nickname === '小种子' && u.json.points === 0, '默认昵称 + 初始积分 0')

  // 2. 签到（幂等）
  const c1 = await req('POST', '/api/checkin', { userId: uid })
  assert(c1.json.checked_in && c1.json.points === 1, '首次签到 +1 积分')
  assert(c1.json.lucky && c1.json.lucky.lucky_color?.hex && c1.json.lucky.daily_message, '幸运卡含幸运色/幸运语')
  assert(
    Array.isArray(c1.json.lucky.lucky_numbers) && c1.json.lucky.lucky_numbers.length === 2,
    '幸运卡含 2 个幸运数字',
  )
  assert(c1.json.lucky.lucky_food, '幸运卡含幸运食物')
  assert(
    Array.isArray(c1.json.lucky.recommended) && c1.json.lucky.recommended.length === 2,
    '幸运卡建议 2 条',
  )
  assert(Array.isArray(c1.json.lucky.avoid) && c1.json.lucky.avoid.length === 2, '幸运卡避免 2 条')
  const c2 = await req('POST', '/api/checkin', { userId: uid })
  assert(c2.json.points === 1, '重复签到不重复加分（幂等）')

  // 3. 记录 + 每日碎片上限 3
  const mk = (i) => req('POST', '/api/records', {
    userId: uid,
    title: `测试 ${i}`,
    content: `今天很累，发生了很多事，感觉有点焦虑。第 ${i} 条。`,
    emotionTags: ['疲惫'],
    analyze: true,
  })
  const r1 = await mk(1)
  assert(r1.json.pieceAwarded === 1 && r1.json.unlockedCount === 35, '第 1 条记录 +1 块（初始 34 → 35）')
  assert(r1.json.analysis === null && r1.json.record.ai_status === 'pending', 'AI 异步（保存即返回 pending）')
  const r2 = await mk(2)
  assert(r2.json.unlockedCount === 36, '第 2 条后完成第一株（35 → 36）')
  const r3 = await mk(3)
  assert(r3.json.unlockedCount === 1, '第 3 条后下一株 1 块')
  const r4 = await mk(4)
  assert(r4.json.pieceAwarded === 0, '第 4 条不再给碎片（日上限 3）')
  assert(r4.json.unlockedCount === 1, '第 4 条后下一株仍为 1 块')

  // 3.1 AI 后台完成后回写（轮询第 1 条记录）
  let aiDone = false
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 300))
    const rec = await req('GET', `/api/records/${r1.json.record.id}`)
    if (rec.json.ai_status !== 'pending') {
      aiDone = true
      assert(
        Array.isArray(rec.json.ai_emotion_tags) && rec.json.ai_emotion_tags.length > 0 && rec.json.ai_summary,
        'AI 后台分析返回 emotion_tags/summary（兜底）',
      )
      break
    }
  }
  assert(aiDone, 'AI 后台分析完成')

  // 4. 进度（当前株 / locked 状态）
  const prog = await req('GET', `/api/progress?userId=${uid}`)
  assert(prog.json.currentPlantId === 'mushroom_calm' && prog.json.nextPlantId === 'dandelion_release', '当前株 mushroom_calm，下一株 dandelion_release')
  const cactus = prog.json.progress.find((p) => p.plant_id === 'cactus_boundary')
  const mushroom = prog.json.progress.find((p) => p.plant_id === 'mushroom_calm')
  assert(cactus.unlocked_count === 36 && cactus.status === 'completed', 'cactus_boundary 36 块 completed')
  assert(mushroom.unlocked_count === 1 && mushroom.status === 'active', 'mushroom_calm 1 块 active')

  // 5. 积分兑换守卫（仅 1 分，不足 21）
  const ex = await req('POST', '/api/exchange', { userId: uid })
  assert(ex.status === 400 && ex.json.error === '积分不足', '积分不足拒绝兑换')

  // 6. 漂流瓶
  const uid2 = uid + '-b'
  await req('POST', '/api/user', { id: uid2 })
  const pub = await req('POST', '/api/bottles', {
    userId: uid,
    plantId: 'cactus_boundary',
    content: '今天第一次拒绝了一件不想做的事，有点紧张但也轻松。',
    emotionTags: ['紧张'],
  })
  assert(pub.status === 200 && pub.json.id, '发布漂流瓶')
  const rnd = await req('GET', `/api/bottles/random?userId=${uid2}&plantId=cactus_boundary`)
  assert(rnd.json && rnd.json.plant_id === 'cactus_boundary' && typeof rnd.json.content === 'string', '他人随机捞到瓶子（同植物、有内容）')
  const like = await req('POST', `/api/bottles/${pub.json.id}/like`, { userId: uid2 })
  assert(like.json.liked === true && like.json.likes_count === 1, '点赞 +1')
  const cmt = await req('POST', `/api/bottles/${pub.json.id}/comments`, { userId: uid2, content: '你做得很好' })
  assert(cmt.json.ok === true, '一级评论成功')
  const detail = await req('GET', `/api/bottles/${pub.json.id}?userId=${uid2}`)
  assert(detail.json.comments?.length === 1, '详情返回 1 条评论')
  const bad = await req('POST', '/api/bottles', { userId: uid, plantId: 'cactus', content: '涉及赌博内容测试', emotionTags: [] })
  assert(bad.status === 400, '敏感词被拦截')

  // 7. 用户统计
  const stats = await req('GET', `/api/user/${uid}`)
  assert(stats.json.stats.total_days === 1 && stats.json.stats.streak_days === 1, '累计/连续 1 天')
  assert(stats.json.stats.plants_unlocked === 1, '已解锁植物 1（cactus 已完成）')
  assert(stats.json.activity?.[0]?.pieces === 3, '活动日历今日 3 块')

  // 8. 图片上传（R2）与回读
  const form = new FormData()
  form.append('file', new Blob(['fake-image-bytes'], { type: 'image/png' }), 'tiny.png')
  const up = await fetch(BASE + '/api/upload', { method: 'POST', body: form })
  const upJson = await up.json()
  assert(up.status === 200 && upJson.url.startsWith('/api/image/'), '图片上传返回 URL')
  const img = await fetch(BASE + upJson.url)
  assert(img.status === 200 && (img.headers.get('content-type') || '').startsWith('image/'), '图片可经 /api/image 回读')

  console.log(failures === 0 ? '\n✅ 全部通过\n' : `\n❌ ${failures} 项失败\n`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('冒烟测试异常：', e)
  process.exit(1)
})
