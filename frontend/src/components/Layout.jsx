import { Link, useLocation } from 'react-router-dom'
import { Plus, Home, History, Settings } from 'lucide-react'
import WatchlistSidebar from './WatchlistSidebar'
import MobileBottomNav from './MobileBottomNav'
import VercelNav from './VercelNav'

export default function Layout({ children }) {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', icon: <Home    className="w-5 h-5" />, label: 'Home'     },
    { path: '/brief/new', icon: <Plus    className="w-5 h-5" />, label: 'New'      },
    { path: '/history',   icon: <History className="w-5 h-5" />, label: 'History'  },
    { path: '/settings',  icon: <Settings className="w-5 h-5" />, label: 'Settings' }
  ]

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg">
      {/* Top navbar — h-14 = 56px */}
      <VercelNav />

      {/* Left sidebar — starts directly below the navbar */}
      <aside className="hidden md:block fixed left-0 top-14 w-56 h-[calc(100vh-3.5rem)] border-r border-border dark:border-[rgba(255,255,255,0.04)] overflow-y-auto bg-surface-light dark:bg-[#0e0e0e]">
        <WatchlistSidebar />
      </aside>

      {/* Main content
          pt-[calc(3.5rem+1.5rem)] = navbar (56px) + gap (24px) = 80px
          On mobile: extra bottom padding for the floating bottom nav */}
      <main className="md:ml-56 pt-20 pb-28 md:pb-8 px-5 md:px-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav navItems={navItems} />
    </div>
  )
}
