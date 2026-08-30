import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { TabLayout } from './components/TabLayout'
import Onboarding from './pages/Onboarding'
import RecordPage from './pages/RecordPage'
import PuzzlePage from './pages/PuzzlePage'
import MePage from './pages/MePage'
import ComposePage from './pages/ComposePage'
import BottlePage from './pages/BottlePage'

function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const { onboarded } = useApp()
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function LoadingScreen() {
  return (
    <div className="flex h-[100dvh] items-center justify-center">
      <div className="animate-float text-3xl">🌱</div>
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
      <Route path="/bottle" element={<BottlePage />} />
      <Route path="*" element={<Navigate to={onboarded ? '/record' : '/onboarding'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="app-shell relative">
          <AppRoutes />
        </div>
      </HashRouter>
    </AppProvider>
  )
}
