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
                background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-2) 40%, var(--surface) 100%)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '3rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Glow effect */}
                <div style={{
                  position: 'absolute',
                  top: '-100px',
                  left: '-100px',
                  width: '400px',
                  height: '400px',
                  background: 'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '-50px',
                  right: '-50px',
                  width: '300px',
                  height: '300px',
                  background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  opacity: 0.5
                }} />

                {/* Logo */}
                <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                  <span style={{ color: '#fff' }}>Pitch</span><span style={{ color: 'var(--accent)' }}>Pulse</span>
                </div>

                {/* Main pitch */}
                <div>
                  <h1 style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: '800',
                    letterSpacing: '-2px',
                    lineHeight: '1',
                    color: '#fff',
                    marginBottom: '1.5rem',
                  }}>
                    Know your prospect.<br />
                    <span style={{ color: 'var(--accent)' }}>Before you walk in.</span>
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
                          background: 'var(--accent-soft)',
                          border: '1px solid var(--border-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          flexShrink: 0,
                        }}>
                          {f.icon}
                        </div>
                        <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: '600' }}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom quote */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
              background: 'var(--bg)',
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
                background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-2) 40%, var(--surface) 100%)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '3rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Glow effect */}
                <div style={{
                  position: 'absolute',
                  top: '-100px',
                  left: '-100px',
                  width: '400px',
                  height: '400px',
                  background: 'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '-50px',
                  right: '-50px',
                  width: '300px',
                  height: '300px',
                  background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  opacity: 0.5
                }} />

                {/* Logo */}
                <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                  <span style={{ color: '#fff' }}>Pitch</span><span style={{ color: 'var(--accent)' }}>Pulse</span>
                </div>

                {/* Main pitch */}
                <div>
                  <h1 style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: '800',
                    letterSpacing: '-2px',
                    lineHeight: '1',
                    color: '#fff',
                    marginBottom: '1.5rem',
                  }}>
                    Know your prospect.<br />
                    <span style={{ color: 'var(--accent)' }}>Before you walk in.</span>
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
                          background: 'var(--accent-soft)',
                          border: '1px solid var(--border-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          flexShrink: 0,
                        }}>
                          {f.icon}
                        </div>
                        <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: '600' }}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom quote */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
              background: 'var(--bg)',
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
