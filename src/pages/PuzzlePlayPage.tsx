import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePuzzleGame } from '../hooks/puzzle/usePuzzleGame'
import { PuzzleCanvas } from '../components/puzzle/PuzzleCanvas'
import { PuzzleToolbar } from '../components/puzzle/PuzzleToolbar'
import { PuzzleComplete } from '../components/puzzle/PuzzleComplete'

export default function PuzzlePlayPage() {
  const { plantId } = useParams<{ plantId: string }>()
  const navigate = useNavigate()
  const { theme, game, move, front, drop, organize, reset } = usePuzzleGame(plantId ?? '')
  const [showReference, setShowReference] = useState(false)

  if (!theme || !game) {
    return (
      <div className="grid h-[100dvh] place-items-center text-sm text-ink/50">主题不存在</div>
    )
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="flex items-center justify-between px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl bg-sand px-3 py-1.5 text-sm text-ink/70 active:bg-lime/30"
        >
          ← 返回
        </button>
        <h1 className="text-base font-semibold">{theme.name}</h1>
        <div className="w-14" />
      </header>

      <div className="px-4 pt-2">
        <PuzzleToolbar
          referenceVisible={showReference}
          onToggleReference={() => setShowReference((v) => !v)}
          onOrganize={organize}
          onReshuffle={reset}
        />
      </div>

      <div className="flex-1 overflow-auto bg-[#e0e8de]">
        <PuzzleCanvas theme={theme} game={game} onMove={move} onFront={front} onDrop={drop} showReference={showReference} />
      </div>

      {game.status === 'completed' && (
        <PuzzleComplete theme={theme} onReplay={reset} onBack={() => navigate(-1)} />
      )}
    </div>
  )
}
