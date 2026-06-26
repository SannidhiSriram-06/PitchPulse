import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles, Navigation, Search, Zap, Mail, Sliders } from 'lucide-react'

export default function GuidedTour({ active, onClose }) {
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState(null)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  const tourSteps = [
    {
      title: 'Welcome to PitchPulse! 🚀',
      content: 'PitchPulse is your AI-powered pre-meeting sales intelligence platform. We scan live web sources and financials to prepare you for any client meeting in 60 seconds. Let\'s take a quick tour.',
      icon: <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-accent animate-pulse" />,
      selector: null
    },
    {
      title: '1. Quick Brief Search 🔍',
      content: isMobile 
        ? 'Tap the search icon in the top navigation to instantly bring up the global search.'
        : 'Use the search bar in the top navigation to instantly search for any of your generated company briefs.',
      icon: <Search className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />,
      selector: isMobile ? 'button[title="Search / Command Palette"]' : 'input[placeholder="Search briefs..."]'
    },
    {
      title: '2. Generating a Custom Brief 📋',
      content: 'Click "New Brief" at any time to create a tailored sales brief. Customize the length, select sections, add client context, or upload a product PDF.',
      icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />,
      selector: 'a[href="/brief/new"]'
    },
    {
      title: isMobile ? '3. Watchlist Accounts 📌' : '3. The Watchlist Sidebar 📌',
      content: isMobile
        ? 'Monitor your pinned high-value target accounts on your dashboard watchlist tab.'
        : 'Pin your high-value target accounts in the left sidebar to monitor them at a glance and quickly trigger new briefs before meetings.',
      icon: <Sliders className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />,
      selector: isMobile ? null : 'aside'
    },
    {
      title: isMobile ? '4. Command Palette ⚡' : '4. Command Palette (⌘K) ⚡',
      content: isMobile
        ? 'Tap the search icon in the top navigation to open the Command Palette. Quickly navigate pages or toggle themes.'
        : 'Press ⌘K or Ctrl+K anywhere to bring up the global Command Palette. Quickly navigate pages, search commands, or toggle light/dark modes.',
      icon: <Navigation className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />,
      selector: isMobile ? 'button[title="Search / Command Palette"]' : 'button[title="Take Guided Tour"]'
    }
  ]

  const currentStep = tourSteps[step]

  // Track the bounding rectangle of the target element
  useEffect(() => {
    if (!active) {
      setTargetRect(null)
      return
    }

    const updateRect = () => {
      if (currentStep.selector) {
        const el = document.querySelector(currentStep.selector)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            setTargetRect(rect)
            return
          }
        }
      }
      setTargetRect(null)
    }

    // Delay slightly to allow layout and page transitions to complete
    const timeoutId = setTimeout(updateRect, 100)
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect)
    }
  }, [active, step, currentStep.selector])

  if (!active) return null

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
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

  const getCardStyle = () => {
    // If mobile viewport (< 640px), position absolute-like at the bottom above navigation bar
    if (window.innerWidth < 640) {
      return {
        position: 'fixed',
        left: '16px',
        right: '16px',
        bottom: '88px',
        zIndex: 1000
      }
    }

    if (!targetRect) {
      // Center card overlay on desktop/fallback
      return {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      }
    }

    const margin = 16
    const cardWidth = 380
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = targetRect.left + targetRect.width / 2 - cardWidth / 2
    let top = targetRect.bottom + margin

    // Check if it fits below the target
    if (top + 260 > viewportHeight) {
      // Position above the target
      top = targetRect.top - 260 - margin
    }

    // Bound left and right within safe area
    left = Math.max(margin, Math.min(viewportWidth - cardWidth - margin, left))
    top = Math.max(margin, Math.min(viewportHeight - 260 - margin, top))

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${cardWidth}px`,
      zIndex: 1000
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] pointer-events-none">
        {/* Dynamic spotlight overlay using SVG mask */}
        <svg className="fixed inset-0 w-full h-full pointer-events-auto">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          {/* Translucent background covering everything except mask */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.65)"
            mask="url(#spotlight-mask)"
            className="transition-all duration-300 pointer-events-auto"
            onClick={onClose}
          />
        </svg>

        {/* Tour Card */}
        <motion.div
          layout={!isMobile && !!targetRect}
          initial={{ opacity: 0, scale: 0.95, y: isMobile ? 12 : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: isMobile ? 12 : 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={getCardStyle()}
          className="bg-white dark:bg-[#141414] border border-border dark:border-[rgba(255,255,255,0.08)] sm:w-[380px] rounded-2xl p-5 sm:p-6 shadow-2xl pointer-events-auto squircle"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <span className="text-[10px] uppercase font-mono tracking-widest text-tx-tertiary">
              Step {step + 1} of {tourSteps.length}
            </span>
            <button
              onClick={onClose}
              className="text-tx-tertiary hover:text-tx-primary transition-colors p-1 rounded-lg hover:bg-surface-raised"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Graphic Icon */}
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-accent/5 dark:bg-accent/10 flex items-center justify-center mb-3 sm:mb-4 border border-accent/15">
            {currentStep.icon}
          </div>

          {/* Title & Content */}
          <h3 className="font-display font-bold text-sm sm:text-base mb-1.5 sm:mb-2 text-tx-primary-light dark:text-tx-primary leading-tight">
            {currentStep.title}
          </h3>
          <p className="text-xs sm:text-sm text-tx-secondary-light dark:text-tx-secondary mb-4 sm:mb-6 leading-relaxed">
            {currentStep.content}
          </p>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-3.5 sm:pt-4 border-t border-border dark:border-[rgba(255,255,255,0.04)]">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-1 text-xs font-semibold text-tx-tertiary hover:text-tx-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            
            <div className="flex items-center gap-1">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full transition-all ${
                    i === step ? 'bg-accent w-3.5' : 'bg-surface-raised dark:bg-surface-raised/60'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-accent hover:bg-accent-light text-white text-xs font-bold rounded-xl transition-all"
            >
              {step === tourSteps.length - 1 ? 'Finish Tour' : 'Next Step'} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
