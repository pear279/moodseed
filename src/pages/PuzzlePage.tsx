import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { REWARDS } from '../lib/constants'
import type { Plant, PlantProgress, ProgressOverview } from '../lib/types'
import { CollectionPuzzleBoard } from '../components/puzzle/CollectionPuzzleBoard'
import { Button, Loader, TiltCard } from '@/components/ui'
import { TextEffect } from '@/components/core'
import { getPuzzleThemeById } from '../lib/content/puzzles'
import { IconArrowLeft, IconArrowRight, IconBottle, IconLock } from '../components/icons'

const ALL_PIECES = Array.from({ length: REWARDS.piecesPerPlant }, (_, i) => i)

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
    if (dx < 0) setIndex((i) => Math.max(i - 1, 0))
    else setIndex((i) => Math.min(i + 1, views.length - 1))
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
      <div className="grid h-full place-items-center">
        <Loader variant="dots" size={40} className="text-moss" label="加载中" />
      </div>
    )
  }

  const currentView = views[index]
  const headerPlant = currentView?.plant ?? null
  const headerStatus =
    currentView && currentView.kind !== 'locked'
      ? `${currentView.progress.unlocked_count} / ${REWARDS.piecesPerPlant}`
      : ''

  return (
    <div className="flex h-full flex-col overflow-hidden px-5">
      {/* 顶部区块：标题 + 副标题 + 当前植物状态 + 进度 */}
      <header className="pb-4 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <TextEffect as="h1" preset="fade-in-blur" className="text-xl font-semibold">
              拼图
            </TextEffect>
            <p className="mt-1 text-xs text-ink/40">每记录一次，植物就恢复一点生命。</p>
          </div>
          <span className="pt-1 text-sm text-ink/50">{headerStatus}</span>
        </div>
        {headerPlant && (
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-semibold">{headerPlant.plant_name}</span>
            {currentView?.kind !== 'locked' && (
              <span className="text-sm text-leaf">{headerPlant.emotion_theme}</span>
            )}
          </div>
        )}
      </header>

      {/* 中部拼图区：拼图 + 左右箭头 + 金句/按钮 */}
      <div className="relative flex-1 overflow-hidden">
        {index > 0 && (
          <button
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            className="absolute left-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink/60 shadow-card backdrop-blur active:bg-lime/30"
            aria-label="上一个（已完成）"
          >
            <IconArrowLeft width={18} height={18} />
          </button>
        )}
        {index < views.length - 1 && (
          <button
            onClick={() => setIndex((i) => Math.min(i + 1, views.length - 1))}
            className="absolute right-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink/60 shadow-card backdrop-blur active:bg-lime/30"
            aria-label="下一个（待解锁）"
          >
            <IconArrowRight width={18} height={18} />
          </button>
        )}
        <div
          className="flex h-full transition-transform duration-300"
          style={{ transform: `translateX(-${index * 100}%)` }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {views.map((v) => (
            <div key={v.plant.id} className="h-full w-full shrink-0">
              <PlantView view={v} onPlay={(plant) => navigate(`/play/${plant.id}`)} />
            </div>
          ))}
        </div>
      </div>

      {/* 底部操作区：切换提示 + 漂流瓶入口 */}
      <div className="mt-auto pb-6">
        <div className="flex items-center justify-center gap-3 text-xs text-ink/30">
          <span>← 已完成</span>
          <span className="h-1 w-1 rounded-full bg-ink/20" />
          <span>下一株 →</span>
        </div>
        <button
          onClick={() => navigate('/bottle')}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-sand py-2.5 text-sm font-medium text-ink/70 active:bg-lime/30"
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
            <p className="mt-1 text-sm text-ink/60">你已点亮 {celebrate.plant_name} 的全部 {REWARDS.piecesPerPlant} 块拼图。</p>

            {/* 完整拼图（SVG ClipPath，2D 呈现） */}
            <div className="mx-auto mt-5 h-52 w-full">
              <CollectionPuzzleBoard
                theme={getPuzzleThemeById(celebrate.id)!}
                unlockedIds={new Set(ALL_PIECES)}
                className="h-full w-full"
              />
            </div>

            <div className="mt-4 text-sm font-medium text-leaf">{celebrate.emotion_theme}</div>
            <p className="mt-1 text-sm text-ink/70">「{celebrate.quote}」</p>

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

function PlantView({ view, onPlay }: { view: View; onPlay: (plant: Plant) => void }) {
  if (view.kind === 'locked') {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="relative w-full max-w-[280px]">
          <img src={view.plant.image_path} alt="" className="w-full grayscale opacity-40" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-ink/50 px-6 py-4 text-white backdrop-blur">
              <IconLock width={22} height={22} />
              <span className="text-sm">待解锁</span>
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
        <TiltCard className="w-full max-w-[240px] bg-white shadow-card">
          <img src={view.plant.image_path} alt={view.plant.plant_name} className="aspect-[3/4] w-full object-cover" />
          <div className="p-3 text-center">
            <p className="text-sm text-ink/60">「{view.plant.quote}」</p>
            <div className="mt-2 text-xs text-ink/40">
              已完成 · {view.progress.completed_at?.slice(0, 10)}
            </div>
          </div>
        </TiltCard>

        <Button onClick={() => onPlay(view.plant)} className="mt-3 w-full max-w-[240px]">
          玩拼图
        </Button>
      </div>
    )
  }

  // current
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full">
        <div className="aspect-square w-full">
          <CollectionPuzzleBoard
            theme={getPuzzleThemeById(view.plant.id)!}
            unlockedIds={new Set(view.progress.positions)}
            className="h-full w-full"
          />
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-ink/60">「{view.plant.quote}」</p>

      <button
        disabled
        className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-sand py-2.5 text-sm font-medium text-stone/70"
      >
        <IconLock width={16} height={16} />
        待解锁
      </button>
    </div>
  )
}
