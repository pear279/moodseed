import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../lib/api'
import { getUserId } from '../lib/userId'
import { ONBOARDED_KEY } from '../lib/constants'
import type { User } from '../lib/types'

interface AppCtx {
  user: User | null
  loading: boolean
  onboarded: boolean
  setOnboarded: (v: boolean) => void
  refreshUser: () => Promise<void>
  updateUser: (patch: Partial<Pick<User, 'nickname' | 'birthday' | 'mbti'>>) => Promise<void>
}

const Ctx = createContext<AppCtx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboarded, setOnboarded] = useState<boolean>(
    () => localStorage.getItem(ONBOARDED_KEY) === '1',
  )

  const refreshUser = useCallback(async () => {
    const id = getUserId()
    const u = await api.ensureUser(id)
    setUser(u)
  }, [])

  useEffect(() => {
    refreshUser()
      .catch(() => {
        /* 网络失败时留空，界面仍可渲染 */
      })
      .finally(() => setLoading(false))
  }, [refreshUser])

  const setOnboardedAndStore = (v: boolean) => {
    setOnboarded(v)
    if (v) localStorage.setItem(ONBOARDED_KEY, '1')
    else localStorage.removeItem(ONBOARDED_KEY)
  }

  const updateUser = useCallback(
    async (patch: Partial<Pick<User, 'nickname' | 'birthday' | 'mbti'>>) => {
      if (!user) return
      const u = await api.updateUser(user.id, patch)
      setUser(u)
    },
    [user],
  )

  return (
    <Ctx.Provider
      value={{ user, loading, onboarded, setOnboarded: setOnboardedAndStore, refreshUser, updateUser }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useApp(): AppCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
