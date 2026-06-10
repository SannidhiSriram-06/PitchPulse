import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Copy, AlertTriangle, ThumbsUp, ThumbsDown, ChevronDown, ExternalLink, RefreshCw, Trash2, Mail } from 'lucide-react'
import api from '../lib/api'
import Layout from '../components/Layout'
import ExpandableTabs from '../components/ExpandableTabs'
import { MetalIconButton } from '../components/MetalButton'
import StockChart from '../components/StockChart'
import { useToast } from '../components/Toast'
import usePrefsStore from '../store/prefsStore'
import { SECTION_LABELS, SECTION_ICONS } from '../utils/constants'

export default function BriefDisplayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { defaultView } = usePrefsStore()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('core')
  const [viewMode, setViewMode] = useState(defaultView || 'tabs')
  const [showSources, setShowSources] = useState(false)
  const [copiedTooltip, setCopiedTooltip] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [emailing, setEmailing] = useState(false)

  useEffect(() => {
    const fetchBrief = async () => {
      try {
        const res = await api.get(`/api/briefs/${id}`)
        setData(res.data)
      } catch (e) {
        console.error(e)
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchBrief()
  }, [id, navigate])

  const toggleSave = async () => {
    try {
      const res = await api.patch(`/api/briefs/${id}/save`)
      setData(prev => ({ ...prev, saved: res.data.saved }))
      toast.success(res.data.saved ? 'Brief saved' : 'Brief unsaved')
    } catch { toast.error('Failed to save') }
  }

  const shareBrief = async () => {
    try {
      const res = await api.post(`/api/briefs/${id}/share`)
      await navigator.clipboard.writeText(res.data.share_url)
      setCopiedTooltip(true)
      setTimeout(() => setCopiedTooltip(false), 2000)
    } catch { toast.error('Failed to copy share link') }
  }

  const sendEmail = async () => {
    setEmailing(true)
    try {
      await api.post(`/api/briefs/${id}/email`)
      toast.success('Brief sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email')
    } finally {
      setEmailing(false)
    }
  }

  const deleteBrief = async () => {
    try {
      await api.delete(`/api/briefs/${id}`)
      toast.success('Brief deleted')
      navigate('/dashboard')
    } catch { toast.error('Failed to delete brief') }
  }

  // Toggleable feedback: clicking same rating removes it (rating=null)
  const handleFeedback = async (section, rating) => {
    const current = data?.feedback?.[section]
    const newRating = current === rating ? null : rating
    try {
      await api.post(`/api/briefs/${id}/feedback`, { section, rating: newRating })
      setData(prev => ({
        ...prev,
        feedback: { ...(prev.feedback || {}), [section]: newRating }
      }))
    } catch { /* silent */ }
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="h-12 bg-surface-raised-light dark:bg-surface-raised w-1/3 rounded-xl shimmer" />
          <div className="h-6 bg-surface-raised-light dark:bg-surface-raised w-1/4 rounded-lg shimmer" />
          <div className="h-12 bg-surface-raised-light dark:bg-surface-raised w-full rounded-xl shimmer" />
          <div className="h-96 bg-surface-raised-light dark:bg-surface-raised w-full rounded-2xl shimmer" />
        </div>
      </Layout>
    )
  }

  if (!data) return null

  const briefData = data.brief
  const availableSections = Object.keys(briefData).filter(k =>
    k !== 'company_name' && k !== 'generated_at' && k !== 'sources' &&
    (briefData[k]?.content || briefData[k]?.items?.length > 0)
  )

  // Collect all sources from all sections
  const allSources = []
  availableSections.forEach(s => {
    const sec = briefData[s]
    if (sec?.sources) {
      sec.sources.forEach(url => {
        if (url && !allSources.includes(url)) allSources.push(url)
      })
    }
    if (sec?.items) {
      sec.items.forEach(item => {
        if (item.url && !allSources.includes(item.url)) allSources.push(item.url)
      })
    }
  })
  // Also add top-level sources
  if (briefData.sources) {
    briefData.sources.forEach(url => {
      if (url && !allSources.includes(url)) allSources.push(url)
    })
  }

  const getItemFields = (sectionId, item) => {
    // Robustly extract title and body from any section's item structure
    let title = ''
    let body = ''
    let date = item.date || ''

    switch (sectionId) {
      case 'news':
        title = item.headline || item.title || ''
        body = [item.summary || item.description || '', item.pitch_relevance ? `💡 ${item.pitch_relevance}` : ''].filter(Boolean).join('\n\n')
        break
      case 'talking_points':
        title = item.point || item.title || ''
        body = item.why_it_matters || item.explanation || item.summary || ''
        break
      case 'watch_out_for':
        title = item.risk || item.title || item.warning || item.headline || ''
        body = item.context || item.description || item.summary || item.detail || item.why_it_matters || ''
        break
      case 'leadership_changes':
        title = item.name || item.title || ''
        body = [item.role, item.change].filter(Boolean).join(' — ') || item.summary || ''
        break
      case 'job_signals':
        title = item.role || item.title || item.position || ''
        body = item.signal || item.insight || item.summary || item.description || item.what_it_means || ''
        break
      case 'recent_launches':
        title = item.name || item.title || item.product || ''
        body = item.significance || item.summary || item.description || ''
        break
      case 'competitor_activity':
        title = item.competitor || item.company || item.name || ''
        body = [item.action, item.impact].filter(Boolean).join(' — ') || item.summary || ''
        break
      default:
        title = item.title || item.name || item.headline || item.point || item.role || item.risk || item.competitor || ''
        body = item.summary || item.description || item.content || item.signal || item.context || item.why_it_matters || item.significance || item.action || ''
    }

    // Fallback: if both are empty, try to show something
    if (!title && !body) {
      const vals = Object.values(item).filter(v => typeof v === 'string' && v.length > 0)
      if (vals.length >= 2) {
        title = vals[0]
        body = vals.slice(1).join(' ')
      } else if (vals.length === 1) {
        body = vals[0]
      }
    }

    return { title, body, date }
  }

  const renderSectionContent = (sectionId, sectionData) => {
    if (!sectionData) return null

    return (
      <motion.div
        key={sectionId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-5"
      >
        {/* Confidence badge */}
        {sectionData.confidence && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded-full uppercase tracking-wider border ${
            sectionData.confidence === 'high' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
            sectionData.confidence === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
            'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              sectionData.confidence === 'high' ? 'bg-emerald-500' :
              sectionData.confidence === 'medium' ? 'bg-amber-500' : 'bg-red-400'
            }`} />
            {sectionData.confidence} confidence
          </span>
        )}

        {/* Content text */}
        {sectionData.content && (
          <p className="text-sm md:text-base leading-relaxed text-tx-secondary-light dark:text-tx-secondary whitespace-pre-line">
            {sectionData.content}
          </p>
        )}

        {/* Financial snapshot */}
        {sectionData.snapshot && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {Object.entries(sectionData.snapshot).filter(([k, v]) => v && k !== 'disclaimer').map(([key, val]) => (
              <div key={key} className="bg-surface-raised-light dark:bg-surface-raised rounded-xl p-3 border border-border dark:border-[rgba(255,255,255,0.04)]">
                <div className="text-[10px] uppercase tracking-wider text-tx-tertiary mb-1 font-medium">{key.replace(/_/g, ' ')}</div>
                <div className="text-sm font-display font-semibold">{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Stock price visualization */}
        {sectionId === 'financials' && (
          <StockChart companyName={data.company_name} />
        )}

        {/* Sentiment indicator */}
        {sectionData.sentiment && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-medium text-tx-tertiary">Overall:</span>
            <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
              sectionData.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
              sectionData.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' :
              sectionData.sentiment === 'mixed' ? 'bg-amber-500/10 text-amber-500' :
              'bg-gray-500/10 text-gray-400'
            }`}>
              {sectionData.sentiment}
            </span>
          </div>
        )}

        {/* Items list */}
        {sectionData.items && sectionData.items.length > 0 && (
          <div className="space-y-3 mt-4">
            {sectionData.items.map((item, idx) => {
              const { title, body, date } = getItemFields(sectionId, item)
              if (!title && !body) return null

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-surface-raised-light dark:bg-[#1a1a1a] rounded-xl p-4 border border-border dark:border-[rgba(255,255,255,0.04)] hover:border-accent/20 transition-colors squircle"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {title && (
                        <div className="flex items-start gap-2 mb-1.5">
                          <span className="text-accent/60 font-mono text-xs mt-1 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                          <h4 className="font-medium text-sm text-tx-primary-light dark:text-tx-primary leading-snug">{title}</h4>
                        </div>
                      )}
                      {body && (
                        <p className={`text-sm text-tx-secondary-light dark:text-tx-secondary leading-relaxed ${title ? 'ml-7' : ''} ${sectionId === 'talking_points' ? 'italic' : ''}`}>
                          {body}
                        </p>
                      )}
                    </div>
                    {date && <span className="text-[10px] font-mono text-tx-tertiary shrink-0 mt-1">{date}</span>}
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline mt-2 ml-7">
                      <ExternalLink className="w-3 h-3" /> Source
                    </a>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Feedback */}
        <div className="pt-4 flex justify-end gap-2 border-t border-border dark:border-[rgba(255,255,255,0.04)] mt-6">
          <span className="text-[10px] text-tx-tertiary mr-auto self-center">Was this section helpful?</span>
          <button 
            onClick={() => handleFeedback(sectionId, 'up')}
            className={`p-2 rounded-lg transition-all ${data.feedback?.[sectionId] === 'up' ? 'text-accent bg-accent/10 scale-110' : 'text-tx-tertiary hover:text-tx-primary hover:bg-surface-raised'}`}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleFeedback(sectionId, 'down')}
            className={`p-2 rounded-lg transition-all ${data.feedback?.[sectionId] === 'down' ? 'text-red-500 bg-red-500/10 scale-110' : 'text-tx-tertiary hover:text-tx-primary hover:bg-surface-raised'}`}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )
  }

  const tabs = [
    {
      id: 'core',
      label: 'Core Intelligence',
      icon: <span className="text-xs">📋</span>,
      content: (
        <div className="space-y-8">
          {availableSections.filter(s => ['summary', 'news', 'financials', 'social_sentiment'].includes(s)).map(s => (
            <div key={s} className="border-b border-border dark:border-[rgba(255,255,255,0.06)] last:border-0 pb-8 last:pb-0">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">{SECTION_ICONS[s] || ''}</span>
                <h3 className="text-xs uppercase tracking-wider text-tx-tertiary font-bold">{SECTION_LABELS[s] || s}</h3>
              </div>
              {renderSectionContent(s, briefData[s])}
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'strategy',
      label: 'Sales Strategy',
      icon: <span className="text-xs">🎯</span>,
      content: (
        <div className="space-y-8">
          {availableSections.filter(s => ['talking_points', 'watch_out_for', 'job_signals'].includes(s)).map(s => (
            <div key={s} className="border-b border-border dark:border-[rgba(255,255,255,0.06)] last:border-0 pb-8 last:pb-0">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">{SECTION_ICONS[s] || ''}</span>
                <h3 className="text-xs uppercase tracking-wider text-tx-tertiary font-bold">{SECTION_LABELS[s] || s}</h3>
              </div>
              {renderSectionContent(s, briefData[s])}
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'market',
      label: 'Market Activity',
      icon: <span className="text-xs">🚀</span>,
      content: (
        <div className="space-y-8">
          {availableSections.filter(s => ['leadership_changes', 'recent_launches', 'competitor_activity'].includes(s)).map(s => (
            <div key={s} className="border-b border-border dark:border-[rgba(255,255,255,0.06)] last:border-0 pb-8 last:pb-0">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">{SECTION_ICONS[s] || ''}</span>
                <h3 className="text-xs uppercase tracking-wider text-tx-tertiary font-bold">{SECTION_LABELS[s] || s}</h3>
              </div>
              {renderSectionContent(s, briefData[s])}
            </div>
          ))}
        </div>
      )
    }
  ]

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-tx-primary-light dark:text-tx-primary">
                {data.company_name}
              </h1>
              <p className="font-mono text-xs text-tx-tertiary">
                Generated {new Date(data.created_at).toLocaleString()} · {data.length_used} brief
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <MetalIconButton
                onClick={() => navigate(`/brief/new?company=${encodeURIComponent(data.company_name)}`)}
                variant="outline"
                title="Regenerate"
              >
                <RefreshCw className="w-4 h-4 text-tx-secondary" />
              </MetalIconButton>
              <MetalIconButton
                onClick={shareBrief}
                variant="outline"
                title="Copy share link"
                className="relative"
              >
                <Copy className="w-4 h-4 text-tx-secondary" />
                <AnimatePresence>
                  {copiedTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute -top-9 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] px-3 py-1 rounded-lg whitespace-nowrap font-medium"
                    >
                      Link copied!
                    </motion.div>
                  )}
                </AnimatePresence>
              </MetalIconButton>
              <MetalIconButton
                onClick={sendEmail}
                variant="outline"
                title="Send to email"
                disabled={emailing}
              >
                <Mail className={`w-4 h-4 text-tx-secondary ${emailing ? 'animate-pulse' : ''}`} />
              </MetalIconButton>
              <MetalIconButton
                onClick={toggleSave}
                variant={data.saved ? 'default' : 'outline'}
                title={data.saved ? 'Unsave' : 'Save'}
              >
                <Bookmark className={`w-4 h-4 ${data.saved ? 'text-white fill-white' : 'text-tx-secondary'}`} />
              </MetalIconButton>
              {/* Delete with inline confirm */}
              {showDeleteConfirm ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={deleteBrief}
                    className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-red-600 transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-xs text-tx-tertiary hover:text-tx-secondary px-2 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <MetalIconButton
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  title="Delete brief"
                >
                  <Trash2 className="w-4 h-4 text-tx-tertiary hover:text-red-500" />
                </MetalIconButton>
              )}
            </div>
          </div>

          {/* Pitch context banner — shown when brief was generated with a specific pitch */}
          {briefData?.rep_pitch_context && briefData.rep_pitch_context !== 'N/A' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-accent/5 border border-accent/20 px-4 py-3 rounded-xl text-sm flex items-start gap-3"
            >
              <span className="text-accent mt-0.5 shrink-0">🎯</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent/60 block mb-0.5">Tailored for your pitch</span>
                <span className="text-tx-secondary-light dark:text-tx-secondary">{briefData.rep_pitch_context}</span>
              </div>
            </motion.div>
          )}

          {data.limited_data && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Limited data available for this company — some sections may be incomplete.</span>
            </motion.div>
          )}
        </motion.div>

        {/* View toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-surface-raised-light dark:bg-surface-raised p-1 rounded-xl">
            {['tabs', 'cards'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`px-5 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${viewMode === mode ? 'bg-surface-light dark:bg-surface text-tx-primary-light dark:text-tx-primary' : 'text-tx-tertiary hover:text-tx-secondary'}`}>
                {mode}
              </button>
            ))}
          </div>
          <span className="text-xs text-tx-tertiary font-mono">{availableSections.length} sections</span>
        </div>

        {/* Content */}
        {viewMode === 'tabs' ? (
          <ExpandableTabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onChange={setActiveTab} 
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {availableSections.map(s => (
              <motion.div
                key={s}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                className="bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl p-6 hover:border-accent/10 transition-colors squircle"
              >
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-sm">{SECTION_ICONS[s] || ''}</span>
                  <h3 className="text-[11px] uppercase tracking-wider text-tx-tertiary font-semibold">{SECTION_LABELS[s] || s}</h3>
                </div>
                {renderSectionContent(s, briefData[s])}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Sources panel */}
        {allSources.length > 0 && (
          <div className="mt-8 border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl bg-surface-light dark:bg-surface overflow-hidden squircle">
            <button onClick={() => setShowSources(!showSources)} className="w-full flex justify-between items-center p-5 font-medium text-sm hover:bg-surface-raised-light dark:hover:bg-surface-raised transition">
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-tx-tertiary" />
                Sources ({allSources.length})
              </span>
              <ChevronDown className={`w-4 h-4 text-tx-tertiary transition-transform ${showSources ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showSources && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border dark:border-[rgba(255,255,255,0.06)] bg-surface-raised-light dark:bg-[#111111] overflow-hidden"
                >
                  <div className="p-5">
                    <ul className="space-y-2">
                      {allSources.map((url, i) => (
                        <li key={i} className="text-xs font-mono truncate flex items-center gap-2">
                          <span className="text-accent/40 w-6 text-right shrink-0">[{i + 1}]</span>
                          <a href={url} target="_blank" rel="noreferrer" className="text-accent hover:underline truncate">{url}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  )
}
