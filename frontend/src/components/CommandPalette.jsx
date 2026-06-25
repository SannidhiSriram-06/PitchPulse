import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Search, Home, Plus, History, Settings, Sun, Moon, Sparkles, CornerDownLeft } from 'lucide-react'
import usePrefsStore from '../store/prefsStore'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const { theme, setPrefs } = usePrefsStore()
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Open with ⌘K / Ctrl+K or custom event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(prev => !prev)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    const handleOpenEvent = () => {
      setOpen(true)
    }
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleOpenEvent)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleOpenEvent)
    }
  }, [open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const commands = [
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      category: 'Navigation',
      icon: <Home    className="w-4 h-4 text-accent" />,
      action: () => navigate('/dashboard'),
    },
    {
      id: 'new-brief',
      title: 'Generate New Brief',
      category: 'Navigation',
      icon: <Plus    className="w-4 h-4 text-accent" />,
      action: () => navigate('/brief/new'),
    },
    {
      id: 'history',
      title: 'View History',
      category: 'Navigation',
      icon: <History className="w-4 h-4 text-accent" />,
      action: () => navigate('/history'),
    },
    {
      id: 'settings',
      title: 'Account Settings',
      category: 'Navigation',
      icon: <Settings className="w-4 h-4 text-accent" />,
      action: () => navigate('/settings'),
    },
    {
      id: 'theme-dark',
      title: 'Switch to Dark Mode',
      category: 'Appearance',
      icon: <Moon className="w-4 h-4 text-purple-400" />,
      action: () => setPrefs({ theme: 'dark' }),
    },
    {
      id: 'theme-light',
      title: 'Switch to Light Mode',
      category: 'Appearance',
      icon: <Sun  className="w-4 h-4 text-amber-400" />,
      action: () => setPrefs({ theme: 'light' }),
    },
    {
      id: 'theme-system',
      title: 'Use System Theme',
      category: 'Appearance',
      icon: <Sparkles className="w-4 h-4 text-tx-secondary" />,
      action: () => setPrefs({ theme: 'system' }),
    },
  ]

  const filtered = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  )

  // Keyboard navigation inside the palette
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => (i + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => (i - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) runCommand(filtered[selectedIndex].action)
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, selectedIndex, filtered])

  const runCommand = (action) => {
    setOpen(false)
    action()
  }

  // Group by category
  const categories = {}
  filtered.forEach((cmd, idx) => {
    if (!categories[cmd.category]) categories[cmd.category] = []
    categories[cmd.category].push({ ...cmd, globalIndex: idx })
  })

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{  opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.12 }}
            className="relative w-full max-w-xl bg-surface-light dark:bg-[#141414] border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl shadow-2xl overflow-hidden noise squircle"
            ref={containerRef}
          >
            {/* Search row */}
            <div className="flex items-center border-b border-border dark:border-[rgba(255,255,255,0.06)] px-4 py-3.5 bg-surface-raised-light dark:bg-[#111111]/80">
              <Search className="w-4 h-4 text-tx-tertiary mr-3 shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0) }}
                placeholder="Search commands..."
                className="w-full bg-transparent border-none outline-none text-sm text-tx-primary-light dark:text-tx-primary placeholder:text-tx-tertiary/60"
              />
              <kbd className="hidden sm:flex items-center gap-1 bg-surface-light dark:bg-[#1c1c1c] border border-border dark:border-[rgba(255,255,255,0.06)] px-2 py-1 rounded-lg text-[10px] font-mono text-tx-tertiary shrink-0 select-none">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <LayoutGroup id="cmd-palette">
              <div className="max-h-[340px] overflow-y-auto p-2 scrollbar-thin">
                {filtered.length === 0 ? (
                  <div className="py-10 text-center text-sm text-tx-secondary flex flex-col items-center gap-2">
                    <Sparkles className="w-6 h-6 text-accent/40 animate-pulse" />
                    <span>No results for "{search}"</span>
                  </div>
                ) : (
                  Object.entries(categories).map(([cat, items]) => (
                    <div key={cat} className="mb-3 last:mb-0">
                      <div className="px-3 py-1 text-[10px] font-bold text-tx-tertiary/50 uppercase tracking-widest select-none">
                        {cat}
                      </div>
                      <div className="space-y-0.5">
                        {items.map((item) => {
                          const isSelected = item.globalIndex === selectedIndex
                          return (
                            <div
                              key={item.id}
                              onClick={() => runCommand(item.action)}
                              onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                              className="relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer select-none"
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="cmd-selected"
                                  className="absolute inset-0 bg-surface-raised-light dark:bg-[#1f1f1f] border border-border dark:border-[rgba(255,255,255,0.04)] rounded-xl -z-10"
                                  transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                                />
                              )}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-light dark:bg-[#1a1a1a] border border-border dark:border-[rgba(255,255,255,0.06)] shrink-0">
                                  {item.icon}
                                </div>
                                <span className={`text-sm font-medium truncate transition-colors ${
                                  isSelected
                                    ? 'text-tx-primary-light dark:text-tx-primary'
                                    : 'text-tx-secondary-light dark:text-tx-secondary'
                                }`}>
                                  {item.title}
                                </span>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex items-center gap-1 text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20 shrink-0"
                                >
                                  Enter <CornerDownLeft className="w-2.5 h-2.5" />
                                </motion.div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </LayoutGroup>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border dark:border-[rgba(255,255,255,0.06)] px-4 py-2.5 bg-surface-raised-light/40 dark:bg-[#111111]/40 text-[11px] text-tx-tertiary select-none font-mono">
              <div className="flex items-center gap-3">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
              </div>
              <kbd className="bg-surface-light dark:bg-[#1c1c1c] border border-border dark:border-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded text-[10px]">
                ⌘K
              </kbd>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
