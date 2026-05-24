import { useState, useEffect } from 'react'
import { useClerkToken } from '../hooks/useClerkToken'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bookmark, BookmarkCheck, Share2, RefreshCw, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Sun, Moon, Download, Calendar } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import api from '../lib/api'
import usePrefsStore from '../store/prefsStore'
import useAuthStore from '../store/authStore'
import useIsMobile from '../hooks/useIsMobile'
import useThemeStore from '../store/themeStore'
import CustomizePanel from '../components/CustomizePanel'
import { motion, AnimatePresence } from 'framer-motion'

const getAvatarColor = (name) => {
  const colors = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#f97316','#84cc16']
  return colors[(name || '').charCodeAt(0) % colors.length]
}

const SECTION_LABELS = {
    summary: 'Summary',
    news: 'News',
    financials: 'Financials',
    social_sentiment: 'Social Sentiment',
    talking_points: 'Talking Points',
    watch_out_for: 'Watch Out For',
    custom_focus: 'Custom Focus',
    company1_summary: 'Company 1',
    company2_summary: 'Company 2',
    financial_comparison: 'Financials',
    market_position: 'Market Position',
    recent_developments: 'Recent News',
    strengths_weaknesses: 'Strengths & Weaknesses',
    recommendation: 'Recommendation',
}

