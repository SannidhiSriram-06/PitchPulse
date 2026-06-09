import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, ArrowRight, Bookmark, Copy, CheckCheck } from 'lucide-react'
import WordReveal from './WordReveal'
import { SECTION_LABELS, SECTION_ICONS } from '../utils/constants'

const SECTION_ORDER = [
  'summary',
  'talking_points',
  'watch_out_for',
  'news',
  'financials',
  'leadership_changes',
  'recent_launches',
  'competitor_activity',
  'social_sentiment',
  'job_signals',
]

// Avg words per section for computing next-section stagger delay
const avgWords = (text = '', items = []) => {
  let count = text.split(/\s+/).filter(Boolean).length
  items.forEach(item => {
    Object.values(item).forEach(v => {
      if (typeof v === 'string') count += v.split(/\s+/).filter(Boolean).length
    })
  })
  return count
}

// Per-section base delay (seconds) so sections cascade nicely
const buildDelays = (briefData, sectionIds) => {
  const delays = {}
  let cursor = 0.15   // brief header takes ~0.15s to appear
  const SPEED = 0.016 // seconds per word
  const GAP = 0.4     // extra pause before next section begins

  sectionIds.forEach((id) => {
    delays[id] = cursor
    const sec = briefData[id] || {}
    const words = avgWords(sec.content || '', sec.items || [])
    cursor += words * SPEED + GAP
  })
  return delays
}

// ─── item renderers ────────────────────────────────────────────────────────────

function TalkingPointItem({ item, delay, speed }) {
  const point = item.point || item.title || ''
  const why   = item.why_it_matters || item.explanation || ''
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="bg-accent/5 border border-accent/15 rounded-xl p-4"
    >
      {point && (
        <WordReveal
          text={point}
          delay={delay}
          speed={speed}
          wrapperClass="block font-semibold text-sm text-tx-primary-light dark:text-tx-primary mb-2 leading-snug"
        />
      )}
      {why && (
        <WordReveal
          text={why}
          delay={delay + point.split(/\s+/).length * speed}
          speed={speed}
          wrapperClass="block text-sm text-tx-secondary-light dark:text-tx-secondary leading-relaxed italic"
        />
      )}
    </motion.div>
  )
}

function WatchOutItem({ item, delay, speed }) {
  const risk    = item.risk || item.title || ''
  const context = item.context || item.description || ''
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="border-l-2 border-red-400/40 pl-4 py-1"
    >
      {risk && (
        <WordReveal
          text={risk}
          delay={delay}
          speed={speed}
          wrapperClass="block font-semibold text-sm text-red-400 mb-1 leading-snug"
        />
      )}
      {context && (
        <WordReveal
          text={context}
          delay={delay + risk.split(/\s+/).length * speed}
          speed={speed}
          wrapperClass="block text-sm text-tx-secondary leading-relaxed"
        />
      )}
    </motion.div>
  )
}

function NewsItem({ item, delay, speed }) {
  const headline = item.headline || item.title || ''
  const summary  = item.summary  || item.description || ''
  const pitchRel = item.pitch_relevance || ''
  const wordsBefore = headline.split(/\s+/).length + summary.split(/\s+/).length
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      className="bg-surface-raised-light dark:bg-[#1a1a1a] rounded-xl p-4 border border-border dark:border-[rgba(255,255,255,0.04)]"
    >
      {headline && (
        <WordReveal
          text={headline}
          delay={delay}
          speed={speed}
          wrapperClass="block font-medium text-sm text-tx-primary-light dark:text-tx-primary mb-1.5"
        />
      )}
      {summary && (
        <WordReveal
          text={summary}
          delay={delay + headline.split(/\s+/).length * speed}
          speed={speed}
          wrapperClass="block text-sm text-tx-secondary leading-relaxed"
        />
      )}
      {pitchRel && (
        <WordReveal
          text={`💡 ${pitchRel}`}
          delay={delay + wordsBefore * speed + 0.1}
          speed={speed}
          wrapperClass="block text-xs text-accent mt-2 leading-relaxed"
        />
      )}
      {item.url && (
        <motion.a
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.6 }}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline mt-2"
        >
          <ExternalLink className="w-3 h-3" /> Source
        </motion.a>
      )}
    </motion.div>
  )
}

