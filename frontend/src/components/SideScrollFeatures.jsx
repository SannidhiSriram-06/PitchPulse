import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

/**
 * SideScrollFeatures
 *
 * Sidebar stays pinned while feature sections scroll past.
 *
 * activeId is driven by a window scroll listener instead of IntersectionObserver.
 * IntersectionObserver mis-fires during programmatic smooth scrolls because
 * multiple sections cross the threshold simultaneously. A scroll listener
 * picks the section whose top is closest to 35% from the top of the viewport,
 * which always matches what the user actually sees.
 *
 * Sticky layout:
 *   parent flex + items-start  →  sidebar self-starts at the flex container top
 *   sidebar: sticky top-28 self-start  →  pins within the parent
 *   content: flex-1 (taller than sidebar) → defines when sidebar unpins
 *   NO overflow:hidden on any ancestor (breaks position:sticky)
 */
export default function SideScrollFeatures({ sections = [], heading = '', subheading = '' }) {
  const [activeId, setActiveId]   = useState(sections[0]?.id ?? '')
  const sectionRefs  = useRef({})
  const clickLock    = useRef(false)   // suppress scroll tracking during click-scroll
  const lockTimer    = useRef(null)

  // ── Scroll-position tracker ────────────────────────────────────────────────
  const updateActive = useCallback(() => {
    if (clickLock.current) return
    const target = window.innerHeight * 0.32

    let best = sections[0]?.id ?? ''
    let bestDist = Infinity

    for (const s of sections) {
      const el = sectionRefs.current[s.id]
      if (!el) continue
      const { top, bottom } = el.getBoundingClientRect()
      if (bottom < 0) continue          // already above viewport
      const dist = Math.abs(top - target)
      if (dist < bestDist) { bestDist = dist; best = s.id }
    }
    setActiveId(best)
  }, [sections])

  useEffect(() => {
    window.addEventListener('scroll', updateActive, { passive: true })
    updateActive()
    return () => window.removeEventListener('scroll', updateActive)
  }, [updateActive])

  useEffect(() => () => clearTimeout(lockTimer.current), [])

  // ── Click to scroll ────────────────────────────────────────────────────────
  const scrollTo = (id) => {
    const el = sectionRefs.current[id]
    if (!el) return
    setActiveId(id)                           // instant sidebar response
    clickLock.current = true                  // pause scroll tracker
    clearTimeout(lockTimer.current)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    lockTimer.current = setTimeout(() => { clickLock.current = false }, 1000)
  }

  const activeIndex = sections.findIndex(s => s.id === activeId)

  return (
    <section
      id="features"
      className="relative py-24 border-t border-stone-200/60 dark:border-white/[0.06] bg-stone-50 dark:bg-[#06060c]"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(120,113,108,0.12) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">

        {/* Heading */}
        {(heading || subheading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center mb-16"
          >
            {heading    && <h2 className="text-3xl md:text-4xl font-display font-bold mb-3 text-stone-900 dark:text-white">{heading}</h2>}
            {subheading && <p className="text-base text-stone-500 dark:text-stone-400 max-w-lg mx-auto">{subheading}</p>}
          </motion.div>
        )}

        {/*
          flex + items-start is critical — do not change to items-stretch or
          remove it. The sidebar's sticky works only while the parent is taller
          than the sidebar itself, which is guaranteed by items-start + flex-1 content.
        */}
        <div className="flex gap-12 xl:gap-20 items-start">

          {/* ── Sticky sidebar ──────────────────────────────────────── */}
          <aside className="hidden lg:block sticky top-28 self-start w-52 xl:w-60 shrink-0">
            <nav className="flex flex-col gap-0.5">
              {sections.map((s, idx) => {
                const isActive = activeId === s.id
                const isDone   = idx < activeIndex
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left group transition-colors duration-150 hover:bg-stone-200/60 dark:hover:bg-white/[0.04]"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-accent/[0.08] dark:bg-accent/10 border border-accent/20 rounded-xl"
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                      />
                    )}

                    <div className={`relative z-10 w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 transition-all duration-200 ${
                      isActive ? 'bg-accent text-white shadow-[0_2px_8px_rgba(255,107,44,0.35)]'
                      : isDone ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-400/20'
                               : 'bg-stone-200/80 dark:bg-white/[0.06] text-stone-400 border border-stone-300/50 dark:border-white/[0.07]'
                    }`}>
                      {isDone
                        ? <span className="text-[10px]">✓</span>
                        : s.icon ?? <span className="font-mono text-[10px]">{String(idx + 1).padStart(2, '0')}</span>
                      }
                    </div>

                    <span className={`relative z-10 text-[13px] font-medium transition-colors duration-150 ${
                      isActive ? 'text-stone-900 dark:text-white'
                      : isDone ? 'text-stone-400 line-through decoration-1'
                               : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300'
                    }`}>
                      {s.label}
                    </span>

                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-dot"
                        className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Progress bar */}
            <div
              className="mt-4 ml-[1.125rem] w-px bg-stone-200/80 dark:bg-white/[0.06] relative"
              style={{ height: `${sections.length * 2.6}rem` }}
            >
              <motion.div
                className="absolute top-0 left-0 w-full bg-accent origin-top rounded-full"
                animate={{ height: `${((activeIndex + 1) / sections.length) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </aside>

          {/* ── Content column ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-24 pb-12">
            {sections.map((s, idx) => (
              <div
                key={s.id}
                ref={(el) => { sectionRefs.current[s.id] = el }}
                className="scroll-mt-32"
              >
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Mobile label */}
                  <div className="flex items-center gap-2 mb-4 lg:hidden">
                    <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs">
                      {s.icon ?? <span className="font-mono text-[10px]">{String(idx + 1).padStart(2, '0')}</span>}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{s.label}</span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-display font-bold mb-2 text-stone-900 dark:text-white leading-tight">
                    {s.title}
                  </h3>
                  {s.subtitle && (
                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-5 leading-relaxed max-w-lg">
                      {s.subtitle}
                    </p>
                  )}
                  <div>{s.content}</div>
                </motion.div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
