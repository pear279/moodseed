import { useState } from 'react'

const ROUTES = [
  { hash: '#/onboarding', label: '引导' },
  { hash: '#/record', label: '记录' },
  { hash: '#/puzzle', label: '拼图' },
  { hash: '#/me', label: '我的' },
  { hash: '#/play/cactus_boundary', label: '自由拼图' },
  { hash: '#/bottle', label: '漂流瓶' },
]

export default function PhonePreview() {
  const [hash, setHash] = useState('#/record')

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-[#141a16] px-4 py-8">
      <h1 className="text-sm font-medium text-white/70">Moodseed 手机模拟器预览</h1>

      <div className="flex flex-wrap justify-center gap-2">
        {ROUTES.map((r) => (
          <button
            key={r.hash}
            onClick={() => setHash(r.hash)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              hash === r.hash
                ? 'bg-sprout text-ink'
                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div
        className="relative shrink-0 overflow-hidden rounded-[44px] border-[10px] border-black bg-cream shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
        style={{ width: 390, height: 844 }}
      >
        {/* 刘海 */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-black" />
        {/* Home indicator */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-black/70" />

        <iframe key={hash} src={hash} title="Moodseed 手机预览" className="h-full w-full border-0" />
      </div>

      <p className="text-xs text-white/40">手机框内可直接操作；上方按钮切换页面</p>
    </div>
  )
}
