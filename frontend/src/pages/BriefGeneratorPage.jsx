import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown, ChevronUp, Lock, FileText, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import Layout from '../components/Layout'
import useAuthStore from '../store/authStore'
import RateLimitModal from '../components/RateLimitModal'
import HorizontalTextReveal from '../components/HorizontalTextReveal'
import AIChatInput from '../components/AIChatInput'
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
  const navigate            = useNavigate()
  const location            = useLocation()
  const { user, consumeBriefCredit } = useAuthStore()
  const toast               = useToast()

  // Pre-fill from ?company= param (from watchlist clicks etc.)
  const initialCompany = new URLSearchParams(location.search).get('company') || ''

  const [query,          setQuery]          = useState(initialCompany)
  const [length,         setLength]         = useState(user?.default_brief_length || 'medium')
  // Job Signals and Social Sentiment are off by default — low value for B2B sales reps
  const DEFAULT_SECTIONS = ALL_SECTIONS.map(s => s.id).filter(id => id !== 'job_signals' && id !== 'social_sentiment')
  const [sections,       setSections]       = useState(DEFAULT_SECTIONS)
  const [selectedModel,  setSelectedModel]  = useState('meta-llama/llama-4-scout-17b-16e-instruct')
  const [deepMindMode,   setDeepMindMode]   = useState(false)
  const [showSections,   setShowSections]   = useState(false)
  const [showModelPanel, setShowModelPanel] = useState(false)

  // PDF context
  const [pdfFile,        setPdfFile]        = useState(null)
  const [pdfContext,     setPdfContext]      = useState('')
  const [pdfLoading,     setPdfLoading]     = useState(false)

  // Generation state
  const [generating,     setGenerating]     = useState(false)
  const [statusStep,     setStatusStep]     = useState(0)
  const [error,          setError]          = useState('')
  const [rateLimitData,  setRateLimitData]  = useState(null)
  // After generation: show inline streaming preview instead of navigating
  const [streamingBrief, setStreamingBrief] = useState(null)  // { id, data }

  // Model panel ref for click-outside
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

  // Cycle status messages during generation
  useEffect(() => {
    if (!generating) return
    const id = setInterval(() => {
      setStatusStep(s => Math.min(s + 1, STATUS_MESSAGES.length - 1))
    }, 9000)
    return () => clearInterval(id)
  }, [generating])

  // PDF upload handler
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
      // Do NOT set Content-Type manually — axios must auto-set it with the multipart boundary
      const res = await api.post('/api/extract-pdf', formData)
      setPdfContext(res.data.text)
      toast.success(`PDF loaded — ${res.data.pages} page${res.data.pages !== 1 ? 's' : ''} extracted`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not read PDF'
      toast.error(msg)
      console.error('[PDF upload]', err.response?.status, err.response?.data)
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

  const handleGenerate = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!query.trim()) { setError('Please describe what you want to research'); return }
    if (pdfLoading) { setError('Still processing your PDF — please wait'); return }
    setError('')
    setGenerating(true)
    setStatusStep(0)

    try {
      const res = await api.post('/api/brief', {
        query:       query.trim(),
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

      // Show inline streaming preview — don't navigate away
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

  const toggleAll = () =>
    setSections(sections.length === ALL_SECTIONS.length ? [] : ALL_SECTIONS.map(s => s.id))

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

      {/* ── Model picker panel — fixed to the right of viewport ── */}
      <AnimatePresence>
        {showModelPanel && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[400]"
              onClick={() => setShowModelPanel(false)}
            />
            <motion.div
              ref={modelPanelRef}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{  opacity: 0, x: 16 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed top-20 right-4 z-[500] w-72 bg-surface-light dark:bg-[#1c1c1c] border border-border dark:border-[rgba(255,255,255,0.10)] rounded-2xl shadow-2xl p-2 overflow-hidden"
            >
              <div className="px-3 py-2 text-[10px] font-bold text-tx-tertiary uppercase tracking-widest border-b border-border dark:border-[rgba(255,255,255,0.06)] mb-2">
                Select AI Model
              </div>

              {/* Free tier */}
              <div className="px-3 py-1 text-[9px] font-bold text-tx-tertiary/50 uppercase tracking-widest mb-1">Free</div>
              {MODELS.filter(m => m.tier === 'free').map(m => (
                <ModelOption
                  key={m.id}
                  model={m}
                  selected={selectedModel === m.id}
                  locked={false}
                  onSelect={() => { setSelectedModel(m.id); setShowModelPanel(false) }}
                />
              ))}

              {/* Pro tier */}
              <div className="px-3 py-1 text-[9px] font-bold text-indigo-400/70 uppercase tracking-widest mt-3 mb-1">Pro</div>
              {MODELS.filter(m => m.tier === 'pro').map(m => {
                const locked = user?.tier !== 'pro'
                return (
                  <ModelOption
                    key={m.id}
                    model={m}
                    selected={selectedModel === m.id}
                    locked={locked}
                    onSelect={() => { if (!locked) { setSelectedModel(m.id); setShowModelPanel(false) } }}
                  />
                )
              })}

              {user?.tier !== 'pro' && (
                <div className="mt-3 pt-2 border-t border-border dark:border-[rgba(255,255,255,0.06)] px-3 pb-2">
                  <p className="text-[10px] text-tx-tertiary leading-relaxed">
                    Pro models unlock larger context windows and deeper reasoning. <span className="text-accent">Upgrade soon.</span>
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className={streamingBrief ? 'max-w-3xl mx-auto' : 'max-w-2xl mx-auto'}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">
                <HorizontalTextReveal inline>New Brief</HorizontalTextReveal>
              </h1>
              <p className="text-sm text-tx-secondary">
                Describe your research goal — the AI figures out the rest
              </p>
            </div>
            {user?.tier === 'free' && !streamingBrief && (
              <StorageWidget
                variant="compact"
                remaining={user?.briefs_remaining_this_hour ?? 3}
                total={3}
                resetAt={user?.reset_at}
                className="shrink-0 mt-1"
              />
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {streamingBrief ? (
            /* ── Streaming brief preview ── */
            <motion.div
              key="streaming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* "New brief" reset button */}
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
            /* ── Generating state ── */
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center text-center border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl bg-surface-light dark:bg-surface relative overflow-hidden"
            >
              {/* Progress bar */}
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
                <motion.div
                  key={statusStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{  opacity: 0, y: -10 }}
                  className="space-y-1.5 px-8"
                >
                  <p className="text-lg font-display font-semibold">{STATUS_MESSAGES[statusStep].text}</p>
                  <p className="text-sm text-tx-tertiary">{STATUS_MESSAGES[statusStep].sub}</p>
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-1.5 mt-8">
                {STATUS_MESSAGES.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                      i <= statusStep ? 'bg-accent' : 'bg-surface-raised dark:bg-surface-raised/60'
                    }`}
                  />
                ))}
              </div>

              {query && (
                <p className="text-xs text-tx-tertiary font-mono mt-6 px-8 truncate max-w-sm opacity-60">
                  "{query.length > 60 ? query.slice(0, 60) + '…' : query}"
                </p>
              )}
            </motion.div>
          ) : (
            /* ── Form ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Main input */}
              <AIChatInput
                value={query}
                onChange={(val) => { setQuery(val); setError('') }}
                onSubmit={handleGenerate}
                generating={generating}
                selectedModel={selectedModel}
                onModelPickerToggle={() => setShowModelPanel(v => !v)}
                showModelPicker={showModelPanel}
                deepMindMode={deepMindMode}
                setDeepMindMode={setDeepMindMode}
                pdfFile={pdfFile}
                onPdfSelect={handlePdfSelect}
                onPdfClear={handlePdfClear}
                userTier={user?.tier || 'free'}
              />

              {/* PDF loading indicator */}
              {pdfLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs text-accent px-1"
                >
                  <div className="w-3 h-3 rounded-full border border-accent/30 border-t-accent animate-spin" />
                  Extracting PDF text…
                </motion.div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm flex items-center gap-2 px-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </motion.p>
              )}

              {/* Hint */}
              <p className="text-xs text-tx-tertiary/60 px-1 leading-relaxed">
                <span className="font-semibold text-tx-tertiary/80">Tip:</span> The more detail you give, the better the brief.
                Include what you sell and your specific angle — e.g. <span className="font-mono">"Research Salesforce, pitching DevOps automation tools to their engineering org"</span>
              </p>

              {/* Brief Length */}
              <div className="bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                <label className="block text-sm font-semibold mb-3 text-tx-primary-light dark:text-tx-primary">Brief Length</label>
                <div className="flex bg-surface-raised-light dark:bg-surface-raised p-1 rounded-xl gap-1">
                  {[
                    { id: 'short',  label: 'Quick Scan',  sub: '~2 min read'  },
                    { id: 'medium', label: 'Standard',    sub: '~5 min read'  },
                    { id: 'long',   label: 'Deep Dive',   sub: '~15 min read' },
                  ].map(l => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLength(l.id)}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-center transition-all ${
                        length === l.id
                          ? 'bg-surface-light dark:bg-surface shadow-sm text-tx-primary-light dark:text-tx-primary'
                          : 'text-tx-tertiary hover:text-tx-secondary'
                      }`}
                    >
                      <div className="text-sm font-medium">{l.label}</div>
                      <div className="text-[10px] text-tx-tertiary mt-0.5 hidden sm:block">{l.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections accordion */}
              <div className="bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSections(!showSections)}
                  className="w-full flex justify-between items-center p-5 hover:bg-surface-raised-light dark:hover:bg-surface-raised/40 transition"
                >
                  <div className="text-left">
                    <div className="text-sm font-semibold text-tx-primary-light dark:text-tx-primary">Sections to include</div>
                    <div className="text-xs text-tx-tertiary mt-0.5">{sections.length} of {ALL_SECTIONS.length} selected</div>
                  </div>
                  {showSections
                    ? <ChevronUp className="w-4 h-4 text-tx-tertiary" />
                    : <ChevronDown className="w-4 h-4 text-tx-tertiary" />}
                </button>
                <AnimatePresence>
                  {showSections && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border dark:border-[rgba(255,255,255,0.06)]"
                    >
                      <div className="p-5 pt-4">
                        <button
                          type="button"
                          onClick={toggleAll}
                          className="text-xs text-accent hover:underline mb-4 block"
                        >
                          {sections.length === ALL_SECTIONS.length ? 'Deselect all' : 'Select all'}
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ALL_SECTIONS.map(s => (
                            <label
                              key={s.id}
                              className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-xl hover:bg-surface-raised-light dark:hover:bg-surface-raised transition"
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={sections.includes(s.id)}
                                onChange={() => toggleSection(s.id)}
                              />
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                sections.includes(s.id)
                                  ? 'bg-accent border-accent'
                                  : 'border-tx-tertiary group-hover:border-accent/50'
                              }`}>
                                {sections.includes(s.id) && (
                                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-xs">{s.icon}</span>
                              <span className={`text-sm ${sections.includes(s.id) ? 'text-tx-primary-light dark:text-tx-primary' : 'text-tx-secondary'}`}>
                                {s.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}

function ModelOption({ model, selected, locked, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked}
      className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-start justify-between gap-2 ${
        selected
          ? 'bg-accent/10 text-accent'
          : locked
          ? 'opacity-40 cursor-not-allowed text-tx-tertiary'
          : 'hover:bg-surface-raised-light dark:hover:bg-surface-raised text-tx-secondary hover:text-tx-primary'
      }`}
    >
      <div className="min-w-0">
        <div className="text-xs font-semibold truncate">{model.name}</div>
        <div className="text-[10px] text-tx-tertiary truncate mt-0.5 leading-relaxed">{model.desc}</div>
      </div>
      <div className="shrink-0 mt-0.5">
        {locked ? (
          <span className="flex items-center gap-0.5 text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold uppercase">
            <Lock className="w-2.5 h-2.5" /> Pro
          </span>
        ) : selected ? (
          <span className="w-1.5 h-1.5 rounded-full bg-accent block mt-1" />
        ) : null}
      </div>
    </button>
  )
}
