import { NavLink, Outlet } from 'react-router-dom'
import { IconRecord, IconPuzzle, IconMe } from './icons'

const tabs = [
  { to: '/record', label: '记录', Icon: IconRecord },
  { to: '/puzzle', label: '拼图', Icon: IconPuzzle },
  { to: '/me', label: '我的', Icon: IconMe },
]

export function TabLayout() {
  return (
    <div className="flex h-[100dvh] flex-col">
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <Outlet />
      </main>
      <nav className="border-t border-ink/5 bg-cream/95 backdrop-blur pb-safe">
        <div className="grid grid-cols-3">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className="outline-none">
              {({ isActive }) => (
                <span
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                    isActive ? 'text-moss' : 'text-stone'
                  }`}
                >
                  <Icon width={22} height={22} strokeWidth={isActive ? 2.1 : 1.6} />
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
