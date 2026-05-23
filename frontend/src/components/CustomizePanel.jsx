import { useEffect } from 'react';
import usePrefsStore from '../store/prefsStore';
import useThemeStore from '../store/themeStore';
import api from '../lib/api';
import { X } from 'lucide-react';

export default function CustomizePanel({ onClose }) {
  const { defaultView, setDefaultView, showWatchlist, setShowWatchlist, showSources, setShowSources } = usePrefsStore();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const syncPrefs = async (updates) => {
    try {
      await api.patch('/api/user/preferences', updates);
    } catch (e) {
      console.error('Failed to sync prefs', e);
    }
  };

  const handleTheme = (val) => {
    if (theme !== val) {
      toggleTheme();
    }
  };

  const handleDefaultView = (val) => {
    setDefaultView(val);
    syncPrefs({ default_view: val });
  };

  const handleShowWatchlist = (val) => {
    setShowWatchlist(val);
    syncPrefs({ show_watchlist: val });
  };

  const handleShowSources = (val) => {
    setShowSources(val);
    syncPrefs({ show_sources: val });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[199]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[300px] z-[200] border-l flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', backdropFilter: 'blur(30px)' }}>
        
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="font-bold text-sm uppercase tracking-widest text-[var(--text-muted)]">Customize</span>
          <button onClick={onClose} className="p-1 hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-sec)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--text-muted)' }}>Visual Theme</p>
            <div className="flex bg-[var(--bg)] p-1 rounded-lg border border-[var(--border)]">
              {['dark', 'light'].map(t => (
                <button key={t} onClick={() => handleTheme(t)}
                  className="flex-1 py-2 rounded-md text-xs font-bold transition-all capitalize"
                  style={{
                    background: theme === t ? 'var(--accent)' : 'transparent',
                    color: theme === t ? '#000' : 'var(--text-sec)',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--text-muted)' }}>Default Data View</p>
            <div className="flex bg-[var(--bg)] p-1 rounded-lg border border-[var(--border)]">
              {['tabs', 'cards'].map(v => (
                <button key={v} onClick={() => handleDefaultView(v)}
                  className="flex-1 py-2 rounded-md text-xs font-bold transition-all capitalize"
                  style={{
                    background: defaultView === v ? 'var(--accent)' : 'transparent',
                    color: defaultView === v ? '#000' : 'var(--text-sec)',
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--text-muted)' }}>Panel Configuration</p>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium group-hover:text-[var(--text)] transition-colors">Watchlist Panel</span>
                <input type="checkbox" checked={showWatchlist} onChange={e => handleShowWatchlist(e.target.checked)} 
                  className="w-4 h-4 rounded" style={{ accentColor: 'var(--accent)' }} />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium group-hover:text-[var(--text)] transition-colors">Show Sources</span>
                <input type="checkbox" checked={showSources} onChange={e => handleShowSources(e.target.checked)} 
                  className="w-4 h-4 rounded" style={{ accentColor: 'var(--accent)' }} />
              </label>
            </div>
          </div>

        </div>

        <div className="p-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg text-sm font-bold tracking-tight shadow-lg"
            style={{ background: 'var(--accent)', color: '#000', border: 'none', cursor: 'pointer', boxShadow: 'var(--accent-glow)' }}>
            Confirm Changes
          </button>
        </div>
      </div>
    </>
  );
}
