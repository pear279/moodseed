import { useState } from 'react'
import { getEmotions } from '../lib/content/emotions'
import { IconChevronDown, IconPlus } from './icons'

interface Props {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function EmotionPicker({ selected, onChange }: Props) {
  const [custom, setCustom] = useState('')
  const [expanded, setExpanded] = useState(false)
  const emotions = getEmotions()
  // 已选中的自定义标签（不在预设情绪里的）
  const customTags = selected.filter((t) => !emotions.some((e) => e.name === t))

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
      {/* 细分情绪：默认单行横向滑动，点展开图标展示全部 */}
      <div className="flex items-center gap-2">
        <div className={`min-w-0 flex-1 ${expanded ? '' : 'overflow-x-auto no-scrollbar'}`}>
          <div className={`flex gap-2 ${expanded ? 'flex-wrap' : 'flex-nowrap'}`}>
            {emotions.map((e) => {
              const active = selected.includes(e.name)
              return (
                <button
                  key={e.id}
                  onClick={() => toggle(e.name)}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
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
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/10 bg-white text-ink/50 active:bg-lime/30"
          aria-label={expanded ? '收起全部' : '展开全部'}
        >
          <IconChevronDown
            width={16}
            height={16}
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* 已添加的自定义标签（可点击移除） */}
      {customTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {customTags.map((t) => (
            <button
              key={t}
              onClick={() => onChange(selected.filter((x) => x !== t))}
              className="flex items-center gap-1 rounded-full bg-moss px-3 py-1.5 text-sm text-white active:bg-leaf"
            >
              {t}
              <span className="text-xs opacity-70">✕</span>
            </button>
          ))}
        </div>
      )}

      {/* 自定义标签输入 */}
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
          className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
            custom.trim() ? 'bg-moss text-white active:bg-leaf' : 'bg-lime/50 text-leaf active:bg-lime'
          }`}
          aria-label="添加自定义标签"
        >
          <IconPlus width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
