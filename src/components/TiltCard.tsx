import { useRef, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  max?: number
  className?: string
}

/**
 * 轻量 3D 卡片倾斜视差：指针/手指跟随产生轻微 rotateX/rotateY。
 * 用 CSS 3D transform 实现（替代 Three.js），保持前端轻量。
 */
export function TiltCard({ children, max = 6, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [t, setT] = useState({ rx: 0, ry: 0 })

  const setFromPoint = (clientX: number, clientY: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (clientX - rect.left) / rect.width - 0.5
    const py = (clientY - rect.top) / rect.height - 0.5
    setT({ rx: -py * max * 2, ry: px * max * 2 })
  }
  const reset = () => setT({ rx: 0, ry: 0 })

  return (
    <div style={{ perspective: 900 }}>
      <div
        ref={ref}
        className={className}
        style={{
          transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
          transition: 'transform 0.18s ease-out',
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={(e) => setFromPoint(e.clientX, e.clientY)}
        onMouseLeave={reset}
        onTouchMove={(e) => {
          const tch = e.touches[0]
          if (tch) setFromPoint(tch.clientX, tch.clientY)
        }}
        onTouchEnd={reset}
      >
        {children}
      </div>
    </div>
  )
}
