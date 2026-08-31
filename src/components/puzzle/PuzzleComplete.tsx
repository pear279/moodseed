import type { PuzzleTheme } from '../../types/puzzle'

interface Props {
  theme: PuzzleTheme
  onReplay: () => void
  onBack: () => void
}

export function PuzzleComplete({ theme, onReplay, onBack }: Props) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-8 backdrop-blur-sm">
      <div className="w-full max-w-xs animate-pop-in rounded-3xl bg-cream p-6 text-center shadow-glow">
        <div className="mx-auto text-4xl">🎉</div>
        <h2 className="mt-3 text-lg font-semibold">拼图完成啦</h2>
        <p className="mt-1 text-sm text-ink/60">{theme.name}已完整拼合。</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 rounded-2xl bg-sand py-3 font-medium text-ink/70 active:bg-lime/30"
          >
            返回
          </button>
          <button
            onClick={onReplay}
            className="flex-1 rounded-2xl bg-moss py-3 font-medium text-white active:bg-leaf"
          >
            再次拼图
          </button>
        </div>
      </div>
    </div>
  )
}
