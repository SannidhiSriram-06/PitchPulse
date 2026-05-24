import { useState, useEffect } from 'react'
import { useClerkToken } from '../hooks/useClerkToken'
import { startTour } from '../hooks/useTour'
import { useNavigate } from 'react-router-dom'
import { Plus, LogOut, Settings, Clock, Bookmark, Zap, X, Sun, Moon, ChevronLeft, ChevronRight, Menu, Search } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../lib/api'
import useIsMobile from '../hooks/useIsMobile'
import useThemeStore from '../store/themeStore'
import CustomizePanel from '../components/CustomizePanel'
import { BriefCardSkeleton, WatchlistItemSkeleton } from '../components/Skeletons'
import usePrefsStore from '../store/prefsStore'
import { useClerk, useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'

const getAvatarColor = (name) => {
  const colors = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#f97316','#84cc16']
  return colors[name.charCodeAt(0) % colors.length]
}

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
                borderBottom: '1px solid rgba(255,255,255,0.06)', 
                boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
                padding: '0 1rem', 
                position: 'sticky', top: 0, 
                background: 'rgba(13,13,18,0.7)', 
                backdropFilter: 'blur(24px)', 
                WebkitBackdropFilter: 'blur(24px)', 
                zIndex: 100,
                height: '60px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', gap: '1rem' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {isMobile && (
                            <button onClick={() => setMobileDrawerOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                <Menu size={20} />
                            </button>
                        )}
                        <div style={{ fontSize: '1.1rem', fontWeight: '900', letterSpacing: '-0.5px', flexShrink: 0 }}>
                            <span style={{ color: '#ffffff' }}>Pitch</span><span style={{ color: 'var(--accent)' }}>Pulse</span>
                        </div>
                    </div>

                    <div style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
                            <Search size={16} />
                        </div>
                        <input id="search-bar"
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search briefs..."
                            style={{ 
                                width: '100%', 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid rgba(255,255,255,0.08)', 
                                borderRadius: '10px', 
                                padding: '0.6rem 1rem 0.6rem 2.5rem', 
                                color: '#fff', 
                                fontSize: '0.85rem', 
                                outline: 'none',
                                transition: 'all 0.15s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(163,230,53,0.4)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        {!isMobile && (
                            <motion.button id="generate-brief-btn" onClick={() => navigate('/brief/new')}
                                whileHover={{ scale: 1.02, boxShadow: '0 0 16px rgba(163,230,53,0.25)' }}
                                whileTap={{ scale: 0.97 }}
                                style={{ 
                                    background: 'var(--accent)', 
                                    border: 'none', 
                                    borderRadius: '10px', 
                                    padding: '0.55rem 1.1rem', 
                                    color: '#000', 
                                    fontWeight: '800', 
                                    cursor: 'pointer', 
                                    fontSize: '0.8rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem',
                                    boxShadow: '0 0 0 1px rgba(163,230,53,0.2)'
                                }}>
                                <Plus size={16} /> New Brief
                            </motion.button>
                        )}
                        
                        <button onClick={toggleTheme} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', color: 'var(--text-sec)', cursor: 'pointer' }}>
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        <div style={{ position: 'relative' }}>
                            <div onClick={() => setUserMenuOpen(!userMenuOpen)}
                                style={{ 
                                    width: '36px', height: '36px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(163,230,53,0.15)', 
                                    border: '1px solid rgba(163,230,53,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    cursor: 'pointer', color: 'var(--accent)', 
                                    fontWeight: '700', fontSize: '0.85rem' 
                                }}>
                                {user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <AnimatePresence>
                                {userMenuOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                        style={{ 
                                            position: 'absolute', right: 0, top: '48px', 
                                            background: 'rgba(20,20,28,0.95)', 
                                            border: '1px solid rgba(255,255,255,0.08)', 
                                            borderRadius: '14px', 
                                            minWidth: '200px', 
                                            zIndex: 200,
                                            overflow: 'hidden',
                                            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                                            backdropFilter: 'blur(20px)',
                                            WebkitBackdropFilter: 'blur(20px)'
                                        }}>
                                        <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                            {user?.email}
                                        </div>
                                        <div onClick={() => { navigate('/history'); setUserMenuOpen(false) }}
                                            style={{ padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.7)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <Clock size={16} /> History
                                        </div>
                                        <div onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                                            style={{ padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.7)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <Settings size={16} /> Settings
                                        </div>
                                        <div onClick={handleLogout}
                                            style={{ padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <LogOut size={16} /> Log out
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </nav>

            <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>

                {/* Sidebar */}
                {!isMobile && (
                    <aside id="watchlist-sidebar" style={{ 
                        width: sidebarOpen ? '260px' : '64px', 
                        borderRight: '1px solid rgba(255,255,255,0.05)', 
                        padding: '1.5rem 0.75rem', 
                        overflowY: 'auto', flexShrink: 0, 
                        transition: 'all 0.2s ease', 
                        background: 'rgba(19,19,26,0.6)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center', marginBottom: '2rem' }}>
                            {sidebarOpen && <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '700' }}>Watchlist</p>}
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
                                            borderRadius: '10px', 
                                            transition: 'background 0.2s', 
                                            cursor: 'pointer',
                                            background: openNote === item.company_name ? 'rgba(255,255,255,0.05)' : 'transparent'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => { if (openNote !== item.company_name) e.currentTarget.style.background = 'transparent' }}>
                                            {sidebarOpen ? (
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                                                    <div style={{ 
                                                        width: '32px', height: '32px', 
                                                        borderRadius: '8px', 
                                                        background: getAvatarColor(item.company_name) + '25', 
                                                        border: '1px solid ' + getAvatarColor(item.company_name) + '40',
                                                        color: getAvatarColor(item.company_name),
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' 
                                                    }}>
                                                        {item.company_name[0]}
                                                    </div>
                                                    {alerts[item.company_name]?.has_recent_news && (
                                                        <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', border: '2px solid rgba(19,19,26,1)' }} />
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
                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', padding: '0.5rem', outline: 'none', resize: 'none' }}
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
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.5rem', color: '#fff', fontSize: '0.75rem', outline: 'none' }}
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
                                <div style={{ width: '32px', height: '2px', background: 'var(--accent)', borderRadius: '99px', marginBottom: '1rem' }} />
                                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '0.5rem', color: '#fff' }}>Dashboard</h1>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Welcome back. Here's your intelligence overview.</p>
                            </div>
                            <motion.button id="generate-brief-btn" onClick={() => navigate('/brief/new')}
                                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(163,230,53,0.2)' }}
                                whileTap={{ scale: 0.97 }}
                                style={{ 
                                    width: isMobile ? '100%' : 'auto', 
                                    background: 'var(--accent)', border: 'none', 
                                    borderRadius: '12px', padding: '0.8rem 1.5rem', 
                                    color: '#000', fontWeight: '800', 
                                    cursor: 'pointer', fontSize: '0.875rem',
                                    boxShadow: '0 0 0 1px rgba(163,230,53,0.2)',
                                    transition: 'all 0.2s ease'
                                }}>
                                ⚡ Generate Brief
                            </motion.button>
                        </div>

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                style={{ 
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', 
                                    borderLeft: '3px solid rgba(163,230,53,0.3)',
                                    borderRadius: '16px', padding: '1.75rem',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)'
                                }}>
                                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>Total Briefs</div>
                                <div style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-2px' }}><CountUpNumber targetValue={briefs.length} /></div>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                style={{ 
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', 
                                    borderLeft: '3px solid rgba(163,230,53,0.3)',
                                    borderRadius: '16px', padding: '1.75rem',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)'
                                }}>
                                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>Companies Tracked</div>
                                <div style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-2px' }}><CountUpNumber targetValue={watchlist.length} /></div>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                style={{ 
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', 
                                    borderLeft: '3px solid rgba(163,230,53,0.3)',
                                    borderRadius: '16px', padding: '1.75rem',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)'
                                }}>
                                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>Last Brief</div>
                                <div style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '800', marginTop: '0.2rem', letterSpacing: '-2px' }}>
                                    {briefs.length > 0 ? (
                                        <span style={{ fontSize: '1.5rem' }}>{formatLastBriefed(briefs[0].created_at) || 'Today'}</span>
                                    ) : (
                                        <span style={{ fontSize: '1.5rem' }}>None yet</span>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>Recent Activity</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                        
                        <div id="briefs-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => <BriefCardSkeleton key={i} />)
                            ) : filteredBriefs.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
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
                                        <motion.div key={brief.id} onClick={() => navigate(`/brief/${brief.id}`)}
                                            initial={{ opacity: 0, y: 24 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                            whileHover={{ y: -3, boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(163,230,53,0.15)' }}
                                            style={{ 
                                                background: 'rgba(19,19,26,0.8)', border: '1px solid rgba(255,255,255,0.07)', 
                                                borderRadius: '18px', padding: '1.5rem', 
                                                cursor: 'pointer', display: 'flex', flexDirection: 'column', 
                                                minHeight: '240px',
                                                backdropFilter: 'blur(10px)',
                                                WebkitBackdropFilter: 'blur(10px)',
                                                transition: 'border-color 0.2s'
                                            }}>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ 
                                                        width: '40px', height: '40px', borderRadius: '12px',
                                                        background: getAvatarColor(brief.company_name) + '20',
                                                        border: '1px solid ' + getAvatarColor(brief.company_name) + '35',
                                                        color: getAvatarColor(brief.company_name),
                                                        fontWeight: '800', fontSize: '1rem',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        {brief.company_name[0].toUpperCase()}
                                                    </div>
                                                    <h3 style={{ fontWeight: '700', fontSize: '0.95rem', letterSpacing: '-0.3px', color: '#fff' }}>{brief.company_name}</h3>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {brief.saved && <Bookmark size={14} style={{ color: 'var(--accent)' }} fill="var(--accent)" />}
                                                    <button onClick={(e) => deleteBrief(e, brief.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: '0.2rem' }}>
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', lineHeight: '1.65', marginBottom: '1.5rem', flex: 1 }}>
                                                {snippet}
                                            </p>
                                            
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                                                {sections.slice(0, 4).map(sec => (
                                                    <span key={sec} style={{ 
                                                        fontSize: '0.58rem', fontWeight: '600', 
                                                        color: 'rgba(255,255,255,0.4)', 
                                                        background: 'rgba(255,255,255,0.05)', 
                                                        border: '1px solid rgba(255,255,255,0.08)', 
                                                        borderRadius: '6px', padding: '0.2rem 0.5rem', 
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {sec}
                                                    </span>
                                                ))}
                                                {sections.length > 4 && <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>+{sections.length - 4}</span>}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>
                                                    {formatDate(brief.created_at).split(',')[0]}
                                                </div>
                                                <span style={{ 
                                                    fontSize: '0.6rem', fontWeight: '700', 
                                                    color: 'rgba(163,230,53,0.8)', 
                                                    background: 'rgba(163,230,53,0.08)', 
                                                    border: '1px solid rgba(163,230,53,0.2)', 
                                                    borderRadius: '6px', padding: '0.2rem 0.5rem', 
                                                    textTransform: 'uppercase' 
                                                }}>
                                                    {brief.length}
                                                </span>
                                            </div>
                                        </motion.div>
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
                  background: 'rgba(13,13,18,0.85)', backdropFilter: 'blur(20px)', 
                  WebkitBackdropFilter: 'blur(20px)',
                  borderTop: '1px solid rgba(255,255,255,0.06)', 
                  display: 'flex', justifyContent: 'space-around', 
                  padding: '0.75rem 0', zIndex: 100 
              }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '0.6rem', position: 'relative' }}>
                  <Clock size={20} /> Home
                  <span style={{ position: 'absolute', top: 0, width: '16px', height: '2px', background: 'var(--accent)', borderRadius: '0 0 2px 2px' }} />
                </button>
                <button onClick={() => navigate('/brief/new')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>
                  <Zap size={20} /> New
                </button>
                <button onClick={() => navigate('/history')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>
                  <Clock size={20} /> History
                </button>
                <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>
                  <Settings size={20} /> Settings
                </button>
              </nav>
            )}

            {showCustomize && <CustomizePanel onClose={() => setShowCustomize(false)} />}

            {/* Mobile Watchlist Drawer Backdrop */}
            {isMobile && mobileDrawerOpen && (
                <div onClick={() => setMobileDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 499, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
            )}
            
            {/* Mobile Watchlist Drawer */}
            {isMobile && (
                <div style={{ 
                    position: 'fixed', left: 0, top: 0, bottom: 0, 
                    width: '280px', background: 'rgba(19,19,26,0.95)', 
                    borderRight: '1px solid rgba(255,255,255,0.06)', 
                    zIndex: 500, transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                    transform: mobileDrawerOpen ? 'translateX(0)' : 'translateX(-100%)', 
                    padding: '1.5rem', overflowY: 'auto',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
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
                            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
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
