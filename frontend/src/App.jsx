import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useTheme } from './hooks/useTheme'
import useAuthStore from './store/authStore'
import api from './lib/api'

import LandingPage       from './pages/LandingPage'
import SignInPage        from './pages/SignInPage'
import SignUpPage        from './pages/SignUpPage'
import OnboardingPage    from './pages/OnboardingPage'
import DashboardPage     from './pages/DashboardPage'
import BriefGeneratorPage from './pages/BriefGeneratorPage'
import BriefDisplayPage  from './pages/BriefDisplayPage'
import SharePage         from './pages/SharePage'
import HistoryPage       from './pages/HistoryPage'
import SettingsPage      from './pages/SettingsPage'
import NotFoundPage      from './pages/NotFoundPage'
import ProtectedRoute    from './components/ProtectedRoute'
import CommandPalette    from './components/CommandPalette'
import PWAInstallPrompt  from './components/PWAInstallPrompt'
import SquiCircleFilter  from './components/SquiCircleFilter'
import ToastContainer    from './components/Toast'
import GuidedTour        from './components/GuidedTour'
import usePrefsStore     from './store/prefsStore'

export default function App() {
  useTheme()
  const { user: clerkUser, isLoaded } = useUser()
  const { setUser, clearUser } = useAuthStore()
  const { tourActive, setTourActive } = usePrefsStore()

  useEffect(() => {
    if (!isLoaded) return
    if (clerkUser) {
      api.get('/api/user/me')
        .then(res => setUser(res.data))
        .catch(() => clearUser())
      
      const tourCompleted = localStorage.getItem('pp_tour_completed')
      if (!tourCompleted && !tourActive && window.location.pathname === '/dashboard') {
        setTourActive(true)
      }
    } else {
      clearUser()
    }
  }, [clerkUser, isLoaded, setUser, clearUser, setTourActive, tourActive])

  return (
    <BrowserRouter>
      <SquiCircleFilter />
      <ToastContainer />

      {/* Command palette, tour, and PWA prompt only mount for authenticated users */}
      {clerkUser && <CommandPalette />}
      {clerkUser && <PWAInstallPrompt />}

      <Routes>
        {/* Public */}
        <Route path="/"                    element={<LandingPage />} />
        <Route path="/sign-in"             element={<SignInPage />} />
        <Route path="/sign-up"             element={<SignUpPage />} />
        <Route path="/brief/share/:token"  element={<SharePage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/brief/new"  element={<BriefGeneratorPage />} />
          <Route path="/brief/:id"  element={<BriefDisplayPage />} />
          <Route path="/history"    element={<HistoryPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