function GenericItem({ item, sectionId, delay, speed }) {
  let title = ''
  let body  = ''

  switch (sectionId) {
    case 'leadership_changes':
      title = item.name || ''
      body  = [item.role, item.change].filter(Boolean).join(' — ')
      break
    case 'job_signals':
      title = item.role || item.title || ''
      body  = item.signal || ''
      break
    case 'recent_launches':
      title = item.name || item.title || ''
      body  = item.significance || ''
      break
    case 'competitor_activity':
      title = item.competitor || item.company || ''
      body  = [item.action, item.impact].filter(Boolean).join(' — ')
      break
    default:
      title = item.title || item.name || item.headline || ''
      body  = item.summary || item.description || item.content || ''
  }

  const titleWords = title.split(/\s+/).length
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      className="flex gap-3"
    >
      <span className="text-accent/40 font-mono text-xs mt-1 shrink-0 select-none">›</span>
      <div className="flex-1">
        {title && (
          <WordReveal
            text={title}
            delay={delay}
            speed={speed}
            wrapperClass="block font-medium text-sm text-tx-primary-light dark:text-tx-primary mb-1"
          />
        )}
        {body && (
          <WordReveal
            text={body}
            delay={delay + titleWords * speed}
            speed={speed}
            wrapperClass="block text-sm text-tx-secondary leading-relaxed"
          />
        )}
      </div>
      {item.date && (
        <span className="text-[10px] font-mono text-tx-tertiary shrink-0 mt-1">{item.date}</span>
      )}
    </motion.div>
  )
}

