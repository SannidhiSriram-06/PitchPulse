import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ChevronRight, Settings, Sliders, HelpCircle, Search } from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import ThemeToggleButton from './ThemeToggleButton'
import usePrefsStore from '../store/prefsStore'

const ROUTE_LABELS = {
  dashboard:  'Dashboard',
  brief:      'Briefs',
  new:        'New Brief',
  history:    'History',
  settings:   'Settings',
  onboarding: 'Onboarding',
  share:      'Shared Brief',
}

export default function VercelNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setTourActive } = usePrefsStore()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/history?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean)
    const crumbs = [{ label: 'PitchPulse', path: '/dashboard' }]

    parts.forEach((part, idx) => {
      // Skip 'share' path segment on the brief share route — handled by parent
      if (part === 'share' && idx > 0) return

      // Share token — don't show raw token string
      if (idx > 0 && parts[idx - 1] === 'share') {
        crumbs.push({ label: 'Shared Brief', path: null })
        return
      }

      // Numeric brief ID
      if (!isNaN(part)) {
        crumbs.push({ label: `Brief #${part}`, path: '/' + parts.slice(0, idx + 1).join('/') })
        return
      }

      // Skip 'dashboard' since PitchPulse already links to it
      if (part === 'dashboard') return

      const label = ROUTE_LABELS[part] || (part.charAt(0).toUpperCase() + part.slice(1))
      crumbs.push({ label, path: '/' + parts.slice(0, idx + 1).join('/') })
    })

    return crumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <nav className="fixed top-0 w-full h-14 bg-surface-light/80 dark:bg-bg/80 backdrop-blur-xl border-b border-border dark:border-[rgba(255,255,255,0.05)] z-50 flex items-center justify-between px-4 md:px-6">
      {/* Left: Brand + breadcrumbs */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-display font-bold text-xs">P</span>
          </div>
        </Link>

        {breadcrumbs.map((crumb, idx) => (
          <div key={idx} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="w-3 h-3 text-tx-tertiary shrink-0" />
            {crumb.path ? (
              <Link
                to={crumb.path}
                className={`text-sm font-medium transition-colors truncate max-w-[90px] sm:max-w-[160px] ${
                  idx === breadcrumbs.length - 1
                    ? 'text-tx-primary-light dark:text-tx-primary font-semibold'
                    : 'text-tx-tertiary hover:text-tx-primary-light dark:hover:text-tx-primary'
                }`}
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-tx-primary-light dark:text-tx-primary truncate max-w-[90px] sm:max-w-[160px]">
                {crumb.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Middle: Nav Links & Search */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-5">
          <Link to="/dashboard" className="text-xs font-semibold text-tx-secondary hover:text-tx-primary transition-colors">Dashboard</Link>
          <Link to="/brief/new" className="text-xs font-semibold text-tx-secondary hover:text-accent transition-colors">New Brief</Link>
          <Link to="/history" className="text-xs font-semibold text-tx-secondary hover:text-tx-primary transition-colors">History</Link>
        </div>

        <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-xs w-56">
          <Search className="w-3.5 h-3.5 text-tx-tertiary absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search briefs..."
            className="w-full bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-accent/50 transition-colors dark:text-white"
          />
        </form>
      </div>

      {/* Right: theme toggle + settings + preferences + tour + profile */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            navigate('/dashboard')
            setTourActive(true)
          }}
          title="Take Guided Tour"
          className="p-1.5 text-tx-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
        >
          <HelpCircle className="w-4 h-4 text-accent" />
        </button>
        <Link
          to="/settings?tab=preferences"
          title="Preferences"
          className="p-1.5 text-tx-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
        >
          <Sliders className="w-4 h-4" />
        </Link>
        <Link
          to="/settings"
          title="Account Settings"
          className="p-1.5 text-tx-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
        >
          <Settings className="w-4 h-4" />
        </Link>
        <ThemeToggleButton />
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-7 h-7 ring-2 ring-border dark:ring-[rgba(255,255,255,0.06)] ring-offset-2 ring-offset-bg-light dark:ring-offset-bg rounded-lg',
              userButtonPopoverCard: 'bg-surface border border-[rgba(255,255,255,0.06)] squircle',
            }
          }}
        />
      </div>
    </nav>
  )
}
