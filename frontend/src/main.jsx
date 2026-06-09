import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import App from './App'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Expose Clerk getToken globally for axios interceptor
function ClerkTokenExposer() {
  const { getToken, signOut } = useAuth()
  window.__clerk__ = { getToken }

  // Auto sign-out after 24 hours
  React.useEffect(() => {
    const SESSION_KEY = 'pp_session_start'
    const MAX_SESSION_MS = 24 * 60 * 60 * 1000 // 24 hours

    const sessionStart = localStorage.getItem(SESSION_KEY)
    const now = Date.now()

    if (!sessionStart) {
      localStorage.setItem(SESSION_KEY, String(now))
    } else if (now - Number(sessionStart) > MAX_SESSION_MS) {
      localStorage.removeItem(SESSION_KEY)
      signOut()
      return
    }

    // Check every 5 minutes
    const interval = setInterval(() => {
      const start = localStorage.getItem(SESSION_KEY)
      if (start && Date.now() - Number(start) > MAX_SESSION_MS) {
        localStorage.removeItem(SESSION_KEY)
        signOut()
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [signOut])

  return null
}

// Reset session timer on sign-in
function SessionResetter() {
  const { isSignedIn } = useAuth()
  React.useEffect(() => {
    if (isSignedIn) {
      const existing = localStorage.getItem('pp_session_start')
      if (!existing) {
        localStorage.setItem('pp_session_start', String(Date.now()))
      }
    } else {
      localStorage.removeItem('pp_session_start')
    }
  }, [isSignedIn])
  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ClerkTokenExposer />
      <SessionResetter />
      <App />
    </ClerkProvider>
  </React.StrictMode>
)
