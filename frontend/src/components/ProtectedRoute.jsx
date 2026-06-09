import { useAuth } from '@clerk/clerk-react'
import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return (
    <div className="min-h-screen bg-bg-light dark:bg-bg 
      flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent 
        border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isSignedIn) return <Navigate to="/sign-in" replace />
  return <Outlet />
}
