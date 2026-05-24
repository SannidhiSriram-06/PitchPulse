import { useState, useEffect } from 'react'
import { useClerkToken } from '../hooks/useClerkToken'
import { startTour } from '../hooks/useTour'
import { useNavigate } from 'react-router-dom'
import { Plus, LogOut, Settings, Clock, Bookmark, Zap, X, Sun, Moon, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../lib/api'
import useIsMobile from '../hooks/useIsMobile'
import useThemeStore from '../store/themeStore'
import CustomizePanel from '../components/CustomizePanel'
import { BriefCardSkeleton, WatchlistItemSkeleton } from '../components/Skeletons'
import usePrefsStore from '../store/prefsStore'
import { useClerk, useUser } from '@clerk/clerk-react'

function CountUpNumber({ targetValue }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime
    const duration = 1000
    const animate = (time) => {
      if (!startTime) startTime = time
      const progress = Math.min((time - startTime) / duration, 1)
      setCount(Math.floor(progress * targetValue))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [targetValue])
  
  return <>{count}</>
}

export default function DashboardPage() {
    useClerkToken()
    const { signOut } = useClerk()
    const navigate = useNavigate()
    const { user: clerkUser } = useUser()
    const { user, logout, syncClerkUser } = useAuthStore()
    const { loadPrefs, showWatchlist } = usePrefsStore()

    const [briefs, setBriefs] = useState([])
    const [watchlist, setWatchlist] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [newCompany, setNewCompany] = useState('')
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const { theme, toggleTheme } = useThemeStore()
    const [sidebarOpen, setSidebarOpen] = useState(showWatchlist ?? true)
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
    const [showCustomize, setShowCustomize] = useState(false)
    const [alerts, setAlerts] = useState({})
    const [openNote, setOpenNote] = useState(null)
    const [noteTexts, setNoteTexts] = useState({})
    const [noteSaved, setNoteSaved] = useState({})

    useEffect(() => {
        if (clerkUser) syncClerkUser(clerkUser)
    }, [clerkUser])

    useEffect(() => {
        fetchData()
        if (!localStorage.getItem('tour_completed')) {
            setTimeout(() => startTour(), 1500)
        }
    }, [])

    const fetchData = async () => {
        try {
            const [briefsRes, watchlistRes] = await Promise.all([
                api.get('/api/briefs'),
                api.get('/api/watchlist')
            ])
            const watchlistData = watchlistRes.data.watchlist || []
            setBriefs(briefsRes.data.briefs || [])
            setWatchlist(watchlistData)

            try {
                const alertRes = await api.get('/api/watchlist/alerts')
                const alertMap = {}
                ;(alertRes.data.alerts || []).forEach((a) => {
                    alertMap[a.company_name] = a
                })
                setAlerts(alertMap)
            } catch (e) { /* silent fail */ }

            for (const entry of watchlistData) {
                try {
                    const r = await api.get(`/api/watchlist/notes/${encodeURIComponent(entry.company_name)}`)
                    if (r.data.note_text) {
                        setNoteTexts((prev) => ({ ...prev, [entry.company_name]: r.data.note_text }))
                    }
                } catch (e) { /* silent fail */ }
            }

            try {
                const prefsRes = await api.get('/api/user/preferences')
                if (prefsRes.data?.preferences) loadPrefs(prefsRes.data.preferences)
            } catch (e) { /* silent fail */ }
        } catch (e) { }
        setLoading(false)
    }

    const addToWatchlist = async () => {
        const trimmed = newCompany.trim()
        if (!trimmed || watchlist.length >= 20) return
        try {
            await api.post('/api/watchlist', { company_name: trimmed })
            setNewCompany('')
            fetchData()
        } catch (e) { }
    }

    const removeFromWatchlist = async (id) => {
        try {
            await api.delete(`/api/watchlist/${id}`)
            fetchData()
        } catch (e) { }
    }

    const deleteBrief = async (e, id) => {
        e.stopPropagation()
        if (window.confirm("Delete this brief?")) {
            try {
                await api.delete(`/api/briefs/${id}`)
                setBriefs(prev => prev.filter(b => b.id !== id))
            } catch (err) { console.error(err) }
        }
    }

    const handleLogout = () => {
        signOut(() => window.location.href = '/')
    }

    const filteredBriefs = briefs.filter((b) =>
        b.company_name.toLowerCase().includes(search.toLowerCase())
    )

    const formatDate = (iso) => {
        if (!iso) return ''
        return new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    const formatLastBriefed = (isoString) => {
        if (!isoString || isoString === 'null' || isoString === 'undefined') return null
        const dateStr = isoString.endsWith('Z') || isoString.includes('+') ? isoString : isoString + 'Z'
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return null
        const diffMs = new Date() - date
        const diffMins = Math.floor(diffMs / 60000)
        
        if (diffMins < 1) return 'just now'
        if (diffMins < 60) return `${diffMins}m ago`
        
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours}h ago`
        
        const diffDays = Math.floor(diffHours / 24)
        if (diffDays < 7) return `${diffDays}d ago`
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const isWithin7Days = (isoString) => {
        if (!isoString) return false
        return (new Date() - new Date(isoString.endsWith('Z') || isoString.includes('+') ? isoString : isoString + 'Z')) / (1000 * 60 * 60 * 24) <= 7
    }

    const isMobile = useIsMobile()

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>

            {/* Top bar */}
            <nav style={{ 
                borderBottom: '1px solid var(--border)', 
                padding: '0 1rem', 
                position: 'sticky', top: 0, 
                background: 'var(--bg)cc', 
                backdropFilter: 'blur(20px)', 
                WebkitBackdropFilter: 'blur(20px)', 
                zIndex: 100 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', gap: '1rem' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {isMobile && (
                            <button onClick={() => setMobileDrawerOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                <Menu size={20} />
                            </button>
                        )}
                        <div style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.5px', flexShrink: 0 }}>
                            <span style={{ color: '#fff' }}>Pitch</span><span style={{ color: 'var(--accent)' }}>Pulse</span>
                        </div>
                    </div>

                    <div style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
                        <input id="search-bar"
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search briefs..."
                            style={{ 
                                width: '100%', 
                                background: 'var(--surface)', 
                                border: '1px solid var(--border)', 
                                borderRadius: 'var(--radius)', 
                                padding: '0.6rem 1rem', 
                                color: 'var(--text)', 
                                fontSize: '0.85rem', 
                                outline: 'none',
                                transition: 'all 0.15s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--border-accent)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        {!isMobile && (
                            <button onClick={() => navigate('/brief/new')}
                                style={{ 
                                    background: 'var(--accent)', 
                                    border: 'none', 
                                    borderRadius: 'var(--radius)', 
                                    padding: '0.6rem 1.25rem', 
                                    color: '#000', 
                                    fontWeight: '700', 
                                    cursor: 'pointer', 
                                    fontSize: '0.8rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem',
                                    transition: 'filter 0.15s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}>
                                <Plus size={16} /> New Brief
                            </button>
                        )}
                        
                        <button onClick={toggleTheme} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', color: 'var(--text-sec)', cursor: 'pointer' }}>
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        <div style={{ position: 'relative' }}>
                            <div onClick={() => setUserMenuOpen(!userMenuOpen)}
                                style={{ 
                                    width: '36px', height: '36px', 
                                    borderRadius: '50%', 
                                    background: 'var(--surface-2)', 
                                    border: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    cursor: 'pointer', color: 'var(--accent)', 
                                    fontWeight: '700', fontSize: '0.85rem' 
                                }}>
                                {user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            {userMenuOpen && (
                                <div style={{ 
                                    position: 'absolute', right: 0, top: '48px', 
                                    background: 'var(--surface)', 
                                    border: '1px solid var(--border)', 
                                    borderRadius: 'var(--radius-lg)', 
                                    minWidth: '200px', 
                                    zIndex: 200,
                                    overflow: 'hidden',
                                    boxShadow: 'var(--shadow)'
                                }}>
                                    <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {user?.email}
                                    </div>
                                    <div onClick={() => { navigate('/history'); setUserMenuOpen(false) }}
                                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-sec)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <Clock size={16} /> History
                                    </div>
                                    <div onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-sec)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <Settings size={16} /> Settings
                                    </div>
                                    <div onClick={handleLogout}
                                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--border)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <LogOut size={16} /> Log out
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>

                {/* Sidebar */}
                {!isMobile && (
                    <aside id="watchlist-sidebar" style={{ 
                        width: sidebarOpen ? '260px' : '64px', 
                        borderRight: '1px solid var(--border)', 
                        padding: '1.5rem 0.75rem', 
                        overflowY: 'auto', flexShrink: 0, 
                        transition: 'all 0.2s ease', 
                        background: 'var(--surface)' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center', marginBottom: '2rem' }}>
                            {sidebarOpen && <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700' }}>Watchlist</p>}
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}>
                                {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {loading ? (
                                sidebarOpen ? Array.from({ length: 3 }).map((_, i) => <WatchlistItemSkeleton key={i} />) : null
                            ) : (
                                watchlist.map((item) => (
                                    <div key={item.id} style={{ position: 'relative' }}>
                                        <div style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center', 
                                            padding: '0.6rem 0.75rem', 
                                            borderRadius: 'var(--radius-sm)', 
                                            transition: 'background 0.2s', 
                                            cursor: 'pointer',
                                            background: openNote === item.company_name ? 'var(--surface-2)' : 'transparent'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                                        onMouseLeave={(e) => { if (openNote !== item.company_name) e.currentTarget.style.background = 'transparent' }}>
                                            {sidebarOpen ? (
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        {item.company_name}
                                                        {alerts[item.company_name]?.has_recent_news && (
                                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                                        {item.last_briefed_at ? formatLastBriefed(item.last_briefed_at) : 'Never briefed'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ position: 'relative' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>
                                                        {item.company_name[0]}
                                                    </div>
                                                    {alerts[item.company_name]?.has_recent_news && (
                                                        <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', border: '2px solid var(--surface)' }} />
                                                    )}
                                                </div>
                                            )}

                                            {sidebarOpen && (
                                                <div style={{ display: 'flex', gap: '0.25rem', opacity: openNote === item.company_name ? 1 : 0, transition: 'opacity 0.2s' }} className="watchlist-actions">
                                                    <button onClick={() => navigate(`/brief/new?company=${encodeURIComponent(item.company_name)}`)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }} title="Brief">
                                                        <Zap size={14} />
                                                    </button>
                                                    <button onClick={() => setOpenNote(openNote === item.company_name ? null : item.company_name)}
                                                        style={{ background: 'none', border: 'none', color: (noteTexts[item.company_name] || '').trim() ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }} title="Notes">
                                                        <Clock size={14} />
                                                    </button>
                                                    <button onClick={() => removeFromWatchlist(item.id)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }} title="Remove">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <style>{`div:hover .watchlist-actions { opacity: 1 !important; }`}</style>
                                        
                                        {sidebarOpen && openNote === item.company_name && (
                                            <div style={{ padding: '0.5rem 0.75rem' }}>
                                                <textarea
                                                    value={noteTexts[item.company_name] || ''}
                                                    onChange={(e) => setNoteTexts((prev) => ({ ...prev, [item.company_name]: e.target.value }))}
                                                    onBlur={async () => {
                                                        try {
                                                            await api.post(`/api/watchlist/notes/${encodeURIComponent(item.company_name)}`, {
                                                                note_text: noteTexts[item.company_name] || '',
                                                            })
                                                            setNoteSaved((prev) => ({ ...prev, [item.company_name]: true }))
                                                            setTimeout(() => {
                                                                setNoteSaved((prev) => ({ ...prev, [item.company_name]: false }))
                                                            }, 2000)
                                                        } catch (e) { /* silent fail */ }
                                                    }}
                                                    placeholder="Private notes..."
                                                    rows={3}
                                                    style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.75rem', padding: '0.5rem', outline: 'none', resize: 'none' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ marginTop: '1.5rem', padding: sidebarOpen ? '0' : '0 0.5rem' }}>
                            {sidebarOpen ? (
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <input value={newCompany} onChange={(e) => setNewCompany(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addToWatchlist()}
                                        placeholder="Add company..."
                                        style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', color: 'var(--text)', fontSize: '0.75rem', outline: 'none' }}
                                    />
                                    <button onClick={addToWatchlist}
                                        style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', color: '#000', fontWeight: '700', cursor: 'pointer' }}>
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setSidebarOpen(true)}
                                    style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0', color: '#000', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                                    <Plus size={18} />
                                </button>
                            )}
                        </div>
                    </aside>
                )}

                {/* Main Content */}
                <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', position: 'relative' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '1.5rem 1rem 5rem' : '2.5rem' }}>
                        
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: '3rem', gap: '1.5rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '0.5rem' }}>Dashboard</h1>
                                <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>Welcome back. Here's your intelligence overview.</p>
                            </div>
                            <button id="generate-brief-btn" onClick={() => navigate('/brief/new')}
                                style={{ 
                                    width: isMobile ? '100%' : 'auto', 
                                    background: 'var(--accent)', border: 'none', 
                                    borderRadius: 'var(--radius)', padding: '0.8rem 1.75rem', 
                                    color: '#000', fontWeight: '800', 
                                    cursor: 'pointer', fontSize: '0.9rem',
                                    boxShadow: '0 0 12px #a3e63510',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                ⚡ Generate Brief
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                            <div style={{ 
                                background: 'var(--surface)', border: '1px solid var(--border)', 
                                borderTop: '2px solid var(--border-accent)',
                                borderRadius: 'var(--radius-lg)', padding: '1.5rem' 
                            }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>Total Briefs</div>
                                <div style={{ color: 'var(--text)', fontSize: '2.5rem', fontWeight: '800' }}><CountUpNumber targetValue={briefs.length} /></div>
                            </div>
                            <div style={{ 
                                background: 'var(--surface)', border: '1px solid var(--border)', 
                                borderTop: '2px solid var(--border-accent)',
                                borderRadius: 'var(--radius-lg)', padding: '1.5rem' 
                            }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>Companies Tracked</div>
                                <div style={{ color: 'var(--text)', fontSize: '2.5rem', fontWeight: '800' }}><CountUpNumber targetValue={watchlist.length} /></div>
                            </div>
                            <div style={{ 
                                background: 'var(--surface)', border: '1px solid var(--border)', 
                                borderTop: '2px solid var(--border-accent)',
                                borderRadius: 'var(--radius-lg)', padding: '1.5rem' 
                            }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>Last Brief</div>
                                <div style={{ color: 'var(--text)', fontSize: '1.5rem', fontWeight: '800', marginTop: '1rem' }}>
                                    {briefs.length > 0 ? formatLastBriefed(briefs[0].created_at) || 'Today' : 'None yet'}
                                </div>
                            </div>
                        </div>

                        <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#fff' }}>Recent Activity</h2>
                        <div id="briefs-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => <BriefCardSkeleton key={i} />)
                            ) : filteredBriefs.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8rem 2rem', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
                                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        <Zap size={28} color="var(--accent)" />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>No briefs yet</h3>
                                    <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginBottom: '2rem' }}>Generate your first intelligence brief to get started.</p>
                                    <button onClick={() => navigate('/brief/new')}
                                        style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius)', padding: '0.75rem 1.5rem', color: '#000', fontWeight: '700', cursor: 'pointer' }}>
                                        + Create Brief
                                    </button>
                                </div>
                            ) : (
                                filteredBriefs.map((brief, index) => {
                                    const parsed = brief.brief || null
                                    const rawSnippet = parsed?.summary?.content || parsed?.news?.content || Object.values(parsed || {}).find(s => s?.content)?.content || null
                                    const snippet = rawSnippet ? (rawSnippet.length > 120 ? rawSnippet.slice(0, 120) + '...' : rawSnippet) : 'No preview available.'
                                    const sections = (Array.isArray(brief.sections_requested) ? brief.sections_requested : (brief.sections_requested || '').split(',')).filter(Boolean).map(s => s.trim())
                                    
                                    return (
                                        <div key={brief.id} onClick={() => navigate(`/brief/${brief.id}`)}
                                            className="card-hover"
                                            style={{ 
                                                background: 'var(--surface)', border: '1px solid var(--border)', 
                                                borderRadius: 'var(--radius-lg)', padding: '1.5rem', 
                                                cursor: 'pointer', display: 'flex', flexDirection: 'column', 
                                                minHeight: '240px',
                                                opacity: 0,
                                                animation: 'slideUp 0.3s ease forwards',
                                                animationDelay: `${index * 0.05}s`
                                            }}>
                                            

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <h3 style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.5px' }}>{brief.company_name}</h3>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {brief.saved && <Bookmark size={14} style={{ color: 'var(--accent)' }} fill="var(--accent)" />}
                                                    <button onClick={(e) => deleteBrief(e, brief.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}>
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <p style={{ color: 'var(--text-sec)', fontSize: '0.8rem', lineHeight: '1.6', marginBottom: '1.5rem', flex: 1 }}>
                                                {snippet}
                                            </p>
                                            
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                                                {sections.slice(0, 4).map(sec => (
                                                    <span key={sec} style={{ fontSize: '0.6rem', fontWeight: '600', color: 'var(--text-sec)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '99px', padding: '0.15rem 0.5rem', textTransform: 'uppercase' }}>
                                                        {sec}
                                                    </span>
                                                ))}
                                                {sections.length > 4 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{sections.length - 4}</span>}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    {formatDate(brief.created_at).split(',')[0]}
                                                </div>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-sec)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                                    {brief.length}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {isMobile && (
              <nav style={{ 
                  position: 'fixed', bottom: 0, left: 0, right: 0, 
                  background: 'var(--surface)dd', backdropFilter: 'blur(20px)', 
                  borderTop: '1px solid var(--border)', 
                  display: 'flex', justifyContent: 'space-around', 
                  padding: '0.75rem 0', zIndex: 100 
              }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '0.6rem', position: 'relative' }}>
                  <Clock size={20} /> Home
                  <span style={{ position: 'absolute', top: 0, width: '16px', height: '2px', background: 'var(--accent)', borderRadius: '0 0 2px 2px' }} />
                </button>
                <button onClick={() => navigate('/brief/new')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
                  <Zap size={20} /> New
                </button>
                <button onClick={() => navigate('/history')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
                  <Clock size={20} /> History
                </button>
                <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
                  <Settings size={20} /> Settings
                </button>
              </nav>
            )}

            {showCustomize && <CustomizePanel onClose={() => setShowCustomize(false)} />}

            {/* Mobile Watchlist Drawer Backdrop */}
            {isMobile && mobileDrawerOpen && (
                <div onClick={() => setMobileDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: '#000000aa', zIndex: 499, backdropFilter: 'blur(4px)' }} />
            )}
            
            {/* Mobile Watchlist Drawer */}
            {isMobile && (
                <div style={{ 
                    position: 'fixed', left: 0, top: 0, bottom: 0, 
                    width: '280px', background: 'var(--surface)', 
                    borderRight: '1px solid var(--border)', 
                    zIndex: 500, transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                    transform: mobileDrawerOpen ? 'translateX(0)' : 'translateX(-100%)', 
                    padding: '1.5rem', overflowY: 'auto' 
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>Watchlist</span>
                        <button onClick={() => setMobileDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {watchlist.map((item) => (
                            <div key={item.id} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                                <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{item.company_name}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => { setMobileDrawerOpen(false); navigate(`/brief/new?company=${encodeURIComponent(item.company_name)}`) }}
                                        style={{ flex: 1, background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', color: 'var(--accent)', borderRadius: '4px', padding: '0.4rem', fontSize: '0.7rem', fontWeight: '700' }}>
                                        Brief
                                    </button>
                                    <button onClick={() => removeFromWatchlist(item.id)}
                                        style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '4px', padding: '0.4rem' }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem' }}>
                        <input value={newCompany} onChange={(e) => setNewCompany(e.target.value)}
                            placeholder="Add company..."
                            style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem', color: 'var(--text)', fontSize: '0.8rem', outline: 'none' }}
                        />
                        <button onClick={addToWatchlist} style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem', color: '#000' }}>
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
