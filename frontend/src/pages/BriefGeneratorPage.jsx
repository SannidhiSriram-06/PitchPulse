import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Lock, FileText, AlertTriangle, HelpCircle, Sliders, Calendar, Clock, ChevronDown, Paperclip, X, Brain } from 'lucide-react'
import api from '../lib/api'
import Layout from '../components/Layout'
import useAuthStore from '../store/authStore'
import RateLimitModal from '../components/RateLimitModal'
import { ALL_SECTIONS, MODELS } from '../utils/constants'
import { useToast } from '../components/Toast'
import { StorageWidget } from '../components/StorageWidget'
import StreamingBriefPreview from '../components/StreamingBriefPreview'

const STATUS_MESSAGES = [
  { text: 'Parsing your intent…',            sub: 'Understanding your goal and target company'        },
  { text: 'Searching live web sources…',     sub: 'Scanning news, filings, and announcements'         },
  { text: 'Analysing financial signals…',    sub: 'Revenue, funding, market position'                 },
  { text: 'Mapping the competitive field…',  sub: 'Tracking rival moves'                              },
  { text: 'Finding relevant job signals…',   sub: 'What their hiring reveals about priorities'        },
  { text: 'Building talking points…',        sub: 'Tailored to your specific pitch and product'       },
  { text: 'Almost ready…',                   sub: 'Final quality check'                               },
]

