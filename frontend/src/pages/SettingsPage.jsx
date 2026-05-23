import { useState, useEffect } from 'react'
import { useClerkToken } from '../hooks/useClerkToken'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Moon, Trash2 } from 'lucide-react'
import useAuthStore from '../store/authStore'
import usePrefsStore from '../store/prefsStore'
import api from '../lib/api'
import useIsMobile from '../hooks/useIsMobile'
import useThemeStore from '../store/themeStore'
import { useClerk, useUser, UserButton } from '@clerk/clerk-react'

export default function SettingsPage() {
    useClerkToken()
    const { signOut } = useClerk()
    const navigate = useNavigate()
    const isMobile = useIsMobile()
    const { user: clerkUser } = useUser()
    const { user, logout, syncClerkUser } = useAuthStore()
    const { defaultLength, defaultView, setPrefs } = usePrefsStore()
    const { theme, toggleTheme } = useThemeStore()

    useEffect(() => {
        if (clerkUser) syncClerkUser(clerkUser)
    }, [clerkUser])

    const [length, setLength] = useState(defaultLength || 'medium')
    const [view, setView] = useState(defaultView || 'tabs')
    const [prefsSaved, setPrefsSaved] = useState(false)

    const [deleteModal, setDeleteModal] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const handleSavePrefs = async () => {
        setPrefs({ defaultLength: length, defaultView: view })
        try {
            await api.patch('/api/user/preferences', { default_length: length, default_view: view })
        } catch (e) { }
        setPrefsSaved(true)
        setTimeout(() => setPrefsSaved(false), 2000)
    }

    const handleDeleteAccount = async () => {
        setDeleteLoading(true)
        try {
            await api.delete('/api/auth/account')
            signOut(() => window.location.href = '/')
        } catch (e) { }
        setDeleteLoading(false)
    }

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>

            {/* Nav */}
            <nav style={{ 
                borderBottom: '1px solid var(--border)', 
                padding: '0 1rem', 
                height: '64px', 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg)dd', backdropFilter: 'blur(20px)', 
                position: 'sticky', top: 0, zIndex: 100 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/dashboard')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
                        <ArrowLeft size={16} /> Dashboard
                    </button>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                        <span style={{ color: '#fff' }}>Pitch</span><span style={{ color: 'var(--accent)' }}>Pulse</span>
                    </div>
                </div>
                <button onClick={toggleTheme} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', color: 'var(--text-sec)', cursor: 'pointer' }}>
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </nav>

            <div style={{ maxWidth: '640px', margin: '0 auto', padding: isMobile ? '2rem 1rem 5rem' : '4rem 1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '2.5rem' }}>Settings</h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Account Section */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '1.5rem' }}>Account Intelligence</p>
                        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-sec)', fontFamily: 'monospace' }}>
                            {user?.email}
                        </div>
                        <div style={{ padding: '1.5rem', background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>Identity Management</p>
                            <p style={{ color: 'var(--text-sec)', fontSize: '0.8rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>Your profile and security credentials are securely managed via Clerk.</p>
                            <UserButton afterSignOutUrl="/" showName={true} />
                        </div>
                    </div>

                    {/* Preferences Section */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '1.5rem' }}>System Preferences</p>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-sec)', marginBottom: '0.75rem' }}>Default Brief Depth</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['short', 'medium', 'long'].map(l => (
                                    <button key={l} onClick={() => setLength(l)}
                                        style={{ 
                                            flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)', 
                                            border: `1px solid ${length === l ? 'var(--border-accent)' : 'var(--border)'}`, 
                                            background: length === l ? 'var(--accent-soft)' : 'transparent', 
                                            color: length === l ? 'var(--accent)' : 'var(--text-muted)', 
                                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700',
                                            textTransform: 'capitalize', transition: 'all 0.2s'
                                        }}>
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-sec)', marginBottom: '0.75rem' }}>Default Interface View</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['tabs', 'cards'].map(v => (
                                    <button key={v} onClick={() => setView(v)}
                                        style={{ 
                                            flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)', 
                                            border: `1px solid ${view === v ? 'var(--border-accent)' : 'var(--border)'}`, 
                                            background: view === v ? 'var(--accent-soft)' : 'transparent', 
                                            color: view === v ? 'var(--accent)' : 'var(--text-muted)', 
                                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700',
                                            textTransform: 'capitalize', transition: 'all 0.2s'
                                        }}>
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleSavePrefs}
                            style={{ 
                                width: '100%',
                                background: prefsSaved ? 'var(--success)' : 'var(--accent)', 
                                border: 'none', borderRadius: 'var(--radius)', 
                                padding: '1rem', color: '#000', fontWeight: '800', 
                                cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
                            }}>
                            {prefsSaved ? 'Changes Saved ✓' : 'Update Preferences'}
                        </button>
                    </div>

                    {/* Subscription Section */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '1.5rem' }}>Subscription & Usage</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-2)', borderRadius: 'var(--radius)' }}>
                            <div>
                                <p style={{ fontWeight: '800', fontSize: '1rem', color: '#fff' }}>PitchPulse Free</p>
                                <p style={{ color: 'var(--text-sec)', fontSize: '0.8rem', marginTop: '0.25rem' }}>3 intelligence briefs / hour</p>
                            </div>
                            <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: '0.65rem', fontWeight: '800', padding: '0.25rem 0.75rem', borderRadius: '99px', border: '1px solid var(--border-accent)' }}>ACTIVE</span>
                        </div>

                        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', opacity: 0.6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <p style={{ fontWeight: '800', color: 'var(--accent)' }}>Pro Access</p>
                                    <p style={{ color: 'var(--text-sec)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Unlimited briefs · Multi-company comparison</p>
                                </div>
                                <span style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Coming Soon</span>
                            </div>
                            <button disabled style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem', color: 'var(--text-muted)', cursor: 'not-allowed', fontSize: '0.85rem', fontWeight: '700' }}>
                                Upgrade Tier
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div style={{ background: 'var(--danger)08', border: '1px solid #ef444430', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '1.5rem' }}>Terminal Actions</p>
                        <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>Permanently delete your PitchPulse account and all associated intelligence data. This action is irreversible.</p>
                        <button onClick={() => setDeleteModal(true)}
                            style={{ background: 'none', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: '0.75rem 1.5rem', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '800', transition: 'all 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#ef444415'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {deleteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)f2', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
                    <div style={{ background: 'var(--surface-2)', border: '1px solid #ef444450', borderRadius: 'var(--radius-lg)', padding: '2.5rem', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--danger)10', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.75rem' }}>Final Confirmation</h3>
                        <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.6' }}>Are you absolutely sure? All your saved briefs, watchlists, and account history will be purged immediately.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setDeleteModal(false)}
                                style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.8rem', color: 'var(--text-sec)', cursor: 'pointer', fontWeight: '700' }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteAccount} disabled={deleteLoading}
                                style={{ flex: 1, background: 'var(--danger)', border: 'none', borderRadius: 'var(--radius)', padding: '0.8rem', color: '#fff', cursor: 'pointer', fontWeight: '800' }}>
                                {deleteLoading ? 'Processing...' : 'Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
