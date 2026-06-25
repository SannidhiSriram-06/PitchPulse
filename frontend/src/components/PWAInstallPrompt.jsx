import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share } from 'lucide-react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    // Check if device is iOS and not already standalone
    const isDeviceIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
    
    if (isDeviceIOS && !isStandalone) {
      setIsIOS(true)
      if (!localStorage.getItem('pp_install_dismissed')) {
        timerRef.current = setTimeout(() => setShow(true), 15000) // Show iOS guide after 15s
      }
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!localStorage.getItem('pp_install_dismissed')) {
        timerRef.current = setTimeout(() => setShow(true), 30000) // Show Android prompt after 30s
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
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
              <span className="text-white font-display font-bold text-lg">P</span>
            </div>
            <div className="flex-1">
              <h4 className="font-display font-medium text-sm">Install PitchPulse</h4>
              <p className="text-xs text-tx-secondary">
                {isIOS 
                  ? "Tap the Share button below, then 'Add to Home Screen'" 
                  : "Install for quick access before meetings"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {isIOS ? (
              <div className="flex-1 flex items-center justify-center gap-1.5 bg-surface-raised border border-border py-2 rounded-lg text-xs font-semibold text-tx-primary">
                <Share className="w-3.5 h-3.5 text-accent" /> Use Safari Share menu
              </div>
            ) : (
              <button onClick={handleInstall} className="flex-1 bg-accent text-white py-2 rounded-lg text-sm font-medium">Install</button>
            )}
            <button onClick={handleDismiss} className="px-4 bg-surface-raised border border-border py-2 rounded-lg text-sm font-medium">Dismiss</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

