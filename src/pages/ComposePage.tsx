import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api, type CreateRecordResponse } from '../lib/api'
import { REWARDS, todayStr } from '../lib/constants'
import { formatDateCN } from '../lib/format'
import type { AiAnalysis } from '../lib/types'
import { EmotionPicker } from '../components/EmotionPicker'
import { IconArrowLeft, IconClose, IconImage, IconSparkle } from '../components/icons'

// 5 级心情脸主轴（对应一个代表性情绪标签，快选）
const MOODS = [
  { emoji: '😞', label: '很糟', tag: '难过' },
  { emoji: '😕', label: '不太好', tag: '疲惫' },
  { emoji: '😐', label: '一般', tag: '平静' },
  { emoji: '🙂', label: '不错', tag: '满足' },
  { emoji: '😄', label: '很好', tag: '开心' },
]

interface ImageEntry {
  id: string
  file?: File
  localUrl: string
  serverUrl?: string
  status: 'uploading' | 'done' | 'error'
}

let seq = 0
const nextId = () => `img-${Date.now()}-${seq++}`

export default function ComposePage() {
  const { id } = useParams()
  const isEdit = !!id
  const { user, refreshUser } = useApp()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [analyze, setAnalyze] = useState(true)
  const [images, setImages] = useState<ImageEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CreateRecordResponse | null>(null)
  const [ai, setAi] = useState<AiAnalysis | null>(null)
  const [aiFailed, setAiFailed] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(isEdit)

  // 编辑模式：载入已有记录
  useEffect(() => {
    if (!isEdit || !id) {
      setLoadingExisting(false)
      return
    }
    api
      .getRecord(id)
      .then((r) => {
        setTitle(r.title ?? '')
        setContent(r.content)
        setTags(r.emotion_tags)
        setImages(
          r.images.map((url, i) => ({ id: `ex-${i}`, localUrl: url, serverUrl: url, status: 'done' as const })),
        )
        setLoadingExisting(false)
      })
      .catch(() => {
        setError('加载失败，请返回重试')
        setLoadingExisting(false)
      })
  }, [id, isEdit])

  const uploadEntry = async (entry: ImageEntry) => {
    try {
      const url = await api.uploadImage(entry.file!)
      setImages((prev) => prev.map((e) => (e.id === entry.id ? { ...e, serverUrl: url, status: 'done' } : e)))
    } catch {
      setImages((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: 'error' } : e)))
    }
  }

  const pickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 6 - images.length)
    for (const file of files) {
      const entry: ImageEntry = { id: nextId(), file, localUrl: URL.createObjectURL(file), status: 'uploading' }
      setImages((prev) => [...prev, entry])
      uploadEntry(entry)
    }
    e.target.value = ''
  }

  const removeImage = (id: string) => setImages((prev) => prev.filter((e) => e.id !== id))
  const retryImage = (entry: ImageEntry) => {
    setImages((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: 'uploading' } : e)))
    uploadEntry({ ...entry, status: 'uploading' })
  }

  const uploading = images.some((e) => e.status === 'uploading')
  const doneImages = images.filter((e) => e.status === 'done').map((e) => e.serverUrl!)
  const canSubmit = (content.trim().length > 0 || doneImages.length > 0) && !uploading && !submitting

  const submit = async () => {
    if (!user) return
    if (!content.trim() && doneImages.length === 0) {
      setError('至少写一点内容或添加图片')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (isEdit && id) {
        await api.updateRecord(id, {
          title: title.trim() || undefined,
          content: content.trim(),
          emotionTags: tags,
          images: doneImages,
          analyze,
        })
        navigate('/record', { replace: true })
      } else {
        const res = await api.createRecord({
          userId: user.id,
          title: title.trim() || undefined,
          content: content.trim(),
          emotionTags: tags,
          images: doneImages,
          analyze,
        })
        setResult(res)
        await refreshUser()
      }
    } catch {
      setError('保存失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 创建成功后轮询 AI 分析结果
  useEffect(() => {
    if (!result) return
    let tries = 0
    const timer = setInterval(async () => {
      tries++
      try {
        const r = await api.getRecord(result.record.id)
        if (r.ai_status === 'done' && r.ai_summary) {
          setAi({ emotion_tags: r.ai_emotion_tags ?? [], summary: r.ai_summary, reason: r.ai_reason ?? '', suggestion: r.ai_suggestion ?? '' })
          clearInterval(timer)
        } else if (r.ai_status === 'failed') {
          setAiFailed(true)
          clearInterval(timer)
        }
      } catch {
        /* 网络波动继续重试 */
      }
      if (tries >= 10) clearInterval(timer)
    }, 1500)
    return () => clearInterval(timer)
  }, [result])

  // —— 结果视图（仅新增） ——
  if (result) {
    const a = ai
    return (
      <div className="flex min-h-[100dvh] flex-col px-5 pb-10 pt-6">
        <header className="flex items-center gap-3">
          <div className="text-2xl">🌱</div>
          <div>
            <h1 className="text-xl font-semibold">记录完成</h1>
            <p className="text-sm text-ink/50">谢谢你认真对待自己的情绪。</p>
          </div>
        </header>

        <div
          className={`mt-5 rounded-3xl p-4 text-center text-white shadow-card ${
            result.pieceAwarded ? 'bg-gradient-to-br from-moss to-leaf' : 'bg-stone'
          }`}
        >
          {result.pieceAwarded ? (
            <div className="animate-pop-in">
              <div className="text-lg font-semibold">🌱 获得 {result.pieceAwarded} 块拼图碎片</div>
              <div className="mt-1 text-sm text-white/80">
                当前植物已恢复 {result.unlockedCount} / {REWARDS.piecesPerPlant} 块
              </div>
            </div>
          ) : (
            <div className="text-sm">今天的 {REWARDS.dailyRecordPieceCap} 块成长碎片已经收集完成 🌱</div>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-moss">
            <IconSparkle width={16} height={16} /> AI 情绪理解
          </div>

          {!a && !aiFailed && (
            <div className="flex items-center gap-2 rounded-2xl bg-sand/60 p-4 text-sm text-ink/50">
              <span className="h-2 w-2 animate-pulse rounded-full bg-moss" /> AI 正在理解你的情绪…
            </div>
          )}

          {aiFailed && (
            <div className="rounded-2xl bg-sand/60 p-4 text-sm text-ink/50">
              情绪分析暂时不可用，记录已保存。可稍后在记录中重试。
            </div>
          )}

          {a && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {a.emotion_tags.map((t) => (
                  <span key={t} className="rounded-full bg-moss px-3 py-1 text-sm text-white">
                    {t}
                  </span>
                ))}
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <div className="text-xs font-medium text-ink/50">一句话总结</div>
                <p className="mt-1 text-ink/80">{a.summary}</p>
              </div>
              {a.reason && (
                <div className="rounded-2xl bg-sand/60 p-4">
                  <div className="text-xs font-medium text-ink/50">情绪原因</div>
                  <p className="mt-1 text-ink/75">{a.reason}</p>
                </div>
              )}
              {a.suggestion && (
                <div className="rounded-2xl bg-lime/30 p-4">
                  <div className="text-xs font-medium text-leaf">调整建议</div>
                  <p className="mt-1 text-ink/75">{a.suggestion}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-auto pt-6">
          <button
            onClick={() => navigate('/record', { replace: true })}
            className="w-full rounded-2xl bg-moss py-4 font-medium text-white active:bg-leaf"
          >
            完成
          </button>
        </div>
      </div>
    )
  }

  // —— 编辑 / 表单视图 ——
  return (
    <div className="flex min-h-[100dvh] flex-col pb-20 pt-6">
      {/* 顶部栏：返回 / 日期 / 完成 */}
      <header className="flex items-center justify-between px-5">
        <button
          onClick={() => navigate(-1)}
          className="grid h-9 w-9 place-items-center rounded-full text-ink/60 active:bg-ink/5"
          aria-label="返回"
        >
          <IconArrowLeft width={22} height={22} />
        </button>
        <div className="text-sm text-ink/60">{formatDateCN(todayStr())}</div>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="rounded-full bg-moss px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40 active:bg-leaf"
        >
          {submitting ? '提交中…' : '完成'}
        </button>
      </header>

      {loadingExisting ? (
        <div className="grid flex-1 place-items-center">
          <div className="animate-float text-3xl">🌱</div>
        </div>
      ) : (
        <div className="mt-4 flex-1 space-y-4 px-5">
          {/* 图片区（多图，逐张删除/重试） */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                <img src={img.localUrl} alt="" className="h-full w-full object-cover" />
                {img.status === 'uploading' && (
                  <div className="absolute inset-0 grid place-items-center bg-ink/30">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
                {img.status === 'error' && (
                  <button onClick={() => retryImage(img)} className="absolute inset-0 grid place-items-center bg-ink/40 text-xs text-white">
                    重试
                  </button>
                )}
                {img.status !== 'uploading' && (
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/55 text-white"
                    aria-label="删除图片"
                  >
                    <IconClose width={14} height={14} />
                  </button>
                )}
              </div>
            ))}
            {images.length < 6 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="grid aspect-square w-24 shrink-0 place-items-center rounded-xl border border-dashed border-ink/15 text-ink/40 active:bg-ink/5"
              >
                <IconImage width={22} height={22} />
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={pickImages} />

          {/* 标题 */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题（选填）"
            maxLength={40}
            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3.5 text-base font-medium outline-none focus:border-moss"
          />

          {/* 正文 */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今天发生了什么？写下来，让 AI 帮你理解其中的情绪…"
            rows={7}
            className="w-full resize-none rounded-2xl border border-ink/10 bg-white px-4 py-3.5 leading-relaxed outline-none focus:border-moss"
          />

          {/* 心情脸（保留） */}
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map((m) => {
              const active = tags.includes(m.tag)
              return (
                <button
                  key={m.emoji}
                  onClick={() => setTags((t) => (t.includes(m.tag) ? t.filter((x) => x !== m.tag) : [...t, m.tag]))}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-all ${
                    active ? 'bg-moss text-white shadow-card' : 'bg-white text-ink/70 active:bg-lime/30'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs">{m.label}</span>
                </button>
              )
            })}
          </div>

          {/* 情绪标签（保留） */}
          <div>
            <div className="mb-2 text-sm text-ink/60">更细的情绪（可选）</div>
            <EmotionPicker selected={tags} onChange={setTags} />
          </div>

          {/* AI 开关（保留） */}
          <label className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-center gap-2">
              <IconSparkle width={18} height={18} className="text-moss" />
              <div>
                <div className="text-sm">让 AI 帮我理解情绪</div>
                <div className="text-xs text-ink/40">识别情绪、总结、原因与建议</div>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={analyze}
              onClick={() => setAnalyze((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${analyze ? 'bg-moss' : 'bg-ink/15'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${analyze ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>
        </div>
      )}

      {error && <div className="px-5 text-sm text-[#B86B5A]">{error}</div>}

      {/* 键盘上方工具区：只保留图片上传 */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/5 bg-cream/95 pb-safe backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-5 py-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-full bg-sand px-4 py-2 text-sm text-ink/70 active:bg-lime/30"
          >
            <IconImage width={18} height={18} /> 图片
          </button>
        </div>
      </div>
    </div>
  )
}
