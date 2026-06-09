import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { create } from 'zustand'

// ── Zustand store for toast queue ─────────────────────────────────────────────
let _nextId = 0

export const useToastStore = create((set) => ({
  toasts: [],
  push: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { id: ++_nextId, duration: 4000, ...toast }]
    })),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}))

// ── Convenience hook ──────────────────────────────────────────────────────────
export function useToast() {
  const push = useToastStore((s) => s.push)

  return {
    success: (message, opts) => push({ type: 'success', message, ...opts }),
    error:   (message, opts) => push({ type: 'error',   message, duration: 6000, ...opts }),
    warning: (message, opts) => push({ type: 'warning', message, ...opts }),
    info:    (message, opts) => push({ type: 'info',    message, ...opts }),
  }
}

// ── Individual toast item ─────────────────────────────────────────────────────
const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
  error:   <XCircle    className="w-4 h-4 text-red-500    shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
  info:    <Info       className="w-4 h-4 text-blue-500   shrink-0 mt-0.5" />,
}

const BORDER_COLORS = {
  success: 'border-emerald-500/20',
  error:   'border-red-500/20',
  warning: 'border-amber-500/20',
  info:    'border-blue-500/20',
}

function ToastItem({ toast }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => dismiss(toast.id), toast.duration)
    return () => clearTimeout(timerRef.current)
  }, [toast.id, toast.duration, dismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1     }}
      exit={{    opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.18 } }}
      className={`
        flex items-start gap-3 w-full max-w-sm
        bg-surface-light dark:bg-[#1a1a1a]
        border ${BORDER_COLORS[toast.type] || 'border-border'}
        rounded-2xl px-4 py-3.5 shadow-xl
        pointer-events-auto
      `}
    >
      {ICONS[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-tx-primary-light dark:text-tx-primary mb-0.5">
            {toast.title}
          </p>
        )}
        <p className="text-sm text-tx-secondary-light dark:text-tx-secondary leading-snug">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        className="text-tx-tertiary hover:text-tx-primary transition-colors shrink-0 mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

// ── Toast container — mount once in App.jsx ───────────────────────────────────
export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="fixed bottom-6 right-4 md:right-6 z-[200] flex flex-col gap-2.5 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
