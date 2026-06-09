import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function MobileBottomNav({ navItems }) {
  const location = useLocation()
  const [hoveredPath, setHoveredPath] = useState(null)

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-surface-light/80 dark:bg-surface/80 backdrop-blur-xl border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl shadow-xl flex justify-around items-center px-2 z-50 overflow-hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        const isHovered = hoveredPath === item.path
        const shouldShowLabel = isActive || isHovered

        return (
          <Link
            key={item.path}
            to={item.path}
            onMouseEnter={() => setHoveredPath(item.path)}
            onMouseLeave={() => setHoveredPath(null)}
            className="relative flex items-center justify-center py-2 px-3 rounded-xl transition-colors cursor-pointer select-none focus:outline-none"
          >
            {/* Background pill animation for active tab */}
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-accent/10 dark:bg-accent/20 rounded-xl -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            {/* Hover background */}
            {isHovered && !isActive && (
              <motion.div
                layoutId="hoverTabPill"
                className="absolute inset-0 bg-surface-raised-light dark:bg-[rgba(255,255,255,0.04)] rounded-xl -z-20"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            {/* Content Container */}
            <motion.div 
              layout 
              className="flex items-center gap-2"
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <span className={isActive ? 'text-accent' : 'text-tx-secondary dark:text-tx-tertiary'}>
                {item.icon}
              </span>
              
              <AnimatePresence initial={false}>
                {shouldShowLabel && (
                  <motion.span
                    initial={{ width: 0, opacity: 0, scale: 0.8 }}
                    animate={{ width: 'auto', opacity: 1, scale: 1 }}
                    exit={{ width: 0, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`text-xs font-semibold whitespace-nowrap overflow-hidden ${
                      isActive ? 'text-accent' : 'text-tx-primary'
                    }`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        )
      })}
    </nav>
  )
}
