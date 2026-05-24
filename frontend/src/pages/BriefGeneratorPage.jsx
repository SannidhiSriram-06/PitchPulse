import { useState, useEffect, useRef } from 'react'
import { useClerkToken } from '../hooks/useClerkToken'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Sun, Moon, Zap } from 'lucide-react'
import useBriefStore from '../store/briefStore'
import api from '../lib/api'
import usePrefsStore from '../store/prefsStore'
import useIsMobile from '../hooks/useIsMobile'
import useThemeStore from '../store/themeStore'
import RateLimitModal from '../components/RateLimitModal'
import { motion, AnimatePresence } from 'framer-motion'

const getAvatarColor = (name) => {
  const colors = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#f97316','#84cc16']
  return colors[(name || '').charCodeAt(0) % colors.length]
}

const STATUS_MESSAGES = (company) => [
    `Searching for recent news on ${company}...`,
    'Analyzing financial signals...',
    'Checking social sentiment...',
    'Writing your brief...',
    'Almost done...',
]

const ALL_SECTIONS = [
    { key: 'summary', label: 'Summary' },
    { key: 'news', label: 'News' },
    { key: 'financials', label: 'Financials' },
    { key: 'social_sentiment', label: 'Social Sentiment' },
    { key: 'talking_points', label: 'Talking Points' },
    { key: 'watch_out_for', label: 'Watch Out For' },
]

const TEMPLATES = {
  'Cold Call': "Focus on their pain points, recent challenges, and what would make them receptive to a new vendor. What's the best opening angle?",
  'First Meeting': "What are their current strategic priorities? What business problems are they actively trying to solve right now?",
  'Partnership': "What are their partnership history and ecosystem strategy? Where are the gaps we could fill as a partner?",
  'Renewal': "What's their satisfaction level likely to be? What risks exist for churn? What new value can we offer to strengthen renewal?"
}

