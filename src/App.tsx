import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { Loader } from '@/components/ui'
import { TabLayout } from './components/TabLayout'
import Onboarding from './pages/Onboarding'
import RecordPage from './pages/RecordPage'
import PuzzlePage from './pages/PuzzlePage'
import MePage from './pages/MePage'
import ComposePage from './pages/ComposePage'
import BottlePage from './pages/BottlePage'
import PuzzlePlayPage from './pages/PuzzlePlayPage'
import PhonePreview from './pages/PhonePreview'

function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const { onboarded } = useApp()
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function LoadingScreen() {
  return (
    <div className="flex h-[100dvh] items-center justify-center">
      <Loader variant="dots" size={40} className="text-moss" label="加载中" />
    </div>
  )
}

function AppRoutes() {
  const { loading, onboarded } = useApp()
  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        element={
          <RequireOnboarded>
            <TabLayout />
          </RequireOnboarded>
        }
      >
        <Route path="/record" element={<RecordPage />} />
        <Route path="/puzzle" element={<PuzzlePage />} />
        <Route path="/me" element={<MePage />} />
      </Route>
      <Route path="/compose" element={<ComposePage />} />
      <Route path="/compose/:id" element={<ComposePage />} />
      <Route path="/bottle" element={<BottlePage />} />
      <Route path="/play/:plantId" element={<PuzzlePlayPage />} />
      <Route path="/phone-preview" element={<PhonePreview />} />
      <Route path="*" element={<Navigate to={onboarded ? '/record' : '/onboarding'} replace />} />
    </Routes>
  )
}

/** 手机模拟器预览页全屏渲染，其余页面包在 app-shell（移动端外壳）内 */
function Shell() {
  const location = useLocation()
  if (location.pathname === '/phone-preview') {
    return <AppRoutes />
  }
  return (
    <div className="app-shell relative">
      <AppRoutes />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AppProvider>
  )
}
