import { useEffect } from 'react';

export default function RateLimitModal({ resetInMinutes, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <div
        className="border p-8 max-w-sm w-full space-y-6 relative overflow-hidden"
        style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--accent)' }} />
        
        <h2 className="text-2xl font-800 tracking-tighter" style={{ color: 'var(--text)' }}>Limit Reached</h2>
        
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sec)' }}>
            You've exhausted your 3 free intelligence briefs for this hour. 
          </p>
          <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-1">Status</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {resetInMinutes
                ? `System reset in ${resetInMinutes} minutes.`
                : 'Resets in approximately 60 minutes.'}
            </p>
          </div>
        </div>

        <p className="text-[0.65rem] uppercase tracking-widest font-bold pt-4 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
          Pro tier with unlimited briefs — coming soon.
        </p>
        
        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg font-800 text-sm transition-all"
          style={{ background: 'var(--accent)', color: '#000', border: 'none', boxShadow: 'var(--accent-glow)' }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
