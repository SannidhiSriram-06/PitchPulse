import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!localStorage.getItem('pp_install_dismissed')) {
        setTimeout(() => setShow(true), 30000) // Show after 30s
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('pp_install_dismissed', 'true')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 md:hidden z-50 bg-surface border border-accent rounded-xl p-4 shadow-2xl"
        >
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" viewBox="0 0 32 32" fill="currentColor">
                <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="18">P</text>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-display font-medium text-sm">Install PitchPulse</h4>
              <p className="text-xs text-tx-secondary">Quick access before meetings</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleInstall} className="flex-1 bg-accent text-white py-2 rounded-lg text-sm font-medium">Install</button>
            <button onClick={handleDismiss} className="flex-1 bg-surface-raised border border-border py-2 rounded-lg text-sm font-medium">Dismiss</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
