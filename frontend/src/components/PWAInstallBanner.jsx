import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check if dismissed previously
    if (localStorage.getItem('pwa_dismissed') === 'true') return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    let iosTimer;
    if (ios) {
      iosTimer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      deferredPrompt.current = null;
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[1000] p-4 md:p-6" 
      style={{ animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
    >
      <div className="max-w-4xl mx-auto border shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4" 
        style={{ 
          background: 'var(--surface)', 
          borderColor: 'var(--border)', 
          borderRadius: 'var(--radius-lg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 flex-shrink-0 bg-[var(--accent-soft)] rounded-lg flex items-center justify-center border border-[var(--border-accent)]">
            <img src="/favicon.svg" alt="PitchPulse" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-800 text-sm leading-tight tracking-tight" style={{ color: 'var(--text)' }}>PitchPulse Native</span>
            <span className="text-xs" style={{ color: 'var(--text-sec)' }}>Install for the best mobile experience</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isIOS ? (
            <div className="text-[0.65rem] font-800 uppercase tracking-widest px-4 py-2.5 rounded-lg flex-1 sm:flex-none text-center" 
              style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-soft)', border: '1px solid var(--border-accent)' }}>
              Share <span className="inline-block mx-1">↑</span> Add to Home Screen
            </div>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="font-800 px-8 py-2.5 rounded-lg transition-all flex-1 sm:flex-none text-xs uppercase tracking-widest"
              style={{ background: 'var(--accent)', color: '#000', border: 'none', boxShadow: 'var(--accent-glow)' }}
            >
              Install App
            </button>
          )}
          
          <button 
            onClick={handleDismiss}
            className="p-2 flex-shrink-0 transition-colors rounded-full hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-sec)' }}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