// ─── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ sectionId, sectionData, baseDelay }) {
  if (!sectionData) return null

  const WORD_SPEED = 0.016
  const { content = '', items = [], confidence, sentiment, snapshot } = sectionData
  const contentWords = content.split(/\s+/).filter(Boolean).length
  const ITEM_GAP = 0.25  // seconds between item starts

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: baseDelay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl p-5 md:p-6"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{SECTION_ICONS[sectionId] || '📄'}</span>
        <h3 className="text-xs font-bold uppercase tracking-widest text-tx-tertiary">
          {SECTION_LABELS[sectionId] || sectionId}
        </h3>
        {confidence && (
          <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full ${
            confidence === 'high'   ? 'bg-emerald-500/10 text-emerald-500' :
            confidence === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                                      'bg-gray-500/10 text-gray-400'
          }`}>
            {confidence}
          </span>
        )}
      </div>

      {/* Content text */}
      {content && (
        <WordReveal
          text={content}
          delay={baseDelay + 0.1}
          speed={WORD_SPEED}
          wrapperClass="text-sm md:text-base leading-relaxed text-tx-secondary-light dark:text-tx-secondary mb-4"
        />
      )}

      {/* Sentiment badge */}
      {sentiment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: baseDelay + contentWords * WORD_SPEED + 0.2 }}
          className="flex items-center gap-2 mb-4"
        >
          <span className="text-xs text-tx-tertiary">Overall:</span>
          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
            sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
            sentiment === 'negative' ? 'bg-red-500/10 text-red-400' :
            sentiment === 'mixed'    ? 'bg-amber-500/10 text-amber-500' :
                                       'bg-gray-500/10 text-gray-400'
          }`}>{sentiment}</span>
        </motion.div>
      )}

      {/* Financial snapshot chips */}
      {snapshot && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: baseDelay + contentWords * WORD_SPEED + 0.15 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4"
        >
          {Object.entries(snapshot)
            .filter(([k, v]) => v && k !== 'disclaimer')
            .map(([k, v]) => (
              <div key={k} className="bg-surface-raised-light dark:bg-surface-raised rounded-xl p-3 border border-border dark:border-[rgba(255,255,255,0.04)]">
                <div className="text-[10px] uppercase tracking-wider text-tx-tertiary mb-0.5 font-medium">{k.replace(/_/g, ' ')}</div>
                <div className="text-sm font-semibold font-display">{v}</div>
              </div>
            ))}
        </motion.div>
      )}

      {/* Items */}
      {items.length > 0 && (
        <div className={`space-y-3 ${content ? 'mt-1' : ''}`}>
          {items.map((item, idx) => {
            const itemDelay = baseDelay + contentWords * WORD_SPEED + 0.2 + idx * ITEM_GAP
            if (sectionId === 'talking_points') {
              return <TalkingPointItem key={idx} item={item} delay={itemDelay} speed={WORD_SPEED} />
            }
            if (sectionId === 'watch_out_for') {
              return <WatchOutItem key={idx} item={item} delay={itemDelay} speed={WORD_SPEED} />
            }
            if (sectionId === 'news') {
              return <NewsItem key={idx} item={item} delay={itemDelay} speed={WORD_SPEED} />
            }
            return <GenericItem key={idx} item={item} sectionId={sectionId} delay={itemDelay} speed={WORD_SPEED} />
          })}
        </div>
      )}
    </motion.div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function StreamingBriefPreview({ brief, briefId, onOpenFull, onSave }) {
  const [copied, setCopied] = useState(false)
  const topRef = useRef(null)

  // Scroll to top when preview mounts
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const briefData = brief || {}

  // Which sections actually have content
  const activeSections = SECTION_ORDER.filter(id =>
    briefData[id] && (briefData[id].content || briefData[id].items?.length > 0)
  )

  const sectionDelays = buildDelays(briefData, activeSections)

  // Total animation duration (rough) for the "View full brief" button reveal
  const lastDelay = Math.max(...Object.values(sectionDelays)) + 1.5

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/brief/${briefId}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {}
  }

  return (
    <div ref={topRef} className="space-y-4">
      {/* ── Brief header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-2 h-2 rounded-full bg-accent animate-pulse"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Brief ready</span>
          </div>
          <WordReveal
            text={briefData.company_name || 'Company Brief'}
            delay={0.05}
            speed={0.04}
            wrapperClass="text-2xl md:text-3xl font-display font-bold text-tx-primary-light dark:text-tx-primary"
          />
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 shrink-0"
        >
          <button
            onClick={copyLink}
            title="Copy brief link"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border dark:border-[rgba(255,255,255,0.08)] bg-surface-raised-light dark:bg-[#1c1c1c] text-xs text-tx-secondary hover:text-tx-primary transition-all active:scale-95"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <button
            onClick={onOpenFull}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-light text-white text-xs font-semibold transition-all active:scale-95 glow-accent-sm"
          >
            Open full brief
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </motion.div>

      {/* ── Pitch context banner ─────────────────────────────────────────── */}
      {briefData.rep_pitch_context && briefData.rep_pitch_context !== 'N/A' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3"
        >
          <span className="text-accent shrink-0 mt-0.5">🎯</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent/60 block mb-0.5">Tailored for your pitch</span>
            <WordReveal
              text={briefData.rep_pitch_context}
              delay={0.25}
              speed={0.018}
              wrapperClass="text-sm text-tx-secondary-light dark:text-tx-secondary"
            />
          </div>
        </motion.div>
      )}

      {/* ── Sections ────────────────────────────────────────────────────── */}
      {activeSections.map((id) => (
        <SectionCard
          key={id}
          sectionId={id}
          sectionData={briefData[id]}
          baseDelay={sectionDelays[id]}
        />
      ))}

      {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(lastDelay, 12), duration: 0.5 }}
        className="flex flex-col sm:flex-row items-center gap-3 justify-between p-5 bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl"
      >
        <p className="text-sm text-tx-secondary text-center sm:text-left">
          View the full brief for stock chart, sources, and section-by-section feedback.
        </p>
        <button
          onClick={onOpenFull}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-white text-sm font-semibold transition-all active:scale-95 glow-accent-sm shrink-0"
        >
          Open full brief <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  )
}
