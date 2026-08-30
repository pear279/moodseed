import { useState } from 'react'
import emotions from '../../data/emotions.json'
import { IconPlus } from './icons'

interface Props {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function EmotionPicker({ selected, onChange }: Props) {
  const [custom, setCustom] = useState('')

  const toggle = (name: string) => {
    if (selected.includes(name)) onChange(selected.filter((t) => t !== name))
    else onChange([...selected, name])
  }

  const addCustom = () => {
    const v = custom.trim()
    if (!v) return
    if (!selected.includes(v)) onChange([...selected, v])
    setCustom('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {emotions.map((e) => {
          const active = selected.includes(e.name)
          return (
            <button
              key={e.id}
              onClick={() => toggle(e.name)}
              className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                active
                  ? 'border-moss bg-moss text-white'
                  : 'border-ink/10 bg-white text-ink/70 active:bg-lime/30'
              }`}
            >
              <span>{e.emoji}</span>
              {e.name}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          placeholder="自定义标签…"
          maxLength={8}
          className="w-32 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-moss"
        />
        <button
          onClick={addCustom}
          className="grid h-8 w-8 place-items-center rounded-full bg-lime/50 text-leaf active:bg-lime"
          aria-label="添加自定义标签"
        >
          <IconPlus width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
