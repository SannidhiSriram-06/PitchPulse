import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export default function WatchDial({ remaining = 3, total = 3 }) {
  // Clamp value
  const val = Math.max(0, Math.min(remaining, total))
  const percentage = (val / total) * 100

  // SVG parameters for circle
  const radius = 18
  const strokeWidth = 3
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex items-center gap-3 bg-surface-raised-light dark:bg-[#141414] border border-border dark:border-[rgba(255,255,255,0.06)] px-4 py-2 rounded-2xl shadow-sm noise">
      {/* Dial SVG */}
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-95">
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-border dark:stroke-[rgba(255,255,255,0.04)]"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress circle */}
          <motion.circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-accent"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono font-bold text-tx-primary-light dark:text-tx-primary">
            {val}
          </span>
        </div>
      </div>

      {/* Info labels */}
      <div className="text-left">
        <div className="text-[10px] uppercase tracking-wider text-tx-tertiary font-bold flex items-center gap-1">
          <Zap className="w-3 h-3 text-accent animate-pulse" />
          <span>Credits Remaining</span>
        </div>
        <div className="text-xs font-semibold text-tx-secondary-light dark:text-tx-secondary">
          {val === 0 ? 'Limit reached' : `${val} of ${total} scans left`}
        </div>
      </div>
    </div>
  )
}
