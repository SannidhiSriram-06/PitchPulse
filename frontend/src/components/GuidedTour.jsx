import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles, HelpCircle, Navigation, Search, Shield, Zap, Mail, Sliders } from 'lucide-react'

const TOUR_STEPS = [
  {
    title: 'Welcome to PitchPulse! 🚀',
    content: 'PitchPulse is your AI-powered pre-meeting sales intelligence platform. We scan live web sources and financials to prepare you for any client meeting in 60 seconds. Let\'s take a quick tour of the features.',
    icon: <Sparkles className="w-8 h-8 text-accent animate-pulse" />
  },
  {
    title: '1. The Top Navigation & Search 🔍',
    content: 'Use the quick search bar in the top header to instantly search for any of your generated company briefs. You can also access Dashboard, New Brief generator, and History pages directly on desktop.',
    icon: <Search className="w-8 h-8 text-accent" />
  },
  {
    title: '2. Command Palette (⌘K) ⚡',
    content: 'Need to move around fast? Press ⌘K or Ctrl+K anywhere to bring up the global Command Palette. Navigate pages, search commands, or toggle light/dark modes instantly.',
    icon: <Navigation className="w-8 h-8 text-indigo-400" />
  },
  {
    title: '3. Generating a Custom Brief 📋',
    content: 'Click "New Brief" at any time. You can customize the brief length, select target sections, select a meeting type (like Cold Call or Renewal), and type a single natural language prompt. The AI extracts the company name and context automatically!',
    icon: <Zap className="w-8 h-8 text-amber-400" />
  },
  {
    title: '4. The Watchlist Sidebar 📌',
    content: 'Pin your high-value target accounts on the left sidebar. You can monitor them at a glance and trigger a new brief with a single click before you hop on a call.',
    icon: <Sliders className="w-8 h-8 text-emerald-400" />
  },
  {
    title: '5. Email Sharing & Scheduled Briefs ✉️',
    content: 'Open any generated brief to email it to yourself. You can also schedule automated crawls (like Nvidia at 2:45 PM tomorrow) so a fresh brief lands in your inbox 3 minutes before your meeting begins.',
    icon: <Mail className="w-8 h-8 text-accent" />
  }
]

export default function GuidedTour({ active, onClose }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (active) {
      setStep(0)
    }
  }, [active])

  if (!active) return null

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      localStorage.setItem('pp_tour_completed', 'true')
      onClose()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const currentStep = TOUR_STEPS[step]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
        />

        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-[#141414] border border-border dark:border-[rgba(255,255,255,0.08)] w-full max-w-md rounded-2xl p-6 shadow-2xl pointer-events-auto squircle mx-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-tx-tertiary">
                Step {step + 1} of {TOUR_STEPS.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-tx-tertiary hover:text-tx-primary transition-colors p-1 rounded-lg hover:bg-surface-raised"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Center Graphic */}
          <div className="w-16 h-16 rounded-2xl bg-accent/5 dark:bg-accent/10 flex items-center justify-center mb-5 border border-accent/15">
            {currentStep.icon}
          </div>

          {/* Title & Body */}
          <h3 className="font-display font-bold text-lg mb-2 text-tx-primary-light dark:text-tx-primary">
            {currentStep.title}
          </h3>
          <p className="text-sm text-tx-secondary-light dark:text-tx-secondary mb-6 leading-relaxed">
            {currentStep.content}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border dark:border-[rgba(255,255,255,0.04)]">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-1 text-xs font-semibold text-tx-tertiary hover:text-tx-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === step ? 'bg-accent w-3.5' : 'bg-surface-raised dark:bg-surface-raised/60'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4.5 py-2 bg-accent hover:bg-accent-light text-white text-xs font-bold rounded-xl transition-all"
            >
              {step === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
