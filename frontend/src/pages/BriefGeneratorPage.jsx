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
                borderBottom: '1px solid var(--border)', 
                padding: '0 1rem', 
                display: 'flex', alignItems: 'center', 
                height: '64px', gap: '1rem', 
                background: 'var(--bg)dd', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', 
                position: 'sticky', top: 0, zIndex: 100 
            }}>
                <button onClick={() => navigate('/dashboard')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
                    <ArrowLeft size={16} /> Dashboard
                </button>
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                    <span style={{ color: '#fff' }}>Pitch</span><span style={{ color: 'var(--accent)' }}>Pulse</span>
                </div>
            </nav>

            {/* Loading overlay */}
            {(generating || isGenerating) && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)f2', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                    <div style={{ 
                        width: '48px', height: '48px', 
                        border: '3px solid var(--border)', 
                        borderTop: '3px solid var(--accent)', 
                        borderRadius: '50%', 
                        animation: 'spin 0.7s linear infinite' 
                    }} />
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--accent)', fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.5rem' }}>{statusMessage}</p>
                        <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem' }}>Our AI agents are working. This takes 20–60 seconds.</p>
                    </div>
                </div>
            )}

            {/* Content */}
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: isMobile ? '2.5rem 1rem 5rem' : '4rem 1.5rem' }}>

                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '300', letterSpacing: '-1px', marginBottom: '0.5rem' }}>
                        Generate a <span style={{ color: 'var(--accent)', fontWeight: '800' }}>Brief</span>
                    </h1>
                    <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>Tailor your intelligence for the upcoming meeting.</p>
                </div>

                {/* Mode Toggle */}
                <div style={{ 
                    display: 'flex', 
                    background: 'var(--surface)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius)', 
                    padding: '4px', 
                    marginBottom: '2.5rem' 
                }}>
                    <button onClick={() => setComparisonMode(false)}
                        style={{ 
                            flex: 1, padding: '0.75rem', 
                            borderRadius: 'calc(var(--radius) - 2px)', 
                            border: !comparisonMode ? '1px solid var(--border-accent)' : '1px solid transparent',
                            background: !comparisonMode ? 'var(--accent-soft)' : 'transparent', 
                            color: !comparisonMode ? 'var(--accent)' : 'var(--text-sec)', 
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: !comparisonMode ? '700' : '500',
                            transition: 'all 0.2s'
                        }}>
                        Single Company
                    </button>
                    <button onClick={() => setComparisonMode(true)}
                        style={{ 
                            flex: 1, padding: '0.75rem', 
                            borderRadius: 'calc(var(--radius) - 2px)', 
                            border: comparisonMode ? '1px solid var(--border-accent)' : '1px solid transparent',
                            background: comparisonMode ? 'var(--accent-soft)' : 'transparent', 
                            color: comparisonMode ? 'var(--accent)' : 'var(--text-sec)', 
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: comparisonMode ? '700' : '500',
                            transition: 'all 0.2s'
                        }}>
                        Compare Two
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    
                    {/* Company Inputs */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: (isMobile || comparisonMode) ? 'column' : 'row' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '0.75rem' }}>
                                {comparisonMode ? 'Company 1' : 'Company Name'}
                            </label>
                            <input
                                value={company} onChange={(e) => setCompany(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                placeholder="e.g. Infosys"
                                autoFocus
                                style={{ 
                                    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', 
                                    borderRadius: 'var(--radius)', padding: '1rem', color: 'var(--text)', 
                                    fontSize: '1rem', fontFamily: 'monospace', outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = 'var(--border-accent)'; e.target.style.boxShadow = 'var(--accent-glow)'; }}
                                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        {comparisonMode && (
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '0.75rem' }}>Company 2</label>
                                <input
                                    value={company2} onChange={(e) => setCompany2(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                    placeholder="e.g. TCS"
                                    style={{ 
                                        width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', 
                                        borderRadius: 'var(--radius)', padding: '1rem', color: 'var(--text)', 
                                        fontSize: '1rem', fontFamily: 'monospace', outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = 'var(--border-accent)'; e.target.style.boxShadow = 'var(--accent-glow)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Meeting Type */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '1rem' }}>Meeting Context</label>
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
                                            padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', 
                                            border: `1px solid ${active ? 'var(--border-accent)' : 'var(--border)'}`, 
                                            background: active ? 'var(--accent-soft)' : 'transparent', 
                                            color: active ? 'var(--accent)' : 'var(--text-sec)', 
                                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: active ? '700' : '500',
                                            transition: 'all 0.2s'
                                        }}>
                                        {key}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Brief Length */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '1rem' }}>Output Depth</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['short', 'medium', 'long'].map((l) => (
                                <button key={l} onClick={() => setLength(l)}
                                    style={{ 
                                        flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', 
                                        border: `1px solid ${length === l ? 'var(--border-accent)' : 'var(--border)'}`, 
                                        background: length === l ? 'var(--accent-soft)' : 'transparent', 
                                        color: length === l ? 'var(--accent)' : 'var(--text-sec)', 
                                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: length === l ? '700' : '500',
                                        textTransform: 'capitalize'
                                    }}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!comparisonMode && (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '1rem' }}>Included Sections</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {ALL_SECTIONS.map((s) => {
                                    const active = sections.includes(s.key)
                                    return (
                                        <button key={s.key} onClick={() => toggleSection(s.key)}
                                            style={{ 
                                                padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', 
                                                border: `1px solid ${active ? 'var(--border-accent)' : 'var(--border)'}`, 
                                                background: active ? 'var(--accent-soft)' : 'transparent', 
                                                color: active ? 'var(--accent)' : 'var(--text-sec)', 
                                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: active ? '700' : '500',
                                                transition: 'all 0.2s'
                                            }}>
                                            {s.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Custom Focus */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', marginBottom: '1rem' }}>Custom Focus</label>
                        <textarea
                            value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g. Focus on their recent AI expansion plans..."
                            maxLength={500}
                            style={{ 
                                width: '100%', minHeight: '100px', background: 'var(--surface)', border: '1px solid var(--border)', 
                                borderRadius: 'var(--radius)', padding: '1rem', color: 'var(--text)', 
                                fontSize: '0.9rem', outline: 'none', resize: 'vertical',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--border-accent)'; e.target.style.boxShadow = 'var(--accent-glow)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>

                    {error && (
                        <div style={{ background: 'var(--danger)10', border: '1px solid var(--danger)30', borderRadius: 'var(--radius)', padding: '1rem', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: '600' }}>
                            {error}
                        </div>
                    )}

                    <button onClick={handleGenerate} disabled={generating || isGenerating}
                        style={{ 
                            width: '100%', background: 'var(--accent)', border: 'none', 
                            borderRadius: 'var(--radius-lg)', padding: '1.25rem', 
                            color: '#000', fontSize: '1rem', fontWeight: '800', 
                            cursor: (generating || isGenerating) ? 'not-allowed' : 'pointer', 
                            boxShadow: 'var(--accent-glow)',
                            transition: 'all 0.2s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                        }}
                        onMouseEnter={(e) => { if (!generating && !isGenerating) e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <Zap size={18} fill="currentColor" />
                        {comparisonMode ? 'Compare Companies' : 'Generate Brief'}
                    </button>

                </div>
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
