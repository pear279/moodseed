import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { REWARDS } from '../lib/constants'
import type { Plant, PlantProgress, ProgressOverview } from '../lib/types'
import { PuzzleGrid } from '../components/PuzzleGrid'
import { IconBottle, IconLock } from '../components/icons'

const COLLECTED_KEY = 'moodseed_collected_plants'

function getCollected(): string[] {
  try {
    return JSON.parse(localStorage.getItem(COLLECTED_KEY) || '[]')
  } catch {
    return []
  }
}

type View =
  | { kind: 'completed'; plant: Plant; progress: PlantProgress }
  | { kind: 'current'; plant: Plant; progress: PlantProgress }
  | { kind: 'locked'; plant: Plant }

export default function PuzzlePage() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [data, setData] = useState<ProgressOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [celebrate, setCelebrate] = useState<Plant | null>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const res = await api.progress(user.id)
    setData(res)
    // 找到尚未「收下」的已完成植物，触发庆祝
    const collected = getCollected()
    const uncollected = res.progress.filter(
      (p) => p.status === 'completed' && !collected.includes(p.plant_id),
    )
    if (uncollected.length > 0) {
      const plant = res.plants.find((pl) => pl.id === uncollected[uncollected.length - 1].plant_id)
      if (plant) setCelebrate(plant)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const views = useMemo<View[]>(() => {
    if (!data) return []
    const prog = new Map(data.progress.map((p) => [p.plant_id, p]))

    const ordered = [...data.plants].sort((a, b) => a.order - b.order)
    const completed = ordered.filter((p) => prog.get(p.id)?.status === 'completed')
    const currentPlant = ordered.find((p) => {
      const st = prog.get(p.id)?.status
      return st !== 'completed'
    })
    const nextIdx = currentPlant ? ordered.indexOf(currentPlant) + 1 : -1
    const nextPlant = nextIdx >= 0 && nextIdx < ordered.length ? ordered[nextIdx] : null

    const arr: View[] = completed.map((p) => ({
      kind: 'completed',
      plant: p,
      progress: prog.get(p.id)!,
    }))
    if (currentPlant) {
      arr.push({ kind: 'current', plant: currentPlant, progress: prog.get(currentPlant.id)! })
    }
    if (nextPlant) {
      arr.push({ kind: 'locked', plant: nextPlant })
    }
    return arr
  }, [data])

  useEffect(() => {
    // 默认定位到「当前植物」
    const cur = views.findIndex((v) => v.kind === 'current')
    if (cur >= 0) setIndex(cur)
  }, [views.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) setIndex((i) => Math.min(i + 1, views.length - 1))
    else setIndex((i) => Math.max(i - 1, 0))
  }

  const collect = () => {
    if (celebrate) {
      const collected = getCollected()
      collected.push(celebrate.id)
      localStorage.setItem(COLLECTED_KEY, JSON.stringify([...new Set(collected)]))
    }
    setCelebrate(null)
    load()
  }

  if (loading) {
    return (
      <div className="grid h-[100dvh] place-items-center">
        <div className="animate-float text-3xl">🌱</div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] flex-col pt-6">
      <header className="px-5">
        <h1 className="text-xl font-semibold">拼图</h1>
        <p className="mt-0.5 text-xs text-ink/40">每记录一次，植物就恢复一点生命。</p>
      </header>

      <div className="relative mt-4 flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300"
          style={{ transform: `translateX(-${index * 100}%)` }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {views.map((v) => (
            <div key={v.plant.id} className="h-full w-full shrink-0 px-5 pb-4">
              <PlantView view={v} />
            </div>
          ))}
        </div>
      </div>

      {/* 左右滑动提示 */}
      <div className="flex items-center justify-center gap-3 pb-3 text-xs text-ink/30">
        <span>← 已完成的植物</span>
        <span className="h-1 w-1 rounded-full bg-ink/20" />
        <span>下一株 →</span>
      </div>

      {/* 漂流瓶入口 */}
      <div className="px-5 pb-5">
        <button
          onClick={() => navigate('/bottle')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sand py-3.5 text-sm font-medium text-ink/70 active:bg-lime/30"
        >
          <IconBottle width={18} height={18} /> 看看同一株植物的匿名漂流瓶
        </button>
      </div>

      {/* 完整解锁庆祝 */}
      {celebrate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-8 backdrop-blur-sm">
          <div className="w-full max-w-xs animate-pop-in rounded-3xl bg-cream p-6 text-center shadow-glow">
            <div className="mx-auto text-4xl">✨</div>
            <h2 className="mt-3 text-lg font-semibold">植物完整复苏！</h2>
            <p className="mt-1 text-sm text-ink/60">你已点亮 {celebrate.name} 的全部 48 块拼图。</p>

            {/* 植物卡片（简单翻转动画） */}
            <div className="mx-auto mt-5 aspect-[3/4] w-40 [perspective:800px]">
              <div className="animate-[float_3s_ease-in-out_infinite] relative h-full w-full [transform-style:preserve-3d]">
                <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-lift [backface-visibility:hidden]">
                  <img src={celebrate.image} alt={celebrate.name} className="h-full w-full object-cover" />
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm font-medium text-leaf">{celebrate.keyword}</div>
            <p className="mt-1 text-sm text-ink/70">「{celebrate.phrase}」</p>

            <button
              onClick={collect}
              className="mt-6 w-full rounded-2xl bg-moss py-3.5 font-medium text-white active:bg-leaf"
            >
              收下
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PlantView({ view }: { view: View }) {
  if (view.kind === 'locked') {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="relative w-full max-w-[280px]">
          <img src={view.plant.image} alt="" className="w-full grayscale opacity-40" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-ink/50 px-6 py-4 text-white backdrop-blur">
              <IconLock width={22} height={22} />
              <span className="text-sm">待解锁</span>
              <span className="text-lg font-semibold">{view.plant.name}</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink/40">完成上一株植物后即可解锁</p>
      </div>
    )
  }

  if (view.kind === 'completed') {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="w-full max-w-[280px] overflow-hidden rounded-3xl bg-white shadow-card">
          <img src={view.plant.image} alt={view.plant.name} className="aspect-[3/4] w-full object-cover" />
          <div className="p-4 text-center">
            <div className="text-lg font-semibold">{view.plant.name}</div>
            <div className="mt-1 text-sm font-medium text-leaf">{view.plant.keyword}</div>
            <p className="mt-2 text-sm text-ink/60">「{view.plant.phrase}」</p>
            <div className="mt-3 text-xs text-ink/40">
              已完成 · {view.progress.completed_at?.slice(0, 10)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // current
  const count = view.progress.unlocked_count
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-lg font-semibold">{view.plant.name}</div>
          <div className="text-sm text-leaf">{view.plant.keyword}</div>
        </div>
        <div className="text-sm text-ink/50">
          {count} / {REWARDS.piecesPerPlant}
        </div>
      </div>

      <div className="flex-1">
        <PuzzleGrid image={view.plant.image} positions={view.progress.positions} />
      </div>

      <p className="mt-3 text-center text-sm text-ink/60">「{view.plant.phrase}」</p>
    </div>
  )
}
