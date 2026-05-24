import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import { SignIn, SignUp } from '@clerk/clerk-react'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import BriefGeneratorPage from './pages/BriefGeneratorPage'
import BriefDisplayPage from './pages/BriefDisplayPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import PWAInstallBanner from './components/PWAInstallBanner'
import useIsMobile from './hooks/useIsMobile'

function OnboardingCheck() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!localStorage.getItem('onboarded')) {
      navigate('/onboarding', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }, [])
  return null
}

export default function App() {
  const isMobile = useIsMobile(768)

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Navigate to="/sign-in" replace />} />
        <Route path="/register" element={<Navigate to="/sign-up" replace />} />
        <Route path="/sign-in/*" element={
          <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
          }}>
            {/* Left panel - branding */}
            {!isMobile && (
              <div style={{
                flex: 1,
                background: '#f8f8f6',
                borderRight: '1px solid #e5e5e5',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '3rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Logo */}
                <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                  <span style={{ color: '#0a0a0a' }}>Pitch</span><span style={{ color: '#84cc16' }}>Pulse</span>
                </div>

                {/* Main pitch */}
                <div>
                  <h1 style={{
                    fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
                    fontWeight: '900',
                    letterSpacing: '-3px',
                    lineHeight: '0.95',
                    color: '#0a0a0a',
                    marginBottom: '1.5rem',
                  }}>
                    Know your prospect.<br />
                    <span style={{ color: '#84cc16' }}>Before you walk in.</span>
                  </h1>
                  <p style={{ color: 'var(--text-sec)', fontSize: '1rem', lineHeight: '1.6', maxWidth: '420px', marginBottom: '4rem' }}>
                    AI-powered sales briefs in under 60 seconds. News, financials, talking points, and risks — everything you need before any meeting.
                  </p>

                  {/* Feature pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { icon: '⚡', text: 'Brief any company in under 60 seconds' },
                      { icon: '🎯', text: 'Tailored talking points for your pitch' },
                      { icon: '📊', text: 'Live financials and recent news' },
                      { icon: '🔒', text: 'Free to use — no credit card needed' },
                    ].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: 'rgba(132,204,22,0.1)',
                          border: '1px solid rgba(132,204,22,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          flexShrink: 0,
                        }}>
                          {f.icon}
                        </div>
                        <span style={{ color: '#0a0a0a', fontSize: '0.9rem', fontWeight: '600' }}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom quote */}
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1.5rem' }}>
                  <p style={{ color: '#a3a3a3', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Built for sales reps who prep.
                  </p>
                </div>
              </div>
            )}

            {/* Right panel - Clerk component */}
            <div style={{
              width: isMobile ? '100%' : '520px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              background: '#ffffff',
              borderLeft: isMobile ? 'none' : '1px solid var(--border)'
            }}>
              <SignIn routing="path" path="/sign-in" forceRedirectUrl="/onboarding-check" />
            </div>
          </div>
        } />
        <Route path="/sign-up/*" element={
          <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
          }}>
            {/* Left panel - branding */}
            {!isMobile && (
              <div style={{
                flex: 1,
                background: '#f8f8f6',
                borderRight: '1px solid #e5e5e5',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '3rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Logo */}
                <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                  <span style={{ color: '#0a0a0a' }}>Pitch</span><span style={{ color: '#84cc16' }}>Pulse</span>
                </div>

                {/* Main pitch */}
                <div>
                  <h1 style={{
                    fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
                    fontWeight: '900',
                    letterSpacing: '-3px',
                    lineHeight: '0.95',
                    color: '#0a0a0a',
                    marginBottom: '1.5rem',
                  }}>
                    Know your prospect.<br />
                    <span style={{ color: '#84cc16' }}>Before you walk in.</span>
                  </h1>
                  <p style={{ color: 'var(--text-sec)', fontSize: '1rem', lineHeight: '1.6', maxWidth: '420px', marginBottom: '4rem' }}>
                    AI-powered sales briefs in under 60 seconds. News, financials, talking points, and risks — everything you need before any meeting.
                  </p>

                  {/* Feature pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { icon: '⚡', text: 'Brief any company in under 60 seconds' },
                      { icon: '🎯', text: 'Tailored talking points for your pitch' },
                      { icon: '📊', text: 'Live financials and recent news' },
                      { icon: '🔒', text: 'Free to use — no credit card needed' },
                    ].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: 'rgba(132,204,22,0.1)',
                          border: '1px solid rgba(132,204,22,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          flexShrink: 0,
                        }}>
                          {f.icon}
                        </div>
                        <span style={{ color: '#0a0a0a', fontSize: '0.9rem', fontWeight: '600' }}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom quote */}
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1.5rem' }}>
                  <p style={{ color: '#a3a3a3', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Built for sales reps who prep.
                  </p>
                </div>
              </div>
            )}

            {/* Right panel - Clerk component */}
            <div style={{
              width: isMobile ? '100%' : '520px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              background: '#ffffff',
              borderLeft: isMobile ? 'none' : '1px solid var(--border)'
            }}>
              <SignUp routing="path" path="/sign-up" forceRedirectUrl="/onboarding-check" />
            </div>
          </div>
        } />
        <Route path="/onboarding-check" element={<OnboardingCheck />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/brief/new" element={<ProtectedRoute><BriefGeneratorPage /></ProtectedRoute>} />
        <Route path="/brief/:id" element={<ProtectedRoute><BriefDisplayPage /></ProtectedRoute>} />
        <Route path="/brief/share/:token" element={<BriefDisplayPage />} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Routes>
      <PWAInstallBanner />
    </>
  )
}
