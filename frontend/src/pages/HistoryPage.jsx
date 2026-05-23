import { useState, useEffect } from 'react'
import { useClerkToken } from '../hooks/useClerkToken'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Bookmark, Search, Sun, Moon } from 'lucide-react'
import api from '../lib/api'
import useIsMobile from '../hooks/useIsMobile'
import useThemeStore from '../store/themeStore'
import { BriefCardSkeleton } from '../components/Skeletons'

const DATE_FILTERS = ['all', 'today', 'this week', 'this month']

export default function HistoryPage() {
    useClerkToken()
    const navigate = useNavigate()
    const isMobile = useIsMobile()
    const { theme, toggleTheme } = useThemeStore()
    const [briefs, setBriefs] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [dateFilter, setDateFilter] = useState('all')
    const [savedOnly, setSavedOnly] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    useEffect(() => { fetchBriefs() }, [])

    const fetchBriefs = async () => {
        try {
            const res = await api.get('/api/briefs')
            setBriefs(res.data.briefs || [])
        } catch (e) { }
        setLoading(false)
    }

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/briefs/${id}`)
            setBriefs(briefs.filter(b => b.id !== id))
            setDeleteConfirm(null)
        } catch (e) { }
    }

    const filterByDate = (brief) => {
        if (dateFilter === 'all') return true
        const created = new Date(brief.created_at.endsWith('Z') || brief.created_at.includes('+') ? brief.created_at : brief.created_at + 'Z')
        const now = new Date()
        if (dateFilter === 'today') {
            return created.toDateString() === now.toDateString()
        }
        if (dateFilter === 'this week') {
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
            return created >= weekAgo
        }
        if (dateFilter === 'this month') {
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
        }
        return true
    }

    const filtered = briefs
        .filter(b => b.company_name.toLowerCase().includes(search.toLowerCase()))
        .filter(filterByDate)
        .filter(b => savedOnly ? b.saved : true)

    const formatDate = (iso) => {
        if (!iso) return ''
        return new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '2rem 1rem 5rem' : '4rem 1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '2rem' }}>Brief History</h1>

                {/* Search and Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                    
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter by company name..."
                            style={{ 
                                width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', 
                                borderRadius: 'var(--radius)', padding: '1rem 1rem 1rem 3rem', color: 'var(--text)', 
                                fontSize: '0.9rem', outline: 'none', transition: 'all 0.2s'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--border-accent)'; e.target.style.boxShadow = 'var(--accent-glow)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '3px' }}>
                            {DATE_FILTERS.map(f => (
                                <button key={f} onClick={() => setDateFilter(f)}
                                    style={{ 
                                        padding: '0.4rem 1rem', borderRadius: 'calc(var(--radius) - 2px)', border: 'none',
                                        background: dateFilter === f ? 'var(--accent)' : 'transparent', 
                                        color: dateFilter === f ? '#000' : 'var(--text-sec)', 
                                        cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700',
                                        textTransform: 'capitalize', transition: 'all 0.2s'
                                    }}>
                                    {f}
                                </button>
                            ))}
                        </div>

                        <button onClick={() => setSavedOnly(!savedOnly)}
                            style={{ 
                                padding: '0.5rem 1rem', borderRadius: 'var(--radius)', 
                                border: `1px solid ${savedOnly ? 'var(--border-accent)' : 'var(--border)'}`, 
                                background: savedOnly ? 'var(--accent-soft)' : 'var(--surface)', 
                                color: savedOnly ? 'var(--accent)' : 'var(--text-sec)', 
                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                            }}>
                            <Bookmark size={14} fill={savedOnly ? 'currentColor' : 'none'} />
                            Saved Only
                        </button>
                    </div>
                </div>

                {/* History List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => <BriefCardSkeleton key={i} />)
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '6rem 2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
                            <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>No briefs found matching your criteria.</p>
                        </div>
                    ) : (
                        filtered.map((brief, index) => (
                            <div key={brief.id}
                                className="card-hover"
                                style={{ 
                                    background: 'var(--surface)', border: '1px solid var(--border)', 
                                    borderRadius: 'var(--radius-lg)', padding: '1.5rem', 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                    gap: '1.5rem', cursor: 'pointer',
                                    opacity: 0,
                                    animation: 'slideUp 0.3s ease forwards',
                                    animationDelay: `${index * 0.05}s`
                                }}
                                onClick={() => navigate(`/brief/${brief.id}`)}>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.5px' }}>{brief.company_name}</span>
                                        {brief.saved && <Bookmark size={14} style={{ color: 'var(--accent)' }} fill="var(--accent)" />}
                                        <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-sec)', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.15rem 0.5rem', textTransform: 'uppercase' }}>
                                            {brief.length}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500' }}>{formatDate(brief.created_at)}</p>
                                </div>

                                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(brief.id); }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)f2', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
                    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--danger)10', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Trash2 size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.75rem' }}>Delete this brief?</h3>
                        <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>This action cannot be undone. All intelligence gathered for this company will be lost.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setDeleteConfirm(null)}
                                style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.8rem', color: 'var(--text-sec)', cursor: 'pointer', fontWeight: '700' }}>
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)}
                                style={{ flex: 1, background: 'var(--danger)', border: 'none', borderRadius: 'var(--radius)', padding: '0.8rem', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
