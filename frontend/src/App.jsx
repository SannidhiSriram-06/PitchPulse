import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useTheme } from './hooks/useTheme'
import useAuthStore from './store/authStore'
import api from './lib/api'

// Route-based code splitting
const LandingPage       = lazy(() => import('./pages/LandingPage'))
const SignInPage        = lazy(() => import('./pages/SignInPage'))
const SignUpPage        = lazy(() => import('./pages/SignUpPage'))
const OnboardingPage    = lazy(() => import('./pages/OnboardingPage'))
const DashboardPage     = lazy(() => import('./pages/DashboardPage'))
const BriefGeneratorPage = lazy(() => import('./pages/BriefGeneratorPage'))
const BriefDisplayPage  = lazy(() => import('./pages/BriefDisplayPage'))
const SharePage         = lazy(() => import('./pages/SharePage'))
const HistoryPage       = lazy(() => import('./pages/HistoryPage'))
const SettingsPage      = lazy(() => import('./pages/SettingsPage'))
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage'))

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

  // Warm up Render backend immediately on frontend load
  useEffect(() => {
    api.get('/api/health').catch(() => {})
  }, [])

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

  const suspenseFallback = (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0C0C0C] text-tx-secondary">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4" />
      <span className="text-xs uppercase tracking-widest font-bold text-accent">PitchPulse</span>
    </div>
  )

  return (
    <BrowserRouter>
      <SquiCircleFilter />
      <ToastContainer />

      {/* Command palette, tour, and PWA prompt only mount for authenticated users */}
      {clerkUser && <CommandPalette />}
      {clerkUser && <PWAInstallPrompt />}

      <Suspense fallback={suspenseFallback}>
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
      </Suspense>
    </BrowserRouter>
  )
}
