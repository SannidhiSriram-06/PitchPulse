import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Zap } from 'lucide-react'

export default function RateLimitModal({ isOpen, onClose, resetInMinutes, resetAt }) {
  const [secondsLeft, setSecondsLeft] = useState(null)

  useEffect(() => {
    if (!isOpen || !resetAt) {
      setSecondsLeft(null)
      return
    }

    const compute = () => {
      const diff = Math.max(0, Math.floor((new Date(resetAt) - Date.now()) / 1000))
      setSecondsLeft(diff)
    }

    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [isOpen, resetAt])

  const formatTime = (secs) => {
    if (secs === null) return `~${resetInMinutes || '?'} min`
    if (secs <= 0) return 'any moment now'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{  opacity: 0, scale: 0.95, y: 12 }}
          className="relative bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl p-8 w-full max-w-md shadow-2xl squircle"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-tx-tertiary hover:text-tx-primary hover:bg-surface-raised-light dark:hover:bg-surface-raised rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>

          <h2 className="text-xl font-display font-semibold mb-2">Hourly limit reached</h2>
          <p className="text-tx-secondary-light dark:text-tx-secondary text-sm mb-6 leading-relaxed">
            You've used all 3 free briefs for this hour.
          </p>

          {/* Countdown */}
          <div className="bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-xl p-4 mb-6 flex items-center gap-3">
            <Clock className="w-5 h-5 text-tx-tertiary shrink-0" />
            <div>
              <div className="text-xs text-tx-tertiary mb-0.5">Resets in</div>
              <div className="text-lg font-mono font-bold text-tx-primary-light dark:text-tx-primary tabular-nums">
                {formatTime(secondsLeft)}
              </div>
            </div>
          </div>

          {/* Upgrade callout */}
          <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-sm">PitchPulse Pro</span>
              <span className="text-[10px] uppercase tracking-wider border border-border px-2 py-0.5 rounded-full text-tx-tertiary">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-tx-secondary-light dark:text-tx-secondary leading-relaxed">
              Unlimited briefs, scheduled delivery, advanced AI models, and calendar integrations.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-surface-raised-light dark:bg-surface-raised hover:bg-surface-light dark:hover:bg-surface border border-border-strong text-tx-primary-light dark:text-tx-primary py-2.5 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
          >
            Got it, I'll wait
          </button>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  )
}
