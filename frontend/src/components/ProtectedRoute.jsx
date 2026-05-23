import { Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'

export default function ProtectedRoute({ children }) {
    const { isSignedIn, isLoaded } = useAuth()
    
    if (!isLoaded) return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem'
        }}>
            <div style={{ 
                width: '32px', height: '32px', 
                border: '2px solid var(--border)', 
                borderTopColor: 'var(--accent)', 
                borderRadius: '50%', 
                animation: 'spin 0.6s linear infinite' 
            }} />
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Authenticating
            </div>
        </div>
    )
    if (!isSignedIn) return <Navigate to="/sign-in" replace />
    
    return children
}
