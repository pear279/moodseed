import { useState } from 'react'
import { Button } from '@/components/ui'

interface Props {
  referenceVisible: boolean
  onToggleReference: () => void
  onOrganize: () => void
  onReshuffle: () => void
}

export function PuzzleToolbar({ referenceVisible, onToggleReference, onOrganize, onReshuffle }: Props) {
  const [confirmReshuffle, setConfirmReshuffle] = useState(false)

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={onToggleReference} variant="secondary" size="sm" className="flex-1">
          {referenceVisible ? '关闭原图' : '显示原图'}
        </Button>
        <Button onClick={onOrganize} variant="secondary" size="sm" className="flex-1">
          整理碎片
        </Button>
        <Button onClick={() => setConfirmReshuffle(true)} variant="secondary" size="sm" className="flex-1">
          重新打乱
        </Button>
      </div>

      {confirmReshuffle && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-8 backdrop-blur-sm">
          <div className="w-full max-w-xs animate-pop-in rounded-3xl bg-cream p-6 text-center shadow-glow">
            <h2 className="text-lg font-semibold">重新打乱？</h2>
            <p className="mt-1 text-sm text-ink/60">已拼好的部分会被拆散，收藏进度不受影响。</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => setConfirmReshuffle(false)} variant="secondary" className="flex-1">
                取消
              </Button>
              <Button
                onClick={() => {
                  setConfirmReshuffle(false)
                  onReshuffle()
                }}
                className="flex-1"
              >
                确认
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
