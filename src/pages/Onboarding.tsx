import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { DEFAULT_NICKNAME } from '../lib/constants'
import { zodiacOf } from '../lib/zodiac'
import { Button, Input } from '@/components/ui'
import { Magnetic, TextEffect } from '@/components/core'
import { IconArrowLeft } from '../components/icons'

const RANDOM_NICKNAMES = [
  '小种子',
  '小绿芽',
  '小树叶',
  '小露珠',
  '小蘑菇',
  '小苔藓',
  '小苗苗',
  '小向日葵',
  '小四叶草',
  '小橡果',
]

export default function Onboarding() {
  const { user, updateUser, setOnboarded } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState<0 | 1>(0)
  const [nickname, setNickname] = useState(user?.nickname || DEFAULT_NICKNAME)
  const [birthday, setBirthday] = useState('')
  const [saving, setSaving] = useState(false)

  const zodiac = useMemo(() => (birthday ? zodiacOf(birthday) : ''), [birthday])

  const randomNickname = () =>
    setNickname(RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)])

  const finish = async () => {
    setSaving(true)
    try {
      await updateUser({
        nickname: nickname.trim() || DEFAULT_NICKNAME,
        birthday: birthday || null,
      })
      setOnboarded(true)
      navigate('/record', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col px-6 pb-safe">
      <header className="flex items-center gap-2 pt-6">
        {step === 1 && (
          <button
            onClick={() => setStep(0)}
            className="grid h-9 w-9 place-items-center rounded-full text-ink/60 active:bg-ink/5"
            aria-label="上一步"
          >
            <IconArrowLeft width={20} height={20} />
          </button>
        )}
        <div className="text-xs font-medium text-stone">
          {step === 0 ? '第一步' : '第二步'}
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-center">
        {step === 0 ? (
          <div className="animate-slide-up">
            <div className="text-4xl">🌱</div>
            <TextEffect as="h1" preset="fade-in-blur" className="mt-4 text-2xl font-semibold">
              怎么称呼你？
            </TextEffect>
            <p className="mt-2 text-sm text-ink/50">可以自己取一个，也可以用随机昵称，或直接跳过。</p>

            <Input
              value={nickname}
              onChange={setNickname}
              placeholder={DEFAULT_NICKNAME}
              maxLength={12}
              className="mt-8"
            />
            <button
              onClick={randomNickname}
              className="mt-3 text-sm text-moss active:opacity-60"
            >
              🎲 换一个随机昵称
            </button>
          </div>
        ) : (
          <div className="animate-slide-up">
            <div className="text-4xl">🎂</div>
            <h1 className="mt-4 text-2xl font-semibold">告诉我你的生日</h1>
            <p className="mt-2 text-sm text-ink/50">选填。填了以后，为你生成属于你的星座和幸运信息。</p>

            <Input
              type="date"
              value={birthday}
              onChange={setBirthday}
              max={new Date().toISOString().slice(0, 10)}
              className="mt-8"
            />
            {zodiac && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-lime/40 px-4 py-1.5 text-sm text-leaf">
                ✨ 你的星座：{zodiac}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pb-10">
        {step === 0 ? (
          <Magnetic>
            <Button onClick={() => setStep(1)} size="lg" className="w-full">
              下一步
            </Button>
          </Magnetic>
        ) : (
          <div className="space-y-3">
            <Magnetic>
              <Button onClick={finish} disabled={saving} size="lg" className="w-full">
                {saving ? '进入中…' : '开始记录'}
              </Button>
            </Magnetic>
            <button
              onClick={finish}
              className="w-full py-2 text-sm text-stone active:opacity-60"
            >
              跳过，稍后再说
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
