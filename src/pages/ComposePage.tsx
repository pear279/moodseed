import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api, type CreateRecordResponse } from '../lib/api'
import { REWARDS } from '../lib/constants'
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

export default function ComposePage() {
  const { user, refreshUser } = useApp()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [analyze, setAnalyze] = useState(true)
  const [image, setImage] = useState<{ file: File; url: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CreateRecordResponse | null>(null)

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImage({ file: f, url: URL.createObjectURL(f) })
  }

  const submit = async () => {
    if (!user || !content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      let imageUrl: string | undefined
      if (image) imageUrl = await api.uploadImage(image.file)

      const res = await api.createRecord({
        userId: user.id,
        title: title.trim() || undefined,
        content: content.trim(),
        emotionTags: tags,
        imageUrl,
        analyze,
      })
      setResult(res)
      await refreshUser()
    } catch {
      setError('保存失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  // —— 结果视图 ——
  if (result) {
    const a = result.analysis
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

        {a && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-moss">
              <IconSparkle width={16} height={16} /> AI 情绪理解
            </div>
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
            <div className="rounded-2xl bg-sand/60 p-4">
              <div className="text-xs font-medium text-ink/50">情绪原因</div>
              <p className="mt-1 text-ink/75">{a.reason}</p>
            </div>
            <div className="rounded-2xl bg-lime/30 p-4">
              <div className="text-xs font-medium text-leaf">调整建议</div>
              <p className="mt-1 text-ink/75">{a.suggestion}</p>
            </div>
          </div>
        )}

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

  // —— 表单视图 ——
  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="grid h-9 w-9 place-items-center rounded-full text-ink/60 active:bg-ink/5"
          aria-label="返回"
        >
          <IconArrowLeft width={22} height={22} />
        </button>
        <h1 className="text-base font-semibold">记录今天的事</h1>
        <div className="w-9" />
      </header>

      <div className="mt-5 flex-1 space-y-5">
        {/* 图片 */}
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          {image ? (
            <div className="relative overflow-hidden rounded-2xl">
              <img src={image.url} alt="记录图片" className="max-h-56 w-full object-cover" />
              <button
                onClick={() => setImage(null)}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/50 text-white"
                aria-label="移除图片"
              >
                <IconClose width={16} height={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/15 py-6 text-sm text-ink/50 active:bg-ink/5"
            >
              <IconImage width={20} height={20} /> 添加图片（选填）
            </button>
          )}
        </div>

        {/* 标题 */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题（选填）"
          maxLength={40}
          className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3.5 outline-none focus:border-moss"
        />

        {/* 正文 */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="今天发生了什么？写下来，让 AI 帮你理解其中的情绪…"
          rows={6}
          className="w-full resize-none rounded-2xl border border-ink/10 bg-white px-4 py-3.5 outline-none focus:border-moss"
        />

        {/* 情绪标签 */}
        <div>
          <div className="mb-2 text-sm text-ink/60">此刻的心情</div>
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map((m) => {
              const active = tags.includes(m.tag)
              return (
                <button
                  key={m.emoji}
                  onClick={() =>
                    setTags((t) => (t.includes(m.tag) ? t.filter((x) => x !== m.tag) : [...t, m.tag]))
                  }
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
          <div className="mt-3 mb-2 text-sm text-ink/60">更细的情绪（可选）</div>
          <EmotionPicker selected={tags} onChange={setTags} />
        </div>

        {/* AI 分析开关 */}
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
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                analyze ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </label>
      </div>

      {error && <div className="mt-3 text-sm text-[#B86B5A]">{error}</div>}

      <button
        onClick={submit}
        disabled={submitting || !content.trim()}
        className="mt-6 w-full rounded-2xl bg-moss py-4 font-medium text-white disabled:opacity-50 active:bg-leaf"
      >
        {submitting ? '正在分析…' : '完成记录'}
      </button>
    </div>
  )
}
