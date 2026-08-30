import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { REWARDS } from '../lib/constants'
import type { Bottle } from '../lib/types'
import { EmotionPicker } from '../components/EmotionPicker'
import { IconArrowLeft, IconBottle, IconComment, IconHeart } from '../components/icons'

export default function BottlePage() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [currentPlantId, setCurrentPlantId] = useState<string | null>(null)
  const [bottle, setBottle] = useState<Bottle | null>(null)
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number>(REWARDS.dailyBottleCap)
  const [limited, setLimited] = useState(false)
  const [detail, setDetail] = useState<Bottle | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishContent, setPublishContent] = useState('')
  const [publishTags, setPublishTags] = useState<string[]>([])
  const [commentText, setCommentText] = useState('')
  const [error, setError] = useState('')

  const loadContext = useCallback(async () => {
    if (!user) return
    const prog = await api.progress(user.id)
    setCurrentPlantId(prog.currentPlantId)
  }, [user])

  useEffect(() => {
    loadContext()
  }, [loadContext])

  const fetchBottle = async () => {
    if (!user || !currentPlantId) return
    setLoading(true)
    setError('')
    setDetail(null)
    try {
      const b = await api.randomBottle(user.id, currentPlantId)
      setBottle(b)
      if (b) {
        setRemaining((r) => Math.max(0, r - 1))
        const d = await api.getBottle(b.id, user.id)
        setDetail(d)
      }
    } catch (e) {
      if ((e as Error).message.includes('最多看')) setLimited(true)
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const like = async () => {
    if (!user || !bottle) return
    const res = await api.likeBottle(bottle.id, user.id)
    setBottle({ ...bottle, liked: res.liked, likes_count: res.likes_count })
    if (detail) setDetail({ ...detail, liked: res.liked, likes_count: res.likes_count })
  }

  const comment = async () => {
    if (!user || !bottle || !commentText.trim()) return
    await api.commentBottle(bottle.id, user.id, commentText.trim())
    setCommentText('')
    const d = await api.getBottle(bottle.id, user.id)
    setDetail(d)
  }

  const publish = async () => {
    if (!user || !currentPlantId || !publishContent.trim()) return
    setPublishing(true)
    setError('')
    try {
      await api.publishBottle({
        userId: user.id,
        plantId: currentPlantId,
        content: publishContent.trim(),
        emotionTags: publishTags,
      })
      setPublishContent('')
      setPublishTags([])
      setError('已发布，感谢你的分享 🌊')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-10 pt-6">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="grid h-9 w-9 place-items-center rounded-full text-ink/60 active:bg-ink/5"
          aria-label="返回"
        >
          <IconArrowLeft width={22} height={22} />
        </button>
        <div>
          <h1 className="text-lg font-semibold">匿名漂流瓶</h1>
          <p className="text-xs text-ink/40">看看正在解锁同一株植物的人留下的情绪</p>
        </div>
      </header>

      {/* 捞瓶子 */}
      <section className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink/50">今日还可捞 {remaining} 个</span>
          <button
            onClick={fetchBottle}
            disabled={loading || limited}
            className="rounded-full bg-moss px-5 py-2 text-sm font-medium text-white active:bg-leaf disabled:opacity-50"
          >
            {loading ? '捞取中…' : '捞起一个'}
          </button>
        </div>

        {limited && (
          <div className="mt-3 rounded-2xl bg-sand/70 p-4 text-sm text-ink/70">
            今天的 {REWARDS.dailyBottleCap} 个漂流瓶已经看完啦，明天再来 🌙
          </div>
        )}

        {error && !limited && !error.includes('已发布') && (
          <div className="mt-3 rounded-2xl bg-[#F7C8CE]/30 p-4 text-sm text-[#B86B5A]">{error}</div>
        )}
        {error.includes('已发布') && (
          <div className="mt-3 rounded-2xl bg-lime/40 p-4 text-sm text-leaf">{error}</div>
        )}

        {bottle === null && !loading && !error && (
          <div className="mt-6 rounded-3xl border border-dashed border-ink/10 py-16 text-center">
            <div className="text-4xl">🌊</div>
            <p className="mt-3 text-sm text-ink/50">点击「捞起一个」，遇见一份相似的情绪</p>
          </div>
        )}

        {bottle && (
          <div className="mt-4 animate-pop-in rounded-3xl bg-white p-5 shadow-card">
            <div className="flex flex-wrap gap-1.5">
              {bottle.emotion_tags.map((t) => (
                <span key={t} className="rounded-full bg-lime/40 px-2 py-0.5 text-xs text-leaf">
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-3 leading-relaxed text-ink/85">{bottle.content}</p>
            <div className="mt-3 text-xs text-ink/40">{bottle.created_at.slice(0, 10)} · 匿名</div>

            <div className="mt-4 flex items-center gap-4 border-t border-ink/5 pt-3">
              <button onClick={like} className={`flex items-center gap-1 text-sm ${bottle.liked ? 'text-[#D98B8B]' : 'text-ink/50'}`}>
                <IconHeart width={18} height={18} fill={bottle.liked ? 'currentColor' : 'none'} />
                {bottle.likes_count}
              </button>
              <span className="flex items-center gap-1 text-sm text-ink/50">
                <IconComment width={18} height={18} /> {detail?.comments?.length ?? 0}
              </span>
            </div>

            {/* 评论 */}
            {detail?.comments && (
              <div className="mt-3 space-y-2">
                {detail.comments.map((c) => (
                  <div key={c.id} className="rounded-xl bg-sand/60 px-3 py-2 text-sm text-ink/75">
                    {c.content}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && comment()}
                placeholder="写一句鼓励的话…"
                maxLength={200}
                className="min-w-0 flex-1 rounded-full border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
              />
              <button onClick={comment} className="rounded-full bg-sand px-4 text-sm text-ink/70 active:bg-lime/30">
                评论
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 发布 */}
      <section className="mt-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink/70">
          <IconBottle width={16} height={16} /> 发布我的漂流瓶
        </div>
        <textarea
          value={publishContent}
          onChange={(e) => setPublishContent(e.target.value)}
          placeholder="写下一段此刻想说的话，匿名地放进海里…"
          rows={3}
          maxLength={500}
          className="w-full resize-none rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss"
        />
        <div className="mt-2">
          <EmotionPicker selected={publishTags} onChange={setPublishTags} />
        </div>
        <button
          onClick={publish}
          disabled={publishing || !publishContent.trim()}
          className="mt-3 w-full rounded-2xl bg-moss py-3.5 font-medium text-white active:bg-leaf disabled:opacity-50"
        >
          {publishing ? '发布中…' : '放入大海'}
        </button>
      </section>
    </div>
  )
}
