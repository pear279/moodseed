import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { todayStr } from '../lib/constants'
import type { CheckinToday, RecordItem } from '../lib/types'
import { IconCheck, IconChevronDown, IconPlus, IconSparkle } from '../components/icons'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 13) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

function RecordCard({ record }: { record: RecordItem }) {
  const [open, setOpen] = useState(false)
  const tags = record.ai_emotion_tags?.length ? record.ai_emotion_tags : record.emotion_tags

  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-card">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-ink/40">{record.local_date ?? record.created_at.slice(0, 10)}</div>
            <div className="mt-1 truncate font-medium text-ink">
              {record.title || record.content.slice(0, 24)}
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="rounded-full bg-lime/40 px-2 py-0.5 text-xs text-leaf">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {record.ai_summary && (
              <p className="mt-2 line-clamp-2 text-sm text-ink/60">{record.ai_summary}</p>
            )}
          </div>
          <IconChevronDown
            width={18}
            height={18}
            className={`mt-1 shrink-0 text-ink/30 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-ink/5 pt-3 text-sm">
          {record.content && <p className="leading-relaxed text-ink/80">{record.content}</p>}
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
      const [today, list] = await Promise.all([
        api.todayCheckin(user.id),
        api.listRecords(user.id),
      ])
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

  return (
    <div className="px-5 pb-24 pt-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-sm text-ink/50">{greeting()}，{user?.nickname}</div>
          <h1 className="mt-1 text-xl font-semibold">今天过得怎么样？</h1>
        </div>
        <div className="text-xs text-ink/40">{todayStr()}</div>
      </header>

      {/* 签到卡片 */}
      <section className="mt-5 rounded-3xl bg-gradient-to-br from-moss to-leaf p-5 text-white shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/80">每日签到</div>
            <div className="mt-0.5 text-xs text-white/60">每天签到 +1 积分</div>
          </div>
          {checkin?.checked_in ? (
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm">
              <IconCheck width={16} height={16} /> 今日已打卡
            </div>
          ) : (
            <button
              onClick={doCheckin}
              disabled={checkingIn}
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-leaf active:bg-lime"
            >
              {checkingIn ? '签到中…' : '今日签到'}
            </button>
          )}
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs text-white/70">
          <IconSparkle width={14} height={14} /> 当前积分 {user?.points ?? 0}
        </div>
      </section>

      {/* 今日幸运卡（常驻卡片位，每日更新） */}
      {checkin?.lucky && (
        <section
          className={`mt-4 rounded-3xl bg-white p-5 shadow-card ${justChecked ? 'animate-pop-in' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">✨ 今日幸运卡</div>
            <div className="text-xs text-ink/40">{checkin.lucky.date}</div>
          </div>
          <p className="mt-3 text-center text-base font-medium leading-relaxed text-ink">
            「{checkin.lucky.phrase}」
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-sand/60 p-3">
              <div className="text-xs font-medium text-leaf">宜</div>
              <ul className="mt-1 space-y-0.5 text-xs text-ink/70">
                {(checkin.lucky.yi.length ? checkin.lucky.yi : ['慢一点', '休息一下']).map((x) => (
                  <li key={x}>· {x}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-sand/60 p-3">
              <div className="text-xs font-medium text-[#C9886B]">忌</div>
              <ul className="mt-1 space-y-0.5 text-xs text-ink/70">
                {(checkin.lucky.ji.length ? checkin.lucky.ji : ['熬夜', '冲动决定']).map((x) => (
                  <li key={x}>· {x}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-sand/40 px-3 py-2.5">
            <span
              className="h-4 w-4 rounded-full ring-1 ring-ink/10"
              style={{ background: checkin.lucky.color.hex }}
            />
            <span className="text-xs text-ink/60">今日幸运色</span>
            <span className="ml-auto text-sm font-medium" style={{ color: checkin.lucky.color.hex }}>
              {checkin.lucky.color.name}
            </span>
          </div>
        </section>
      )}

      {/* 添加记录 */}
      <button
        onClick={() => navigate('/compose')}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-moss/30 py-5 text-moss active:bg-lime/20"
      >
        <IconPlus width={22} height={22} />
        <span className="font-medium">记录今天的事</span>
      </button>

      {/* 历史记录 */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">历史记录</h2>
          <span className="text-xs text-ink/40">{records.length} 条</span>
        </div>

        {error && (
          <div className="rounded-2xl bg-[#F7C8CE]/30 p-4 text-sm text-[#B86B5A]">
            {error}
            <button onClick={load} className="ml-2 underline">重试</button>
          </div>
        )}

        {!error && loadingRecords && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-ink/5" />
            ))}
          </div>
        )}

        {!error && !loadingRecords && records.length === 0 && (
          <div className="rounded-3xl border border-dashed border-ink/10 py-12 text-center">
            <div className="text-3xl">🌿</div>
            <p className="mt-2 text-sm text-ink/50">还没有记录，写下今天第一件事吧。</p>
          </div>
        )}

        <div className="space-y-3">
          {records.map((r) => (
            <RecordCard key={r.id} record={r} />
          ))}
        </div>
      </section>
    </div>
  )
}
