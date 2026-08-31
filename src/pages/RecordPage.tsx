import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { todayStr } from '../lib/constants'
import { getFoodEmoji } from '../lib/content/fortune'
import { formatDateCN } from '../lib/format'
import type { CheckinToday, RecordItem } from '../lib/types'
import { ImageCollage } from '../components/ImageCollage'
import { Button } from '@/components/motion/button'
import { Spotlight, TextEffect } from '@/components/core'
import { IconCheck, IconChevronDown, IconPlus, IconSparkle } from '../components/icons'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 13) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

function RecordCard({
  record,
  onEdit,
  onDelete,
  onRetryAi,
}: {
  record: RecordItem
  onEdit: () => void
  onDelete: () => void
  onRetryAi: () => void
}) {
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const tags = record.ai_emotion_tags?.length ? record.ai_emotion_tags : record.emotion_tags

  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-card">
      {/* 图片拼贴 */}
      {record.images.length > 0 && <ImageCollage images={record.images} className="mb-3" />}

      {/* 标题（字重高于正文） */}
      {record.title && <div className="line-clamp-2 font-semibold text-ink">{record.title}</div>}

      {/* 正文摘要 / 一句话总结（2~4 行） */}
      {record.content && (
        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-ink/70">{record.content}</p>
      )}

      {/* 情绪标签 / AI 状态 */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {record.ai_status === 'done' && tags.length > 0 && (
          tags.map((t) => (
            <span key={t} className="rounded-full bg-lime/40 px-2 py-0.5 text-xs text-leaf">
              {t}
            </span>
          ))
        )}
        {record.ai_status === 'pending' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-xs text-ink/50">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-moss" /> AI 分析中…
          </span>
        )}
        {record.ai_status === 'failed' && (
          <button
            onClick={onRetryAi}
            className="rounded-full bg-sand/60 px-2 py-0.5 text-xs text-ink/50 active:bg-lime/30"
          >
            稍后生成情绪分析 · 重试
          </button>
        )}
      </div>

      {/* AI 一句话摘要（与正文区分：字号略小、浅灰绿、最多 2 行） */}
      {record.ai_status === 'done' && record.ai_summary && (
        <p className="mt-1.5 line-clamp-2 text-xs text-[#7A857A]">{record.ai_summary}</p>
      )}

      {/* 日期 / 更多 */}
      <div className="mt-3 flex items-center justify-between">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-xs text-ink/40">
          {formatDateCN(record.local_date ?? record.created_at.slice(0, 10))}
          <IconChevronDown
            width={14}
            height={14}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <div className="relative">
          <button
            onClick={() => setMenu((v) => !v)}
            className="px-2 text-sm font-medium text-ink/40 active:text-ink"
            aria-label="更多操作"
          >
            ⋯
          </button>
          {menu && (
            <div className="absolute bottom-6 right-0 z-20 w-24 overflow-hidden rounded-xl border border-ink/5 bg-white py-1 text-sm shadow-lift">
              <button onClick={() => { setMenu(false); onEdit() }} className="block w-full px-3 py-1.5 text-left text-ink/70 active:bg-sand">
                编辑
              </button>
              <button onClick={() => { setMenu(false); onDelete() }} className="block w-full px-3 py-1.5 text-left text-[#B86B5A] active:bg-sand">
                删除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 展开：完整正文 + AI 情绪原因/调整建议 */}
      {open && (
        <div className="mt-3 space-y-3 border-t border-ink/5 pt-3 text-sm">
          {record.ai_reason && (
            <div className="rounded-xl bg-sand/60 p-3">
              <div className="text-xs font-medium text-ink/50">情绪原因</div>
              <p className="mt-1 text-ink/75">{record.ai_reason}</p>
            </div>
          )}
          {record.ai_suggestion && (
            <div className="rounded-xl bg-lime/30 p-3">
              <div className="text-xs font-medium text-leaf">调整建议</div>
              <p className="mt-1 text-ink/75">{record.ai_suggestion}</p>
            </div>
          )}
          {!record.ai_reason && !record.ai_suggestion && record.ai_status === 'done' && (
            <p className="text-ink/50">暂无更多分析内容。</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function RecordPage() {
  const { user, refreshUser } = useApp()
  const navigate = useNavigate()
  const [checkin, setCheckin] = useState<CheckinToday | null>(null)
  const [records, setRecords] = useState<RecordItem[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [justChecked, setJustChecked] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setError('')
    try {
      const [today, list] = await Promise.all([api.todayCheckin(user.id), api.listRecords(user.id)])
      setCheckin(today)
      setRecords(list)
    } catch {
      setError('加载失败，请检查网络后重试')
    } finally {
      setLoadingRecords(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // AI 分析中：轻量轮询，直到没有 pending 记录
  useEffect(() => {
    if (records.some((r) => r.ai_status === 'pending')) {
      const t = setTimeout(() => load(), 1500)
      return () => clearTimeout(t)
    }
  }, [records, load])

  const doCheckin = async () => {
    if (!user) return
    setCheckingIn(true)
    try {
      const res = await api.checkin(user.id)
      setCheckin(res)
      setJustChecked(true)
      setTimeout(() => setJustChecked(false), 1200)
      await refreshUser()
    } finally {
      setCheckingIn(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除这条手记吗？')) return
    try {
      await api.deleteRecord(id)
      await load()
    } catch {
      setError('删除失败，请重试')
    }
  }

  const handleRetryAi = async (id: string) => {
    try {
      await api.analyzeRecord(id)
      await load()
    } catch {
      setError('分析失败，请稍后重试')
    }
  }

  return (
    <div className="px-5 pb-10 pt-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-sm text-ink/50">{greeting()}，{user?.nickname}</div>
          <TextEffect as="h1" preset="fade-in-blur" className="mt-1 text-xl font-semibold">
            记录
          </TextEffect>
        </div>
        <div className="text-xs text-ink/40">{todayStr()}</div>
      </header>

      {/* 签到卡片（单行） */}
      <section className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-moss to-leaf px-5 py-3.5 text-white shadow-card">
        <Spotlight className="-top-24 left-0" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconSparkle width={18} height={18} className="text-white/85" />
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold">每日签到</span>
              <span className="text-xs text-white/60">积分 {user?.points ?? 0}</span>
            </div>
          </div>
          {checkin?.checked_in ? (
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm">
              <IconCheck width={16} height={16} /> 已打卡
            </div>
          ) : (
            <button
              onClick={doCheckin}
              disabled={checkingIn}
              className="rounded-full bg-white px-5 py-1.5 text-sm font-medium text-leaf active:bg-lime"
            >
              {checkingIn ? '签到中…' : '今日签到'}
            </button>
          )}
        </div>
      </section>

      {/* 今日幸运卡（常驻卡片位，每日更新） */}
      {checkin?.lucky && (
        <section
          className={`mt-4 rounded-2xl bg-white p-3.5 shadow-card ${justChecked ? 'animate-pop-in' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">✨ 今日幸运卡</div>
            <div className="text-xs text-ink/40">{checkin.lucky.date}</div>
          </div>

          <div className="mt-2 grid grid-cols-3 divide-x divide-ink/5 rounded-2xl bg-sand/40 py-2 text-center">
            <div className="flex flex-col items-center justify-center gap-1 px-2">
              <span
                className="h-4 w-4 rounded-full ring-1 ring-ink/10"
                style={{ background: checkin.lucky.lucky_color.hex }}
              />
              <span className="text-xs font-medium" style={{ color: checkin.lucky.lucky_color.hex }}>
                {checkin.lucky.lucky_color.name}
              </span>
            </div>
            <div className="flex items-center justify-center text-sm font-semibold text-ink">
              {checkin.lucky.lucky_numbers.join('、')}
            </div>
            <div className="flex items-center justify-center gap-1 px-2 text-xs font-medium text-ink/80">
              <span>{getFoodEmoji(checkin.lucky.lucky_food)}</span>
              <span>{checkin.lucky.lucky_food}</span>
            </div>
          </div>

          <p className="mt-2 text-center text-sm font-medium leading-relaxed text-ink">
            {checkin.lucky.daily_message}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-sand/60 p-2">
              <div className="text-xs font-medium text-leaf">建议</div>
              <div className="mt-1 space-y-0.5 text-xs text-ink/70">
                {checkin.lucky.recommended.map((x) => (
                  <div key={x}>{x}</div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-sand/60 p-2">
              <div className="text-xs font-medium text-[#C9886B]">避免</div>
              <div className="mt-1 space-y-0.5 text-xs text-ink/70">
                {checkin.lucky.avoid.map((x) => (
                  <div key={x}>{x}</div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 添加记录入口 */}
      <Button onClick={() => navigate('/compose')} size="lg" className="mt-5 w-full">
        <IconPlus width={20} height={20} />
        添加记录
      </Button>

      {/* 历史手记 */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">手记</h2>
          <span className="text-xs text-ink/40">{records.length} 条</span>
        </div>

        {error && (
          <div className="rounded-2xl bg-[#F7C8CE]/30 p-4 text-sm text-[#B86B5A]">
            {error}
            <button onClick={load} className="ml-2 underline">重试</button>
          </div>
        )}

        {!error && loadingRecords && (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-ink/5" />
            ))}
          </div>
        )}

        {!error && !loadingRecords && records.length === 0 && (
          <div className="rounded-3xl border border-dashed border-ink/10 py-16 text-center">
            <div className="text-3xl">🌿</div>
            <p className="mt-3 text-sm text-ink/50">写下今天第一件小事吧。</p>
          </div>
        )}

        <div className="space-y-4">
          {records.map((r) => (
            <RecordCard
              key={r.id}
              record={r}
              onEdit={() => navigate(`/compose/${r.id}`)}
              onDelete={() => handleDelete(r.id)}
              onRetryAi={() => handleRetryAi(r.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
