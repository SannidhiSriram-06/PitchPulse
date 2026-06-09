import { useState, useEffect, useRef } from 'react'
import { Zap, RefreshCw } from 'lucide-react'
import useAuthStore from '../store/authStore'

/**
 * UsagePill — compact real-time brief usage indicator.
 *
 * Two variants:
 *   compact (default) — single-line pill used in the generator header
 *   card              — larger card used on the dashboard
 *
 * Auto-polls /api/usage every 30 s to stay in sync with server.
 * Auto-resets the displayed count optimistically when the countdown hits 0.
 */
export function StorageWidget({
  remaining: remainingProp = 3,
  total = 3,
  resetAt: resetAtProp,
  variant = 'card',
  onUpgrade,
  className = '',
}) {
  const refreshUsage = useAuthStore((s) => s.refreshUsage)
  const userFromStore = useAuthStore((s) => s.user)

  // Use store values when available (they're kept fresh by polling)
  const remaining = userFromStore?.briefs_remaining_this_hour ?? remainingProp
  const resetAt   = userFromStore?.reset_at ?? resetAtProp

  const [secondsLeft, setSecondsLeft] = useState(null)
  const [justReset, setJustReset]     = useState(false)
  const pollRef = useRef(null)

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!resetAt) { setSecondsLeft(null); return }

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(resetAt) - Date.now()) / 1000))
      setSecondsLeft(diff)

      // When countdown hits zero: flash "reset" animation, then refresh from server
      if (diff === 0) {
        setJustReset(true)
        setTimeout(() => setJustReset(false), 2000)
        refreshUsage()
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [resetAt]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Server poll every 30 s ───────────────────────────────────────────────
  useEffect(() => {
    pollRef.current = setInterval(refreshUsage, 30_000)
    return () => clearInterval(pollRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatCountdown = (secs) => {
    if (secs === null) return '--:--'
    if (secs <= 0) return '00:00'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const isEmpty   = remaining === 0
  const isLow     = remaining === 1
  const isFull    = remaining >= total

  const accentColor = isEmpty ? 'text-red-400'
    : isLow           ? 'text-amber-400'
    : 'text-accent'

  const barColor = isEmpty ? 'bg-red-500'
    : isLow         ? 'bg-amber-400'
    : 'bg-accent'

  const borderColor = isEmpty ? 'border-red-500/20'
    : isLow           ? 'border-amber-400/20'
    : 'border-accent/20'

  const bgColor = isEmpty ? 'bg-red-500/5'
    : isLow         ? 'bg-amber-400/5'
    : 'bg-accent/5'

  // ── COMPACT PILL (used in generator header) ──────────────────────────────
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${borderColor} ${bgColor} text-xs font-medium ${className}`}>
        {justReset ? (
          <RefreshCw className={`w-3 h-3 ${accentColor} animate-spin`} />
        ) : (
          <Zap className={`w-3 h-3 ${accentColor}`} />
        )}

        {/* Segmented dots */}
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                i < remaining ? barColor : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <span className={`${accentColor} tabular-nums`}>
          {isEmpty
            ? `Resets ${formatCountdown(secondsLeft)}`
            : `${remaining}/${total} briefs`}
        </span>

        {!isEmpty && secondsLeft !== null && (
          <span className="text-tx-tertiary tabular-nums">
            · {formatCountdown(secondsLeft)}
          </span>
        )}
      </div>
    )
  }

  // ── CARD (used on dashboard) ─────────────────────────────────────────────
  return (
    <div className={`flex flex-col gap-3 px-4 py-3.5 bg-white dark:bg-[#121214] border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl shadow-sm w-full max-w-[260px] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {justReset ? (
            <RefreshCw className={`w-3.5 h-3.5 ${accentColor} animate-spin`} />
          ) : (
            <Zap className={`w-3.5 h-3.5 ${accentColor}`} />
          )}
          <span className="text-sm font-semibold text-tx-primary-light dark:text-tx-primary">
            Brief Credits
          </span>
        </div>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="px-2.5 py-1 bg-accent hover:bg-accent-light text-white text-[11px] font-semibold rounded-lg transition-all active:scale-[0.97]"
          >
            Upgrade
          </button>
        )}
      </div>

      {/* Count row */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold font-mono tabular-nums ${accentColor}`}>
            {remaining}
          </span>
          <span className="text-xs text-tx-tertiary font-mono">
            / {total} left
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-tx-tertiary">resets in</div>
          <div className={`text-sm font-mono font-bold tabular-nums ${isEmpty ? accentColor : 'text-tx-secondary'}`}>
            {formatCountdown(secondsLeft)}
          </div>
        </div>
      </div>

      {/* Segmented bar */}
      <div className="flex h-1.5 gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-500 ${
              i < remaining ? barColor : 'bg-white/[0.06] dark:bg-white/[0.05]'
            }`}
          />
        ))}
      </div>

      {/* Sub-label */}
      <p className="text-[11px] text-tx-tertiary leading-tight">
        {isEmpty
          ? 'Limit reached — come back when the timer hits 00:00'
          : isFull
          ? 'All 3 hourly briefs available'
          : `${remaining} brief${remaining !== 1 ? 's' : ''} remaining this hour`}
      </p>
    </div>
  )
}

export default StorageWidget