export default function BriefDisplayPage() {
    useClerkToken()
    const { id, token } = useParams()
    const navigate = useNavigate()
    const { defaultView, showSources } = usePrefsStore()
    const { user } = useAuthStore()
    const isMobile = useIsMobile()
    const { theme, toggleTheme } = useThemeStore()
    const isShareView = !!token

    const [brief, setBrief] = useState(null)
    const [briefMeta, setBriefMeta] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [view, setView] = useState(defaultView || 'tabs')
    const [activeTab, setActiveTab] = useState('summary')
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [feedback, setFeedback] = useState({})
    const [sourcesOpen, setSourcesOpen] = useState(showSources ?? false)
    const [copied, setCopied] = useState(false)
    const [poorQualityCount, setPoorQualityCount] = useState(0)
    const [showCustomize, setShowCustomize] = useState(false)
    const [exportingPDF, setExportingPDF] = useState(false)
    const [showSchedule, setShowSchedule] = useState(false)
    const [meetingTime, setMeetingTime] = useState('')
    const [meetingEmail, setMeetingEmail] = useState(user?.email || '')
    const [scheduleStatus, setScheduleStatus] = useState('')
    const [diffData, setDiffData] = useState(null)
    const [showDiff, setShowDiff] = useState(false)

    useEffect(() => {
        if (user?.email && !meetingEmail) setMeetingEmail(user.email)
    }, [user])

    useEffect(() => {
        fetchBrief()
    }, [id, token])

    const fetchBrief = async () => {
        try {
            let res
            if (token) {
                res = await api.get(`/api/share/${token}`)
            } else {
                res = await api.get(`/api/briefs/${id}`)
            }
            const data = res.data
            setBriefMeta(data)
            setSaved(data.saved || false)
            setBrief(data.brief || {})
            const keys = Object.keys(data.brief || {})
            if (keys.length > 0) setActiveTab(keys[0])

            if (data.feedback_summary) {
                try {
                    const parsedFeedback = typeof data.feedback_summary === 'string' 
                        ? JSON.parse(data.feedback_summary) 
                        : data.feedback_summary;
                    setFeedback(parsedFeedback)
                    setPoorQualityCount(Object.values(parsedFeedback).filter(v => v === 'down').length)
                } catch (e) {
                    console.error('Failed to parse feedback_summary', e)
                }
            }
            if (data.company_name && !isShareView) {
                try {
                    const diffRes = await api.get(`/api/briefs/company/${encodeURIComponent(data.company_name)}/diff`)
                    setDiffData(diffRes.data)
                } catch (e) {
                    console.error('Failed to fetch diff', e)
                }
            }
        } catch (e) {
            setError(e.response?.data?.error || 'Could not load brief.')
        }
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.patch(`/api/briefs/${id}/save`)
            setSaved(!saved)
        } catch (e) { }
        setSaving(false)
    }

    const handleSchedule = async () => {
        if (!meetingTime || !meetingEmail) {
            setScheduleStatus("Please fill out all fields.")
            return
        }
        try {
            await api.post(`/api/briefs/${id}/schedule`, {
                meeting_time: meetingTime,
                meeting_email: meetingEmail
            })
            setScheduleStatus("✓ Brief sent to your email!")
            setTimeout(() => {
                setScheduleStatus('')
                setShowSchedule(false)
            }, 3000)
        } catch (e) {
            setScheduleStatus("Failed to send. Try again.")
        }
    }

    const handleShare = async () => {
        try {
            const res = await api.post(`/api/briefs/${id}/share`)
            const shareUrl = `${window.location.origin}/brief/share/${res.data.share_token}`
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e) { }
    }

    const handleFeedback = async (section, value) => {
        const newFeedback = { ...feedback, [section]: value }
        setFeedback(newFeedback)
        const downCount = Object.values(newFeedback).filter(v => v === 'down').length
        setPoorQualityCount(downCount)
        try {
            await api.post(`/api/briefs/${id}/feedback`, { section, rating: value })
        } catch (e) { }
    }

    const exportToPDF = async () => {
        if (!briefMeta) return
        setExportingPDF(true)
        try {
            const el = document.getElementById('brief-content')
            if (!el) throw new Error('Content not found')
            const canvas = await html2canvas(el, { scale: 2 })
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width
            let heightLeft = pdfHeight
            let position = 0

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
            heightLeft -= pdf.internal.pageSize.getHeight()

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
                heightLeft -= pdf.internal.pageSize.getHeight()
            }

            const dateStr = new Date().toISOString().split('T')[0]
            pdf.save(`${briefMeta.company_name.replace(/\s+/g, '-')}-brief-${dateStr}.pdf`)
        } catch (e) {
            console.error('PDF Export failed', e)
        }
        setExportingPDF(false)
    }

    const formatDate = (iso) => {
        if (!iso) return ''
        return new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    const sections = brief ? Object.keys(brief).sort((a, b) => {
        if (a === 'custom_focus') return 1
        if (b === 'custom_focus') return -1
        return 0
    }) : []
    const sources = briefMeta?.sources_used || []

    if (loading) return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sec)' }}>
            <div style={{ 
                width: '36px', height: '36px', 
                border: '2px solid rgba(255,255,255,0.06)', 
                borderTop: '2px solid var(--accent)', 
                borderRadius: '50%', 
                animation: 'spin 0.7s linear infinite' 
            }} />
        </div>
    )

    if (error) return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
            <nav style={{ 
                borderBottom: '1px solid rgba(255,255,255,0.06)', 
                padding: '0 1rem', 
                display: 'flex', alignItems: 'center', 
                height: '60px', 
                background: 'rgba(13,13,18,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' 
            }}>
                <button onClick={() => navigate('/dashboard')}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
                    <ArrowLeft size={16} /> Dashboard
                </button>
            </nav>
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--danger)', fontSize: '1rem', fontWeight: '600' }}>{error}</p>
            </div>
        </div>
    )

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
            
            {/* Nav */}
            <nav style={{ 
                borderBottom: '1px solid rgba(255,255,255,0.06)', 
                padding: '0 1rem', 
                position: 'sticky', top: 0, 
                background: 'rgba(13,13,18,0.7)', 
                backdropFilter: 'blur(24px)', 
                WebkitBackdropFilter: 'blur(24px)', 
                zIndex: 100,
                height: '60px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/dashboard')}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
                            <ArrowLeft size={16} /> {!isMobile && 'Dashboard'}
                        </button>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                            <span style={{ color: '#fff' }}>Pitch</span><span style={{ color: 'var(--accent)' }}>Pulse</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!isShareView && (
                            <>
                                <button onClick={handleSave} disabled={saving}
                                    style={{ 
                                        background: saved ? 'rgba(163,230,53,0.1)' : 'rgba(255,255,255,0.05)', 
                                        border: saved ? '1px solid rgba(163,230,53,0.25)' : '1px solid rgba(255,255,255,0.08)', 
                                        borderRadius: '8px', 
                                        padding: '0.45rem 0.875rem', 
                                        color: saved ? 'var(--accent)' : 'rgba(255,255,255,0.6)', 
                                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        transition: 'all 0.15s'
                                    }}>
                                    {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                                    {!isMobile && (saved ? 'Saved' : 'Save')}
                                </button>
                                <button onClick={exportToPDF} disabled={exportingPDF}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.45rem 0.875rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}>
                                    <Download size={14} />
                                    {!isMobile && 'Export'}
                                </button>
                                <button onClick={() => setShowSchedule(!showSchedule)}
                                    style={{ background: showSchedule ? 'rgba(163,230,53,0.08)' : 'rgba(255,255,255,0.05)', border: showSchedule ? '1px solid rgba(163,230,53,0.2)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.45rem 0.875rem', color: showSchedule ? 'var(--accent)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}>
                                    <Calendar size={14} />
                                    {!isMobile && 'Schedule'}
                                </button>
                                <button onClick={handleShare}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.45rem 0.875rem', color: copied ? 'var(--success)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}>
                                    <Share2 size={14} />
                                    {!isMobile && (copied ? 'Copied' : 'Share')}
                                </button>
                            </>
                        )}
                        <button onClick={toggleTheme} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.45rem', color: 'var(--text-sec)', cursor: 'pointer' }}>
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Schedule Panel */}
            <AnimatePresence>
                {showSchedule && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{ background: 'rgba(19,19,26,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '2rem' }}
                    >
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#fff' }}>Schedule Brief Delivery</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Meeting Time</label>
                                    <input type="datetime-local" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', padding: '0.875rem 1rem', outline: 'none', colorScheme: 'dark' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Recipient Email</label>
                                    <input type="email" value={meetingEmail} onChange={(e) => setMeetingEmail(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', padding: '0.875rem 1rem', outline: 'none', colorScheme: 'dark' }} />
                                </div>
                            </div>
                            <motion.button 
                                onClick={handleSchedule}
                                whileHover={{ scale: 1.01, boxShadow: '0 0 0 1px rgba(163,230,53,0.4), 0 12px 40px rgba(163,230,53,0.25)' }}
                                whileTap={{ scale: 0.98 }}
                                style={{ 
                                    width: '100%', background: 'var(--accent)', color: '#000', border: 'none', 
                                    padding: '1.1rem', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', 
                                    boxShadow: '0 0 0 1px rgba(163,230,53,0.3), 0 8px 32px rgba(163,230,53,0.15)' 
                                }}
                            >
                                Schedule Delivery
                            </motion.button>
                            {scheduleStatus && <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: scheduleStatus.includes('✓') ? 'var(--success)' : 'var(--danger)', textAlign: 'center', fontWeight: '600' }}>{scheduleStatus}</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main id="brief-content" style={{ maxWidth: '860px', margin: '0 auto', padding: isMobile ? '2rem 1rem 6rem' : '3.5rem 2rem' }}>
                
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 24 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ marginBottom: '4rem' }}
                >
                    <div style={{ 
                        width: '52px', height: '52px', borderRadius: '14px',
                        background: getAvatarColor(briefMeta?.company_name) + '20',
                        border: '1px solid ' + getAvatarColor(briefMeta?.company_name) + '35',
                        color: getAvatarColor(briefMeta?.company_name),
                        fontWeight: '900', fontSize: '1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        {briefMeta?.company_name?.[0]?.toUpperCase()}
                    </div>
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900', letterSpacing: '-2px', marginBottom: '0.75rem', color: '#fff' }}>
                        {briefMeta?.company_name}
                    </h1>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: '500' }}>
                            {formatDate(briefMeta?.created_at)} · {briefMeta?.length} · {sections.length} sections
                        </div>
                        {diffData?.has_diff && (
                            <button onClick={() => setShowDiff(!showDiff)} style={{ background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.25)', color: 'var(--accent)', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}>
                                ⚡ RECENT UPDATES
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* View Toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '3px', width: 'fit-content', marginBottom: '2rem' }}>
                    {['tabs', 'cards'].map((v) => (
                        <button key={v} onClick={() => setView(v)}
                            style={{ 
                                padding: '0.4rem 1rem', borderRadius: '8px', border: 'none',
                                background: view === v ? 'rgba(163,230,53,0.1)' : 'transparent', 
                                border: view === v ? '1px solid rgba(163,230,53,0.25)' : 'none',
                                color: view === v ? 'var(--accent)' : 'rgba(255,255,255,0.35)', 
                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700',
                                textTransform: 'capitalize'
                            }}>
                            {v}
                        </button>
                    ))}
                </div>

                {/* TABS VIEW */}
                {view === 'tabs' && (
                    <div style={{ animation: 'slideUp 0.3s ease' }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '2.5rem', overflowX: 'auto', gap: '0' }}>
                            {sections.map((s) => (
                                <button key={s} onClick={() => setActiveTab(s)}
                                    style={{ 
                                        padding: '0.75rem 1.25rem', background: 'transparent', border: 'none', 
                                        borderBottom: `2px solid ${activeTab === s ? 'var(--accent)' : 'transparent'}`, 
                                        color: activeTab === s ? '#fff' : 'rgba(255,255,255,0.35)', 
                                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap',
                                        transition: 'all 0.2s'
                                    }}>
                                    {SECTION_LABELS[s] || s}
                                </button>
                            ))}
                        </div>
                        {brief[activeTab] && (
                            <SectionCard section={activeTab} data={brief[activeTab]} feedback={feedback} onFeedback={handleFeedback} isShareView={isShareView} index={0} />
                        )}
                    </div>
                )}

                {/* CARDS VIEW */}
                {view === 'cards' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'slideUp 0.3s ease' }}>
                        {sections.map((s, index) => (
                            <SectionCard key={s} section={s} data={brief[s]} feedback={feedback} onFeedback={handleFeedback} isShareView={isShareView} index={index} />
                        ))}
                    </div>
                )}

                {/* Sources */}
                {sources.length > 0 && (
                    <div style={{ marginTop: '4rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '800', marginBottom: '1rem' }}>
                            Data Sources
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {sources.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer"
                                    style={{ color: 'rgba(163,230,53,0.7)', fontSize: '0.8rem', textDecoration: 'none', wordBreak: 'break-all', transition: 'color 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(163,230,53,0.7)'}>
                                    {url}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            {showCustomize && <CustomizePanel onClose={() => setShowCustomize(false)} />}
        </div>
    )
}

function SectionCard({ section, data, feedback, onFeedback, isShareView, index = 0 }) {
    if (!data) return null
    const content = typeof data === 'string' ? data : data.content
    const confidence = typeof data === 'object' ? data.confidence : null

    const confidenceStyle = {
        high: { bg: '#22c55e15', color: '#22c55e', border: '#22c55e30' },
        medium: { bg: '#f59e0b15', color: '#f59e0b', border: '#f59e0b30' },
        low: { bg: '#ef444415', color: '#ef4444', border: '#ef444430' }
    }
    const conf = confidenceStyle[confidence] || confidenceStyle.medium

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
                background: 'rgba(19,19,26,0.8)', border: '1px solid rgba(255,255,255,0.07)', 
                borderRadius: '18px', padding: '2rem', position: 'relative',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                overflow: 'hidden'
            }}
        >
            <div style={{ 
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                background: `linear-gradient(to bottom, ${getAvatarColor(section)}60, transparent)`,
                borderRadius: '99px 0 0 99px'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '800' }}>
                    {SECTION_LABELS[section] || section}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {confidence && (
                        <span style={{ 
                            fontSize: '0.58rem', fontWeight: '800', textTransform: 'uppercase', 
                            padding: '0.2rem 0.6rem', borderRadius: '6px',
                            background: conf.bg, color: conf.color, border: `1px solid ${conf.border}`
                        }}>
                            {confidence} Confidence
                        </span>
                    )}
                    {!isShareView && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => onFeedback(section, feedback[section] === 'up' ? null : 'up')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: feedback[section] === 'up' ? 'var(--accent)' : 'rgba(255,255,255,0.2)', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                                onMouseLeave={e => { if (feedback[section] !== 'up') e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
                            >
                                <ThumbsUp size={14} />
                            </button>
                            <button onClick={() => onFeedback(section, feedback[section] === 'down' ? null : 'down')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: feedback[section] === 'down' ? 'var(--danger)' : 'rgba(255,255,255,0.2)', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                onMouseLeave={e => { if (feedback[section] !== 'down') e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
                            >
                                <ThumbsDown size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: '1.8' }}>
                {(() => {
                    if (!content) return null
                    if (typeof content === 'string') {
                        return <p style={{ margin: 0 }}>{content}</p>
                    }
                    if (Array.isArray(content)) {
                        return content.map((item, idx) => {
                            if (!item) return null
                            if (typeof item === 'string') {
                                return <p key={idx} style={{ marginBottom: '1rem' }}>{item}</p>
                            }
                            if (typeof item === 'object') {
                                return (
                                    <div key={idx} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                                        {Object.entries(item).map(([k, v], i) => (
                                            <div key={i} style={{ marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: '700', color: '#fff', marginRight: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}:</span>
                                                <span>{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                            return null
                        })
                    }
                    if (typeof content === 'object') {
                        return Object.entries(content).map(([k, v], idx) => (
                            <div key={idx} style={{ marginBottom: '0.75rem' }}>
                                <span style={{ fontWeight: '700', color: '#fff', marginRight: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}:</span>
                                <span>{String(v)}</span>
                            </div>
                        ))
                    }
                    return null
                })()}
            </div>
        </motion.div>
    )
}