export default function BriefGeneratorPage() {
    useClerkToken()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { generating, statusMessage, generateBrief, setStatusMessage } = useBriefStore()
    const { defaultLength } = usePrefsStore()
    const { theme, toggleTheme } = useThemeStore()

    const [comparisonMode, setComparisonMode] = useState(false)
    const [company, setCompany] = useState(searchParams.get('company') || '')
    const [company2, setCompany2] = useState('')
    const [length, setLength] = useState(defaultLength || 'medium')
    const [sections, setSections] = useState(ALL_SECTIONS.map((s) => s.key))
    const [customPrompt, setCustomPrompt] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [error, setError] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [rateLimitData, setRateLimitData] = useState(null)
    const statusInterval = useRef(null)

    const toggleSection = (key) => {
        setSections((prev) =>
            prev.includes(key) ? (prev.length > 1 ? prev.filter((s) => s !== key) : prev) : [...prev, key]
        )
    }

    const startStatusCycle = (companyName) => {
        const messages = STATUS_MESSAGES(companyName)
        let i = 0
        setStatusMessage(messages[0])
        statusInterval.current = setInterval(() => {
            i++
            if (i < messages.length) setStatusMessage(messages[i])
            else clearInterval(statusInterval.current)
        }, 3000)
    }

    const handleGenerate = async () => {
        if (comparisonMode) {
            if (!company.trim() || !company2.trim()) { setError('Enter both company names.'); return }
            setError('')
            setIsGenerating(true)
            startStatusCycle(`${company.trim()} vs ${company2.trim()}`)
            try {
                const res = await api.post('/api/brief/compare', {
                    company1: company.trim(),
                    company2: company2.trim(),
                    length,
                    custom_prompt: customPrompt.trim()
                })
                clearInterval(statusInterval.current)
                setIsGenerating(false)
                navigate(`/brief/${res.data.brief_id}`)
            } catch (err) {
                clearInterval(statusInterval.current)
                setIsGenerating(false)
                if (err.response?.status === 429) {
                    setRateLimitData({ resetInMinutes: err.response.data?.reset_in_minutes })
                    return
                }
                setError(err.response?.data?.error || 'Generation failed. Try again.')
            }
        } else {
            if (!company.trim()) { setError('Enter a company name.'); return }
            setError('')
            startStatusCycle(company.trim())
            try {
                const result = await generateBrief(company.trim(), length, sections, customPrompt.trim())
                clearInterval(statusInterval.current)
                navigate(`/brief/${result.brief_id}`)
            } catch (err) {
                clearInterval(statusInterval.current)
                if (err.response?.status === 429) {
                    setRateLimitData({ resetInMinutes: err.response.data?.reset_in_minutes })
                    return
                }
                setError(err.response?.data?.error || 'Generation failed. Try again.')
            }
        }
    }

    useEffect(() => () => clearInterval(statusInterval.current), [])

    const isMobile = useIsMobile()

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>

            {/* Nav */}
            <nav style={{ 
                borderBottom: '1px solid rgba(255,255,255,0.06)', 
                padding: '0 1rem', 
                display: 'flex', alignItems: 'center', 
                height: '60px', gap: '1rem', 
                background: 'rgba(13,13,18,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', 
                position: 'sticky', top: 0, zIndex: 100 
            }}>
                <button onClick={() => navigate('/dashboard')}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
                    <ArrowLeft size={16} /> Dashboard
                </button>
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                    <span style={{ color: '#fff' }}>Pitch</span><span style={{ color: 'var(--accent)' }}>Pulse</span>
                </div>
            </nav>

            {/* Loading overlay */}
            <AnimatePresence>
                {(generating || isGenerating) && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(13,13,18,0.92)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            transition={{ duration: 0.2 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                            <div style={{ 
                                width: '48px', height: '48px', 
                                border: '2px solid rgba(255,255,255,0.08)', 
                                borderTop: '2px solid var(--accent)', 
                                borderRadius: '50%', 
                                animation: 'spin 0.7s linear infinite' 
                            }} />
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>{statusMessage}</p>
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Our AI agents are working. This takes 20–60 seconds.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: isMobile ? '2rem 1rem 6rem' : '3.5rem 1.5rem' }}>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '1.75rem', letterSpacing: '-1px', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '300' }}>Generate a </span>
                        <span style={{ color: '#fff', fontWeight: '900' }}>Brief</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Tailor your intelligence for the upcoming meeting.</p>
                </motion.div>

                {/* Mode Toggle */}
                <motion.div 
                    initial={{ opacity: 0, y: 16 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ 
                        display: 'flex', 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '1px solid rgba(255,255,255,0.07)', 
                        borderRadius: '12px', 
                        padding: '3px', 
                        marginBottom: '2.5rem' 
                    }}>
                    <button onClick={() => setComparisonMode(false)}
                        style={{ 
                            flex: 1, padding: '0.75rem', 
                            borderRadius: '10px', 
                            border: !comparisonMode ? '1px solid rgba(163,230,53,0.25)' : '1px solid transparent',
                            background: !comparisonMode ? 'rgba(163,230,53,0.12)' : 'transparent', 
                            color: !comparisonMode ? 'var(--accent)' : 'rgba(255,255,255,0.35)', 
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: !comparisonMode ? '700' : '500',
                            transition: 'all 0.2s'
                        }}>
                        Single Company
                    </button>
                    <button onClick={() => setComparisonMode(true)}
                        style={{ 
                            flex: 1, padding: '0.75rem', 
                            borderRadius: '10px', 
                            border: comparisonMode ? '1px solid rgba(163,230,53,0.25)' : '1px solid transparent',
                            background: comparisonMode ? 'rgba(163,230,53,0.12)' : 'transparent', 
                            color: comparisonMode ? 'var(--accent)' : 'rgba(255,255,255,0.35)', 
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: comparisonMode ? '700' : '500',
                            transition: 'all 0.2s'
                        }}>
                        Compare Two
                    </button>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    
                    {/* Company Inputs */}
                    <motion.div 
                        initial={{ opacity: 0, y: 16 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{ display: 'flex', gap: '1rem', flexDirection: (isMobile || comparisonMode) ? 'column' : 'row' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <label style={{ display: 'block', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '0.75rem' }}>
                                {comparisonMode ? 'Company 1' : 'Company Name'}
                            </label>
                            <input
                                value={company} onChange={(e) => setCompany(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                placeholder="e.g. Infosys"
                                autoFocus
                                style={{ 
                                    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', 
                                    borderRadius: '12px', padding: '1rem', color: '#fff', 
                                    fontSize: '1rem', fontFamily: 'monospace', outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => { 
                                    e.target.style.border = '1px solid rgba(163,230,53,0.4)'; 
                                    e.target.style.boxShadow = '0 0 0 3px rgba(163,230,53,0.08)'; 
                                }}
                                onBlur={(e) => { 
                                    e.target.style.border = '1px solid rgba(255,255,255,0.08)'; 
                                    e.target.style.boxShadow = 'none'; 
                                }}
                            />
                        </div>
                        {comparisonMode && (
                            <div style={{ flex: 1, position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '0.75rem' }}>Company 2</label>
                                <input
                                    value={company2} onChange={(e) => setCompany2(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                    placeholder="e.g. TCS"
                                    style={{ 
                                        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', 
                                        borderRadius: '12px', padding: '1rem', color: '#fff', 
                                        fontSize: '1rem', fontFamily: 'monospace', outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => { 
                                        e.target.style.border = '1px solid rgba(163,230,53,0.4)'; 
                                        e.target.style.boxShadow = '0 0 0 3px rgba(163,230,53,0.08)'; 
                                    }}
                                    onBlur={(e) => { 
                                        e.target.style.border = '1px solid rgba(255,255,255,0.08)'; 
                                        e.target.style.boxShadow = 'none'; 
                                    }}
                                />
                            </div>
                        )}
                    </motion.div>

                    {/* Meeting Type */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <label style={{ display: 'block', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '0.75rem' }}>Meeting Context</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {Object.entries(TEMPLATES).map(([key, value]) => {
                                const active = selectedTemplate === key
                                return (
                                    <button key={key} onClick={() => {
                                        if (active) {
                                            setSelectedTemplate(null)
                                            setCustomPrompt('')
                                        } else {
                                            setSelectedTemplate(key)
                                            setCustomPrompt(value)
                                        }
                                    }}
                                        style={{ 
                                            padding: '0.5rem 1rem', borderRadius: '8px', 
                                            border: active ? '1px solid rgba(163,230,53,0.25)' : '1px solid rgba(255,255,255,0.07)', 
                                            background: active ? 'rgba(163,230,53,0.1)' : 'rgba(255,255,255,0.04)', 
                                            color: active ? 'var(--accent)' : 'rgba(255,255,255,0.4)', 
                                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: active ? '700' : '500',
                                            transition: 'all 0.2s'
                                        }}>
                                        {key}
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* Brief Length */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 3 * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <label style={{ display: 'block', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '0.75rem' }}>Output Depth</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['short', 'medium', 'long'].map((l) => (
                                <button key={l} onClick={() => setLength(l)}
                                    style={{ 
                                        flex: 1, padding: '0.75rem', borderRadius: '8px', 
                                        border: length === l ? '1px solid rgba(163,230,53,0.25)' : '1px solid rgba(255,255,255,0.07)', 
                                        background: length === l ? 'rgba(163,230,53,0.1)' : 'rgba(255,255,255,0.04)', 
                                        color: length === l ? 'var(--accent)' : 'rgba(255,255,255,0.4)', 
                                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: length === l ? '700' : '500',
                                        textTransform: 'capitalize'
                                    }}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {!comparisonMode && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }} 
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 4 * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <label style={{ display: 'block', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '0.75rem' }}>Included Sections</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {ALL_SECTIONS.map((s) => {
                                    const active = sections.includes(s.key)
                                    return (
                                        <button key={s.key} onClick={() => toggleSection(s.key)}
                                            style={{ 
                                                padding: '0.5rem 1rem', borderRadius: '8px', 
                                                border: active ? '1px solid rgba(163,230,53,0.25)' : '1px solid rgba(255,255,255,0.07)', 
                                                background: active ? 'rgba(163,230,53,0.1)' : 'rgba(255,255,255,0.04)', 
                                                color: active ? 'var(--accent)' : 'rgba(255,255,255,0.4)', 
                                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: active ? '700' : '500',
                                                transition: 'all 0.2s'
                                            }}>
                                            {s.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Custom Focus */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 5 * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <label style={{ display: 'block', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '0.75rem' }}>Custom Focus</label>
                        <textarea
                            value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g. Focus on their recent AI expansion plans..."
                            maxLength={500}
                            style={{ 
                                width: '100%', minHeight: '100px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', 
                                borderRadius: '12px', padding: '1rem', color: '#fff', 
                                fontSize: '0.9rem', outline: 'none', resize: 'vertical',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => { 
                                e.target.style.border = '1px solid rgba(163,230,53,0.4)'; 
                                e.target.style.boxShadow = '0 0 0 3px rgba(163,230,53,0.08)'; 
                            }}
                            onBlur={(e) => { 
                                e.target.style.border = '1px solid rgba(255,255,255,0.07)'; 
                                e.target.style.boxShadow = 'none'; 
                            }}
                        />
                    </motion.div>

                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '0.875rem 1rem', color: '#ef4444', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}

                    <motion.button 
                        onClick={handleGenerate} 
                        disabled={generating || isGenerating}
                        whileHover={{ scale: 1.01, boxShadow: '0 0 0 1px rgba(163,230,53,0.4), 0 12px 40px rgba(163,230,53,0.25)' }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        style={{ 
                            width: '100%', background: 'var(--accent)', border: 'none', 
                            borderRadius: '14px', padding: '1.1rem', 
                            color: '#000', fontSize: '1rem', fontWeight: '900', 
                            cursor: (generating || isGenerating) ? 'not-allowed' : 'pointer', 
                            boxShadow: '0 0 0 1px rgba(163,230,53,0.3), 0 8px 32px rgba(163,230,53,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                        }}
                    >
                        <Zap size={18} fill="currentColor" />
                        {comparisonMode ? 'Compare Companies' : 'Generate Brief'}
                    </motion.button>

                </motion.div>
            </div>
            {rateLimitData && (
                <RateLimitModal
                    resetInMinutes={rateLimitData.resetInMinutes}
                    onClose={() => setRateLimitData(null)}
                />
            )}
        </div>
    )
}
