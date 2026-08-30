import type { LuckyCard } from '../lib/types'
import { IconClose } from './icons'

export function LuckyCardModal({ card, onClose }: { card: LuckyCard | null; onClose: () => void }) {
  if (!card) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-pop-in overflow-hidden rounded-3xl bg-cream shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative px-6 pb-6 pt-5"
          style={{ background: `linear-gradient(160deg, ${card.color.hex}33, transparent 70%)` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-ink/50">今日幸运卡</div>
              <div className="mt-0.5 text-lg font-semibold">✨ {card.date}</div>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-ink/50 active:bg-ink/5"
              aria-label="关闭"
            >
              <IconClose width={18} height={18} />
            </button>
          </div>

          <p className="mt-6 text-center text-lg font-medium leading-relaxed text-ink">
            「{card.phrase}」
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/70 p-4">
              <div className="text-xs font-medium text-leaf">宜</div>
              <ul className="mt-2 space-y-1 text-sm text-ink/80">
                {(card.yi.length ? card.yi : ['慢一点', '休息一下']).map((x) => (
                  <li key={x}>· {x}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <div className="text-xs font-medium text-[#C9886B]">忌</div>
              <ul className="mt-2 space-y-1 text-sm text-ink/80">
                {(card.ji.length ? card.ji : ['熬夜', '冲动决定']).map((x) => (
                  <li key={x}>· {x}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3">
            <span
              className="h-5 w-5 rounded-full ring-1 ring-ink/10"
              style={{ background: card.color.hex }}
            />
            <span className="text-sm text-ink/70">今日幸运色</span>
            <span className="ml-auto text-sm font-medium" style={{ color: card.color.hex }}>
              {card.color.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