export default function BriefGeneratorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, consumeBriefCredit } = useAuthStore()
  const toast = useToast()

  const initialCompany = new URLSearchParams(location.search).get('company') || ''

  // mock compare mode
  const [generationType, setGenerationType] = useState('single') // 'single' | 'compare'
  const [meetingType, setMeetingType] = useState('') // 'cold_call' | 'first_meeting' | 'partnership' | 'renewal' | ''

  const [query, setQuery] = useState(initialCompany)
  const [length, setLength] = useState(user?.default_brief_length || 'medium')
  const DEFAULT_SECTIONS = ALL_SECTIONS.map(s => s.id).filter(id => id !== 'job_signals' && id !== 'social_sentiment')
  const [sections, setSections] = useState(DEFAULT_SECTIONS)
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-4-scout-17b-16e-instruct')
  const [deepMindMode, setDeepMindMode] = useState(false)
  const [showModelPanel, setShowModelPanel] = useState(false)

  // Scheduling state
  const [mode, setMode] = useState('now') // 'now' | 'schedule'
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [recurring, setRecurring] = useState('')

  // PDF context
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfContext, setPdfContext] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const fileRef = useRef(null)

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [statusStep, setStatusStep] = useState(0)
  const [error, setError] = useState('')
  const [rateLimitData, setRateLimitData] = useState(null)
  const [streamingBrief, setStreamingBrief] = useState(null)

  const modelPanelRef = useRef(null)

  useEffect(() => {
    if (!showModelPanel) return
    const handler = (e) => {
      if (modelPanelRef.current && !modelPanelRef.current.contains(e.target)) {
        setShowModelPanel(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showModelPanel])

  useEffect(() => {
    if (!generating) return
    const id = setInterval(() => {
      setStatusStep(s => Math.min(s + 1, STATUS_MESSAGES.length - 1))
    }, 9000)
    return () => clearInterval(id)
  }, [generating])

  const handlePdfSelect = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('PDF must be under 5MB')
      return
    }
    setPdfFile(file)
    setPdfLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/api/extract-pdf', formData)
      setPdfContext(res.data.text)
      toast.success(`PDF loaded — ${res.data.pages} page${res.data.pages !== 1 ? 's' : ''} extracted`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not read PDF'
      toast.error(msg)
      setPdfFile(null)
      setPdfContext('')
    } finally {
      setPdfLoading(false)
    }
  }

  const handlePdfClear = () => {
    setPdfFile(null)
    setPdfContext('')
  }

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!query.trim()) { setError('Please describe what you want to research'); return }
    if (pdfLoading) { setError('Still processing your PDF — please wait'); return }
    setError('')

    let finalPrompt = query.trim()
    if (meetingType) {
      finalPrompt = `[Meeting Type: ${meetingType.replace('_', ' ')}] ${finalPrompt}`
    }
    if (generationType === 'compare') {
      finalPrompt = `[Compare Mode] ${finalPrompt}`
    }

    if (mode === 'schedule') {
      if (!scheduleDate || !scheduleTime) {
        setError('Please select both a date and time for delivery')
        return
      }
      const localDateTimeStr = `${scheduleDate}T${scheduleTime}`
      const scheduledDate = new Date(localDateTimeStr)
      if (scheduledDate <= new Date()) {
        setError('Scheduled delivery time must be in the future')
        return
      }

      setGenerating(true)
      try {
        await api.post('/api/scheduled', {
          prompt: finalPrompt,
          scheduled_for: scheduledDate.toISOString(),
          recurring: recurring || null,
          length,
          sections
        })
        toast.success('Brief scheduled successfully!')
        navigate('/dashboard')
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to schedule brief. Please try again.')
      } finally {
        setGenerating(false)
      }
      return
    }

    setGenerating(true)
    setStatusStep(0)

    try {
      const res = await api.post('/api/brief', {
        query:       finalPrompt,
        length,
        sections,
        model_id:    selectedModel,
        deep_mind:   deepMindMode,
        pdf_context: pdfContext || undefined
      })

      consumeBriefCredit({
        briefs_remaining_this_hour: res.data.briefs_remaining_this_hour,
        reset_at:                   res.data.reset_at
      })

      setGenerating(false)
      setStreamingBrief({ id: res.data.id, data: res.data.brief })
    } catch (err) {
      setGenerating(false)
      if (err.response?.status === 429) {
        setRateLimitData({
          resetInMinutes: err.response.data.reset_in_minutes,
          resetAt:        err.response.data.reset_at
        })
      } else {
        setError(err.response?.data?.error || 'Failed to generate brief. Please try again.')
      }
    }
  }

  const toggleSection = (id) =>
    setSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0]

  return (
    <Layout>
      {rateLimitData && (
        <RateLimitModal
          isOpen
          onClose={() => setRateLimitData(null)}
          resetInMinutes={rateLimitData.resetInMinutes}
          resetAt={rateLimitData.resetAt}
        />
      )}

      {/* Model picker panel */}
      <AnimatePresence>
        {showModelPanel && (
          <>
            <div className="fixed inset-0 z-[400]" onClick={() => setShowModelPanel(false)} />
            <motion.div
              ref={modelPanelRef}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed top-20 right-4 z-[500] w-72 bg-surface-light dark:bg-[#1c1c1c] border border-border dark:border-[rgba(255,255,255,0.10)] rounded-2xl shadow-2xl p-2 overflow-hidden"
            >
              <div className="px-3 py-2 text-[10px] font-bold text-tx-tertiary uppercase tracking-widest border-b border-border dark:border-[rgba(255,255,255,0.06)] mb-2">
                Select AI Model
              </div>
              <div className="px-3 py-1 text-[9px] font-bold text-tx-tertiary/50 uppercase tracking-widest mb-1">Free</div>
              {MODELS.filter(m => m.tier === 'free').map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedModel(m.id); setShowModelPanel(false) }}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-start justify-between gap-2 ${
                    selectedModel === m.id ? 'bg-accent/10 text-accent' : 'hover:bg-surface-raised text-tx-secondary hover:text-tx-primary'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{m.name}</div>
                    <div className="text-[10px] text-tx-tertiary mt-0.5 leading-relaxed">{m.desc}</div>
                  </div>
                </button>
              ))}
              <div className="px-3 py-1 text-[9px] font-bold text-indigo-400/70 uppercase tracking-widest mt-3 mb-1">Pro</div>
              {MODELS.filter(m => m.tier === 'pro').map(m => {
                const locked = user?.tier !== 'pro'
                return (
                  <button
                    key={m.id}
                    disabled={locked}
                    onClick={() => { if (!locked) { setSelectedModel(m.id); setShowModelPanel(false) } }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-start justify-between gap-2 ${
                      selectedModel === m.id ? 'bg-accent/10 text-accent' : locked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-raised text-tx-secondary hover:text-tx-primary'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{m.name}</div>
                      <div className="text-[10px] text-tx-tertiary mt-0.5 leading-relaxed">{m.desc}</div>
                    </div>
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className={streamingBrief ? 'max-w-3xl mx-auto' : 'max-w-xl mx-auto'}>
        <AnimatePresence mode="wait">
          {streamingBrief ? (
            <motion.div key="streaming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    setStreamingBrief(null)
                    setQuery('')
                    setPdfFile(null)
                    setPdfContext('')
                    setError('')
                  }}
                  className="text-xs text-tx-tertiary hover:text-tx-primary border border-border dark:border-[rgba(255,255,255,0.06)] px-3 py-1.5 rounded-lg transition-all hover:border-accent/30 active:scale-95"
                >
                  ← New brief
                </button>
              </div>
              <StreamingBriefPreview
                brief={streamingBrief.data}
                briefId={streamingBrief.id}
                onOpenFull={() => navigate(`/brief/${streamingBrief.id}`)}
              />
            </motion.div>
          ) : generating ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center text-center border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl bg-surface-light dark:bg-surface relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 h-0.5 bg-accent/10 w-full">
                <motion.div
                  className="h-full bg-accent rounded-r-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(((statusStep + 1) / STATUS_MESSAGES.length) * 100, 95)}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 rounded-full border-2 border-accent/20 border-t-accent flex items-center justify-center mb-8"
              >
                <Sparkles className="w-8 h-8 text-accent" />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div key={statusStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{  opacity: 0, y: -10 }} className="space-y-1.5 px-8">
                  <p className="text-lg font-display font-semibold">{STATUS_MESSAGES[statusStep].text}</p>
                  <p className="text-sm text-tx-tertiary">{STATUS_MESSAGES[statusStep].sub}</p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-display font-bold text-tx-primary-light dark:text-tx-primary">
                  Generate a Brief
                </h1>
                <p className="text-sm text-tx-secondary mt-1">
                  Enter a company name and we'll do the rest.
                </p>
              </div>

              {/* Mode Toggle (Now vs Schedule) */}
              <div className="flex bg-surface-raised-light dark:bg-surface-raised p-1 rounded-xl w-fit border border-border dark:border-[rgba(255,255,255,0.06)]">
                <button
                  type="button"
                  onClick={() => setMode('now')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'now' ? 'bg-surface-light dark:bg-surface shadow-sm text-tx-primary-light dark:text-tx-primary' : 'text-tx-tertiary hover:text-tx-secondary'
                  }`}
                >
                  Generate Now
                </button>
                <button
                  type="button"
                  onClick={() => setMode('schedule')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'schedule' ? 'bg-surface-light dark:bg-surface shadow-sm text-tx-primary-light dark:text-tx-primary' : 'text-tx-tertiary hover:text-tx-secondary'
                  }`}
                >
                  Schedule Delivery
                </button>
              </div>

              {/* Single Company / Compare Two */}
              <div className="flex bg-surface-raised-light dark:bg-surface-raised p-1 rounded-xl w-full border border-border dark:border-[rgba(255,255,255,0.06)]">
                <button
                  type="button"
                  onClick={() => setGenerationType('single')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    generationType === 'single' ? 'bg-surface-light dark:bg-surface shadow-sm text-accent font-bold' : 'text-tx-secondary'
                  }`}
                >
                  Single Company
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationType('compare')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    generationType === 'compare' ? 'bg-surface-light dark:bg-surface shadow-sm text-accent font-bold' : 'text-tx-secondary'
                  }`}
                >
                  Compare Two
                </button>
              </div>

              {/* Delivery Settings if Schedule */}
              {mode === 'schedule' && (
                <div className="bg-surface-light dark:bg-[#141414] border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs uppercase font-bold text-tx-tertiary tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Delivery Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-tx-tertiary mb-1.5">Schedule Date</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={e => setScheduleDate(e.target.value)}
                        required
                        className="w-full bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-xl px-4 py-2.5 text-sm focus:border-accent/50 focus:outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-tx-tertiary mb-1.5">Schedule Time</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                        required
                        className="w-full bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-xl px-4 py-2.5 text-sm focus:border-accent/50 focus:outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-tx-tertiary mb-1.5">Recurrence</label>
                    <select
                      value={recurring}
                      onChange={e => setRecurring(e.target.value)}
                      className="w-full bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-xl px-4 py-2.5 text-sm focus:border-accent/50 focus:outline-none dark:text-white"
                    >
                      <option value="">One-time delivery</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              )}

              {/* MEETING TYPE */}
              <div>
                <h3 className="text-xs uppercase font-bold text-tx-tertiary tracking-wider mb-2">Meeting Type (Optional)</h3>
                <div className="flex flex-wrap gap-2">
                  {['Cold Call', 'First Meeting', 'Partnership', 'Renewal'].map(type => {
                    const id = type.toLowerCase().replace(' ', '_')
                    const selected = meetingType === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setMeetingType(selected ? '' : id)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          selected ? 'bg-accent/15 border-accent text-accent' : 'bg-surface-raised-light dark:bg-surface-raised border-border dark:border-[rgba(255,255,255,0.06)] text-tx-secondary hover:border-tx-secondary'
                        }`}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* BRIEF LENGTH */}
              <div>
                <h3 className="text-xs uppercase font-bold text-tx-tertiary tracking-wider mb-2">Brief Length</h3>
                <div className="grid grid-cols-3 gap-2 bg-surface-raised-light dark:bg-surface-raised p-1 rounded-xl border border-border dark:border-[rgba(255,255,255,0.06)]">
                  {['short', 'medium', 'long'].map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLength(l)}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                        length === l ? 'bg-surface-light dark:bg-surface text-accent font-bold shadow-sm' : 'text-tx-secondary'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTIONS TO INCLUDE */}
              <div>
                <h3 className="text-xs uppercase font-bold text-tx-tertiary tracking-wider mb-2">Sections to Include</h3>
                <div className="flex flex-wrap gap-2">
                  {ALL_SECTIONS.map(s => {
                    const active = sections.includes(s.id)
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSection(s.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          active ? 'border-accent bg-accent/5 text-accent' : 'border-border dark:border-[rgba(255,255,255,0.06)] text-tx-secondary hover:border-tx-secondary'
                        }`}
                      >
                        <span className="mr-1">{s.icon}</span> {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* INPUT PROMPT TEXTAREA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-bold text-tx-tertiary tracking-wider">Company Name & Context</h3>
                  <div className="flex items-center gap-2">
                    {/* Add PDF inline inside context header */}
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf"
                      className="sr-only"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handlePdfSelect(file)
                        e.target.value = ''
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                        pdfFile ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface-raised-light dark:bg-surface-raised border-border dark:border-[rgba(255,255,255,0.06)] text-tx-secondary hover:text-tx-primary'
                      }`}
                    >
                      <Paperclip className="w-3 h-3" />
                      {pdfFile ? 'PDF Added' : 'Add PDF'}
                    </button>

                    {/* Deep Mind */}
                    <button
                      type="button"
                      onClick={() => setDeepMindMode(!deepMindMode)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                        deepMindMode ? 'bg-accent text-white border-accent' : 'bg-surface-raised-light dark:bg-surface-raised border-border dark:border-[rgba(255,255,255,0.06)] text-tx-secondary hover:text-tx-primary'
                      }`}
                    >
                      <Brain className="w-3 h-3" />
                      Deep Mind
                    </button>

                    {/* Model Picker */}
                    <button
                      type="button"
                      onClick={() => setShowModelPanel(!showModelPanel)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border bg-surface-raised-light dark:bg-surface-raised border-border dark:border-[rgba(255,255,255,0.06)] text-tx-primary-light dark:text-tx-primary"
                    >
                      {currentModel.name} <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {pdfFile && (
                  <div className="flex items-center justify-between bg-accent/5 border border-accent/15 px-3 py-2 rounded-xl text-xs text-accent">
                    <span className="truncate">{pdfFile.name} (context loaded)</span>
                    <button onClick={handlePdfClear} className="text-accent hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    value={query}
                    onChange={e => { setQuery(e.target.value); setError('') }}
                    placeholder="e.g. Research Nvidia, i'm going to pitch them about real-time quality control software we built..."
                    rows={5}
                    maxLength={500}
                    className="w-full bg-surface-light dark:bg-[#141414] border border-border dark:border-[rgba(255,255,255,0.08)] rounded-2xl p-4 text-sm focus:outline-none focus:border-accent transition-colors dark:text-white"
                  />
                  <div className="absolute bottom-3.5 right-4 text-[10px] font-mono text-tx-tertiary">
                    {query.length}/500
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm flex items-center gap-2 bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={generating || !query.trim()}
                className="w-full py-3 bg-accent hover:bg-accent-light disabled:opacity-40 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg glow-accent"
              >
                <span>⚡</span> {mode === 'schedule' ? 'Schedule Delivery' : 'Generate Brief'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
