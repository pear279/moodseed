import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { getBuddyAvatar, getUserAvatar } from '../lib/avatar'
import { IconArrowLeft, IconSend } from '../components/icons'

type Msg = { role: 'user' | 'assistant'; content: string }

const HISTORY_KEY = 'moodseed_chat_history_v1'
const MAX_HISTORY = 40

function loadHistory(): Msg[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    if (Array.isArray(raw)) {
      return (raw as Msg[])
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-MAX_HISTORY)
    }
  } catch {
    /* ignore */
  }
  return []
}

function saveHistory(msgs: Msg[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-MAX_HISTORY)))
  } catch {
    /* ignore */
  }
}

export default function ChatPage() {
  const navigate = useNavigate()
  const { user } = useApp()
  const [messages, setMessages] = useState<Msg[]>(loadHistory)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const buddyAvatar = getBuddyAvatar()
  const userAvatar = getUserAvatar()

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setError('')
    const next: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const { reply } = await api.chat(next.map((m) => ({ role: m.role, content: m.content })))
      const done: Msg[] = [...next, { role: 'assistant', content: reply }]
      setMessages(done)
      saveHistory(done)
    } catch {
      setError('发送失败，请稍后重试')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-cream">
      {/* 顶栏 */}
      <header className="flex items-center gap-3 border-b border-ink/5 bg-white/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          className="grid h-9 w-9 place-items-center rounded-full text-ink/60 active:bg-ink/5"
          aria-label="返回"
        >
          <IconArrowLeft width={20} height={20} />
        </button>
        <img src={buddyAvatar} alt="情绪搭子" className="h-9 w-9 rounded-full object-cover" />
        <div>
          <div className="text-sm font-semibold">情绪搭子</div>
          <div className="text-xs text-ink/40">在这里聊聊你的情绪</div>
        </div>
      </header>

      {/* 消息列表 */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="mt-16 text-center">
            <img src={buddyAvatar} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
            <p className="mt-4 text-sm text-ink/60">嗨，我是你的情绪搭子。</p>
            <p className="mt-1 text-sm text-ink/40">和我说说你现在的心情吧。</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {m.role === 'assistant' ? (
                <img src={buddyAvatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
              ) : userAvatar ? (
                <img src={userAvatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime/40 text-sm font-medium text-moss">
                  {user?.nickname?.[0] ?? '我'}
                </div>
              )}
              <div
                className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user' ? 'bg-moss text-white' : 'bg-white text-ink/85 shadow-card'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-2.5">
              <img src={buddyAvatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-ink/40 shadow-card">正在思考…</div>
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-center text-xs text-[#B86B5A]">{error}</p>}
      </div>

      {/* 输入栏 */}
      <div className="border-t border-ink/5 bg-white px-3 py-3 pb-safe">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="说点什么…"
            className="h-11 flex-1 rounded-full bg-sand/60 px-4 text-sm outline-none placeholder:text-ink/40"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-moss text-white disabled:opacity-40"
            aria-label="发送"
          >
            <IconSend width={20} height={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
