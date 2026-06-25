import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ExternalLink, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { SECTION_LABELS, SECTION_ICONS } from '../utils/constants'
import ErrorScreen from '../components/ErrorScreen'


// Robustly extract title + body from any section item
function extractItemFields(sectionId, item) {
  let title = ''
  let body  = ''

  switch (sectionId) {
    case 'news':
      title = item.headline || item.title || ''
      body  = item.summary  || item.description || ''
      break
    case 'talking_points':
      title = item.point   || item.title || ''
      body  = item.why_it_matters || item.explanation || item.summary || ''
      break
    case 'watch_out_for':
      title = item.risk    || item.title || item.warning  || item.headline || ''
      body  = item.context || item.description || item.summary || item.detail || item.why_it_matters || ''
      break
    case 'leadership_changes':
      title = item.name   || item.title || ''
      body  = [item.role, item.change].filter(Boolean).join(' — ') || item.summary || ''
      break
    case 'job_signals':
      title = item.role   || item.title  || item.position || ''
      body  = item.signal || item.insight || item.summary || item.what_it_means || ''
      break
    case 'recent_launches':
      title = item.name   || item.title  || item.product  || ''
      body  = item.significance || item.summary || item.description || ''
      break
    case 'competitor_activity':
      title = item.competitor || item.company || item.name || ''
      body  = [item.action, item.impact].filter(Boolean).join(' — ') || item.summary || ''
      break
    default:
      title = item.title || item.headline || item.name || item.point || item.risk || item.role || item.competitor || ''
      body  = item.summary || item.description || item.content || item.signal || item.context || item.why_it_matters || item.significance || ''
  }

  // Last-resort fallback
  if (!title && !body) {
    const vals = Object.values(item).filter(v => typeof v === 'string' && v.length > 0)
    if (vals.length >= 2) { title = vals[0]; body = vals.slice(1).join(' ') }
    else if (vals.length === 1) { body = vals[0] }
  }

  return { title, body }
}

export default function SharePage() {
  const { token } = useParams()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/api/share/${token}`)
        setData(res.data)
        // Set initial tab to first non-empty section
        const keys = Object.keys(res.data.brief).filter(
          k => res.data.brief[k]?.content || res.data.brief[k]?.items?.length > 0
        )
        if (keys.length > 0) setActiveTab(keys[0])
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [token])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
      </div>
    )
  }

  /* ── Not found / invalid ── */
  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg flex items-center justify-center p-6">
        <ErrorScreen
          code="404"
          title="Shared brief not found"
          description="This link is invalid or has expired. The owner may have removed access or deleted the brief."
          buttonLabel="Create Your Own Account"
          onAction={() => window.location.href = '/sign-up'}
        />
      </div>
    )
  }

  const briefData = data.brief
  const availableSections = Object.keys(briefData).filter(
    k => k !== 'company_name' && k !== 'generated_at' && k !== 'sources' &&
         (briefData[k]?.content || briefData[k]?.items?.length > 0)
  )
  const activeSection = briefData[activeTab]

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg pb-24">
      {/* Top banner */}
      <div className="bg-accent text-white px-5 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <span className="font-display font-bold text-sm">PitchPulse</span>
          <span className="text-white/60 text-xs font-mono border border-white/20 px-1.5 py-0.5 rounded">READ-ONLY</span>
        </div>
        <Link
          to="/sign-up"
          className="text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-all"
        >
          Get your free account →
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-5 pt-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-tx-primary-light dark:text-tx-primary">
            {data.company_name}
          </h1>
          <p className="font-mono text-xs text-tx-tertiary">
            Generated {new Date(data.created_at).toLocaleString()} · {data.length_used || 'medium'} brief
          </p>
        </motion.div>

        {/* Section tabs */}
        <div className="flex overflow-x-auto gap-1 mb-6 pb-1 -mx-1 px-1 custom-scrollbar">
          {availableSections.map(s => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border transition-all shrink-0 ${
                activeTab === s
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'border-border dark:border-[rgba(255,255,255,0.06)] text-tx-secondary hover:text-tx-primary hover:border-border-strong'
              }`}
            >
              <span className="text-xs">{SECTION_ICONS[s] || ''}</span>
              {SECTION_LABELS[s] || s}
            </button>
          ))}
        </div>

        {/* Section content */}
        <AnimatePresence mode="wait">
          {activeSection && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl p-6 squircle"
            >
              {/* Confidence badge */}
              {activeSection.confidence && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded-full uppercase tracking-wider border mb-5 ${
                  activeSection.confidence === 'high'   ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  activeSection.confidence === 'medium' ? 'bg-amber-500/10  text-amber-500  border-amber-500/20'  :
                                                          'bg-red-500/10    text-red-400    border-red-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeSection.confidence === 'high' ? 'bg-emerald-500' :
                    activeSection.confidence === 'medium' ? 'bg-amber-500' : 'bg-red-400'
                  }`} />
                  {activeSection.confidence} confidence
                </span>
              )}

              {/* Content text */}
              {activeSection.content && (
                <p className="text-sm md:text-base leading-relaxed text-tx-secondary-light dark:text-tx-secondary whitespace-pre-line mb-4">
                  {activeSection.content}
                </p>
              )}

              {/* Financial snapshot */}
              {activeSection.snapshot && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {Object.entries(activeSection.snapshot)
                    .filter(([k, v]) => v && k !== 'disclaimer')
                    .map(([key, val]) => (
                      <div key={key} className="bg-surface-raised-light dark:bg-surface-raised rounded-xl p-3 border border-border dark:border-[rgba(255,255,255,0.04)]">
                        <div className="text-[10px] uppercase tracking-wider text-tx-tertiary mb-1">{key.replace(/_/g, ' ')}</div>
                        <div className="text-sm font-semibold font-display">{val}</div>
                      </div>
                    ))}
                </div>
              )}

              {/* Items */}
              {activeSection.items && activeSection.items.length > 0 && (
                <div className="space-y-3 mt-2">
                  {activeSection.items.map((item, idx) => {
                    const { title, body } = extractItemFields(activeTab, item)
                    if (!title && !body) return null

                    return (
                      <div key={idx} className="bg-surface-raised-light dark:bg-[#1a1a1a] rounded-xl p-4 border border-border dark:border-[rgba(255,255,255,0.04)]">
                        <div className="flex items-start gap-2">
                          <span className="text-accent/50 font-mono text-xs mt-1 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                          <div className="min-w-0">
                            {title && <p className="font-semibold text-sm text-tx-primary-light dark:text-tx-primary mb-1">{title}</p>}
                            {body  && <p className="text-sm text-tx-secondary leading-relaxed">{body}</p>}
                          </div>
                        </div>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline mt-2 ml-7">
                            <ExternalLink className="w-3 h-3" /> Source
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <div className="mt-10 bg-accent/5 border border-accent/20 rounded-2xl p-6 text-center">
          <p className="font-display font-semibold text-lg mb-1 text-tx-primary-light dark:text-tx-primary">
            Want briefs like this for your next meeting?
          </p>
          <p className="text-sm text-tx-secondary mb-5">
            PitchPulse generates AI sales intelligence in ~60 seconds. Free to start.
          </p>
          <Link
            to="/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-light text-white font-semibold rounded-xl transition-all glow-accent-sm text-sm"
          >
            Create free account →
          </Link>
        </div>
      </div>
    </div>
  )
}
