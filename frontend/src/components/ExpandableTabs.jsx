import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ExpandableTabs({ tabs, activeTab, onChange, className = "" }) {
  const [hoveredTab, setHoveredTab] = useState(null)
  const [prevIndex, setPrevIndex] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)

  const activeIndex = tabs.findIndex(t => t.id === activeTab)
  
  useEffect(() => {
    if (activeIndex !== -1) {
      setPrevIndex(currentIndex)
      setCurrentIndex(activeIndex)
    }
  }, [activeTab, activeIndex, currentIndex])

  const direction = currentIndex > prevIndex ? 1 : -1

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Tabs list */}
      <div className="flex bg-surface-raised-light dark:bg-surface-raised border border-border dark:border-[rgba(255,255,255,0.06)] p-1.5 rounded-2xl w-fit items-center gap-1 relative z-10 squircle">
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTab
          const isHovered = hoveredTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors relative outline-none ${
                isActive 
                  ? 'text-tx-primary-light dark:text-tx-primary bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)]' 
                  : 'text-tx-secondary-light dark:text-tx-secondary hover:text-tx-primary-light dark:hover:text-tx-primary'
              }`}
            >
              {/* Background Indicator using Layout ID */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-xl -z-10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              
              {/* Icon */}
              <div className="flex items-center justify-center shrink-0">
                {tab.icon}
              </div>
              
              {/* Label - expanding on active OR hovered */}
              <motion.span
                initial={false}
                animate={{
                  width: isActive || isHovered ? 'auto' : 0,
                  opacity: isActive || isHovered ? 1 : 0,
                  marginLeft: isActive || isHovered ? 4 : 0
                }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden whitespace-nowrap text-tx-primary-light dark:text-tx-primary"
              >
                {tab.label}
              </motion.span>
            </button>
          )
        })}
      </div>

      {/* Content panel with dynamic height & direction-aware transitions */}
      <motion.div 
        layout 
        className="relative overflow-hidden bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl shadow-sm squircle"
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            variants={{
              enter: (dir) => ({
                x: dir * 30,
                opacity: 0
              }),
              center: {
                x: 0,
                opacity: 1
              },
              exit: (dir) => ({
                x: -dir * 30,
                opacity: 0
              })
            }}
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.15 }
            }}
            className="w-full p-6"
          >
            {tabs[currentIndex]?.content}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
