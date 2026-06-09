import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import usePrefsStore from '../store/prefsStore'

export default function ThemeToggleButton() {
  const { theme, setPrefs } = usePrefsStore()
  const [variant] = useState('circle')
  const buttonRef = useRef(null)

  // Determine current active mode (resolving system preference if needed)
  const [resolvedTheme, setResolvedTheme] = useState('dark')

  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setResolvedTheme(isDark ? 'dark' : 'light')
    } else {
      setResolvedTheme(theme)
    }
  }, [theme])

  const toggleTheme = (e) => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    
    // Fallback if View Transitions API is not supported
    if (!document.startViewTransition) {
      setPrefs({ theme: nextTheme })
      return
    }

    // Get click coords for origin-based animations
    const x = e?.clientX ?? window.innerWidth / 2
    const y = e?.clientY ?? window.innerHeight / 2
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = document.startViewTransition(() => {
      // Update DOM
      setPrefs({ theme: nextTheme })
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }
        ],
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)'
        }
      )
    })
  }

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <div className="relative flex items-center">
      {/* Main Toggle Button */}
      <button
        ref={buttonRef}
        onClick={toggleTheme}
        className="p-2 rounded-xl text-tx-secondary hover:text-tx-primary bg-surface-raised-light dark:bg-[rgba(255,255,255,0.04)] border border-border dark:border-[rgba(255,255,255,0.06)] hover:border-accent/20 transition-colors shadow-sm relative overflow-hidden"
        title="Toggle Theme"
      >
        <motion.div
          key={resolvedTheme}
          initial={{ y: 10, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -10, opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <ThemeIcon className="w-4 h-4 text-accent" />
        </motion.div>
      </button>
    </div>
  )
}

