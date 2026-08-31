import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { REWARDS, TIMEZONE, todayStr } from '../lib/constants'
import { zodiacOf } from '../lib/zodiac'
import type { DayActivity, UserStats } from '../lib/types'
import { IconClose } from '../components/icons'

const MBTI = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']

function dateKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, updateUser } = useApp()
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [birthday, setBirthday] = useState(user?.birthday ?? '')
  const [mbti, setMbti] = useState(user?.mbti ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await updateUser({ nickname: nickname.trim(), birthday: birthday || null, mbti: mbti || null })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md animate-slide-up rounded-t-3xl bg-cream p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">编辑资料</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-ink/50" aria-label="关闭">
            <IconClose width={18} height={18} />
          </button>
        </div>

        <label className="mb-2 block text-sm text-ink/60">昵称</label>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={12}
          className="mb-4 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />

        <label className="mb-2 block text-sm text-ink/60">生日（选填，自动生成星座）</label>
        <input type="date" value={birthday} max={todayStr()} onChange={(e) => setBirthday(e.target.value)}
          className="mb-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none focus:border-moss" />
        {birthday && <div className="mb-4 mt-1 text-xs text-leaf">✨ 星座：{zodiacOf(birthday)}</div>}

        <label className="mb-2 block text-sm text-ink/60">MBTI（选填）</label>
        <div className="mb-6 grid grid-cols-4 gap-2">
          {MBTI.map((m) => (
            <button key={m} onClick={() => setMbti(m)}
              className={`rounded-lg border py-1.5 text-xs ${mbti === m ? 'border-moss bg-moss text-white' : 'border-ink/10 bg-white text-ink/60'}`}>
              {m}
            </button>
          ))}
        </div>

        <button onClick={save} disabled={saving}
          className="w-full rounded-2xl bg-moss py-3.5 font-medium text-white active:bg-leaf disabled:opacity-50">
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
    </div>
  )
}

export default function MePage() {
  const { user, refreshUser } = useApp()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [activity, setActivity] = useState<DayActivity[]>([])
  const [monthView, setMonthView] = useState(false)
  const [editing, setEditing] = useState(false)
  const [exchanging, setExchanging] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    const res = await api.getUser(user.id)
    setStats(res.stats)
    setActivity(res.activity)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const activityMap = useMemo(() => {
    const m = new Map<string, number>()
    activity.forEach((a) => m.set(a.date, a.pieces))
    return m
  }, [activity])

  const days = useMemo(() => {
    const now = new Date()
    const arr: { key: string; day: number; inMonth: boolean }[] = []
    if (!monthView) {
      // 周视图：本周一至周日
      const dow = (now.getDay() + 6) % 7 // 0=周一
      const monday = new Date(now)
      monday.setDate(now.getDate() - dow)
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        arr.push({ key: dateKey(d), day: d.getDate(), inMonth: true })
      }
    } else {
      // 月视图
      const y = now.getFullYear()
      const m = now.getMonth()
      const first = new Date(y, m, 1)
      const startDow = (first.getDay() + 6) % 7
      const start = new Date(first)
      start.setDate(1 - startDow)
      for (let i = 0; i < 42; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        arr.push({ key: dateKey(d), day: d.getDate(), inMonth: d.getMonth() === m })
      }
    }
    return arr
  }, [monthView])

  const doExchange = async () => {
    if (!user) return
    setExchanging(true)
    try {
      const res = await api.exchange(user.id)
      await refreshUser()
      await load()
      setToast(`已兑换 1 块碎片，当前植物恢复到 ${res.unlockedCount}/${REWARDS.piecesPerPlant}`)
      setTimeout(() => setToast(''), 2600)
    } finally {
      setExchanging(false)
    }
  }

  const canExchange = (user?.points ?? 0) >= REWARDS.pointsPerPiece

  return (
    <div className="px-5 pb-24 pt-6">
      {/* 个人信息 */}
      <section className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-lime/40 text-2xl">🌿</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold">{user?.nickname}</div>
          <div className="mt-0.5 text-xs text-ink/50">
            {user?.birthday ? `${zodiacOf(user.birthday)}${user.mbti ? ' · ' + user.mbti : ''}` : user?.mbti || '还未填写生日与 MBTI'}
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="rounded-full bg-sand px-4 py-1.5 text-sm text-ink/70 active:bg-lime/30">
          编辑
        </button>
      </section>

      {/* 核心数据（扁平化，弱化卡片感） */}
      <section className="mt-4 grid grid-cols-3 gap-2.5">
        {[
          { label: '连续记录', value: stats?.streak_days ?? 0, unit: '天' },
          { label: '累计记录', value: stats?.total_days ?? 0, unit: '天' },
          { label: '已解锁植物', value: stats?.plants_unlocked ?? 0, unit: '株' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/70 p-3.5 text-center">
            <div className="text-2xl font-semibold text-moss">
              {s.value}
              <span className="ml-0.5 text-xs text-ink/40">{s.unit}</span>
            </div>
            <div className="mt-1 text-xs text-ink/50">{s.label}</div>
          </div>
        ))}
      </section>

      {/* 积分（浅色卡，降低视觉权重） */}
      <section className="mt-4 rounded-3xl bg-[#F5E9DC] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-ink/50">当前积分</div>
            <div className="mt-0.5 text-2xl font-semibold text-[#C9886B]">{user?.points ?? 0}</div>
          </div>
          <div className="text-right text-xs text-ink/55">
            <div>{REWARDS.pointsPerPiece} 积分 = 1 块拼图碎片</div>
            <div className="mt-1">
              {canExchange
                ? '已可兑换'
                : `还差 ${REWARDS.pointsPerPiece - (user?.points ?? 0)} 积分可兑换`}
            </div>
          </div>
        </div>
      </section>

      {/* 积分兑换：仅积分 ≥21 时显示 */}
      {canExchange && (
        <button
          onClick={doExchange}
          disabled={exchanging}
          className="mt-3 w-full rounded-2xl bg-moss py-3 font-medium text-white active:bg-leaf disabled:opacity-40"
        >
          {exchanging ? '兑换中…' : `兑换 1 块拼图碎片（${REWARDS.pointsPerPiece} 积分）`}
        </button>
      )}

      {/* 记录日历 */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">记录日历</h2>
          <button onClick={() => setMonthView((v) => !v)} className="text-sm text-moss active:opacity-60">
            {monthView ? '收起为周视图' : '展开月视图'}
          </button>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-card">
          <div className="grid grid-cols-7 text-center text-xs text-ink/40">
            {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
              <div key={w} className="py-1">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((d) => {
              const pieces = activityMap.get(d.key) ?? 0
              const has = pieces > 0
              return (
                <div key={d.key} className={`flex flex-col items-center py-1 ${d.inMonth ? '' : 'opacity-30'}`}>
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-sm ${
                      has ? 'bg-moss text-white' : d.key === todayStr() ? 'bg-lime/40 text-leaf' : 'text-ink/60'
                    }`}
                  >
                    {d.day}
                  </span>
                  <span className="mt-0.5 flex h-3 gap-0.5">
                    {Array.from({ length: Math.min(pieces, 3) }).map((_, i) => (
                      <span key={i} className="inline-block h-2 w-2 rounded-[2px] bg-sprout" />
                    ))}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lift">
          {toast}
        </div>
      )}

      {editing && <ProfileModal onClose={() => setEditing(false)} />}
    </div>
  )
}
