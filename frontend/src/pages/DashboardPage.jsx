import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Bookmark, AlertTriangle, FileText, Clock, Calendar, ArrowRight, ChevronRight, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import Layout from '../components/Layout'
import useAuthStore from '../store/authStore'
import ExpandableTabs from '../components/ExpandableTabs'
import ShiftCard from '../components/ShiftCard'
import StorageWidget from '../components/StorageWidget'
import { useToast } from '../components/Toast'
import GuidedTour from '../components/GuidedTour'
import usePrefsStore from '../store/prefsStore'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.32, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

export default function DashboardPage() {
  const [briefs, setBriefs]       = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [totalBriefs, setTotalBriefs] = useState(0)
  const [activeTab, setActiveTab] = useState('recent')
  const [loading, setLoading]     = useState(true)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { tourActive, setTourActive } = usePrefsStore()
  const toast = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [briefsRes, watchlistRes, scheduledRes] = await Promise.all([
          api.get('/api/briefs?limit=12'),
          api.get('/api/watchlist'),
          api.get('/api/scheduled')
        ])
        setBriefs(briefsRes.data.briefs || [])
        setTotalBriefs(briefsRes.data.total || 0)
        setWatchlist(watchlistRes.data.watchlist || [])
        setScheduled(scheduledRes.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const deleteBrief = async (e, id) => {
    e.stopPropagation()
    try {
      await api.delete(`/api/briefs/${id}`)
      setBriefs(prev => prev.filter(b => b.id !== id))
      setTotalBriefs(t => Math.max(0, t - 1))
      toast.success('Brief deleted')
    } catch {
      toast.error('Failed to delete brief')
    }
  }

  const cancelScheduled = async (e, id) => {
    e.stopPropagation()
    try {
      await api.delete(`/api/scheduled/${id}`)
      setScheduled(prev => prev.filter(s => s.id !== id))
      toast.success('Scheduled scan cancelled')
    } catch {
      toast.error('Failed to cancel scan')
    }
  }

  const tabs = [
    {
      id: 'recent',
      label: 'Recent Briefs',
      icon: <Clock className="w-3.5 h-3.5" />,
      content: briefs.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-raised-light dark:bg-surface-raised flex items-center justify-center">
            <FileText className="w-6 h-6 text-tx-tertiary" />
          </div>
          <div>
            <p className="text-sm font-medium text-tx-primary-light dark:text-tx-primary mb-1">No briefs yet</p>
            <p className="text-xs text-tx-secondary">Generate your first AI brief to get started</p>
          </div>
          <Link
            to="/brief/new"
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Generate your first brief
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {briefs.map((brief, idx) => (
              <ShiftCard
                key={brief.id}
                onClick={() => navigate(`/brief/${brief.id}`)}
                topContent={
                  <div className="flex justify-between items-start w-full">
                    <h3 className="font-display font-semibold text-base truncate pr-2 group-hover:text-accent transition-colors text-tx-primary-light dark:text-tx-primary">
                      {brief.company_name}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {brief.limited_data && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Limited data" />}
                      {brief.saved && <Bookmark className="w-3.5 h-3.5 text-accent fill-accent" />}
                    </div>
                  </div>
                }
                topAnimateContent={
                  <div className="absolute top-1.5 right-2 text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                    {brief.length_used}
                  </div>
                }
                middleContent={
                  brief.preview ? (
                    <p className="text-sm text-tx-secondary-light dark:text-tx-secondary line-clamp-3 leading-relaxed text-center px-4 transition-colors group-hover:text-tx-primary-light dark:group-hover:text-tx-primary">
                      {brief.preview}
                    </p>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center px-4 opacity-40 group-hover:opacity-70 transition-opacity">
                      <FileText className="w-8 h-8 text-accent/60 stroke-[1.5]" />
                      <span className="text-xs font-mono tracking-wider">Quick scan complete</span>
                    </div>
                  )
                }
                bottomContent={
                  <div className="w-full bg-surface-raised-light dark:bg-[#111111]/80 border-t border-border dark:border-[rgba(255,255,255,0.04)] p-3 rounded-b-2xl flex items-center justify-between transition-colors group-hover:bg-accent/5">
                    <span className="flex items-center gap-1.5 text-tx-tertiary text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono">{new Date(brief.created_at).toLocaleDateString()}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => deleteBrief(e, brief.id)}
                        className="p-1 rounded-lg text-tx-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete brief"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-semibold text-accent flex items-center gap-1">
                        View <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                }
              />
            ))}
          </div>

          {/* See all link */}
          {totalBriefs > briefs.length && (
            <div className="flex justify-center pt-2">
              <Link
                to="/history"
                className="flex items-center gap-1.5 text-sm text-tx-secondary hover:text-accent font-medium transition-colors"
              >
                View all {totalBriefs} briefs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'watchlist',
      label: 'My Watchlist',
      icon: <Bookmark className="w-3.5 h-3.5" />,
      content: watchlist.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-raised-light dark:bg-surface-raised flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-tx-tertiary" />
          </div>
          <div>
            <p className="text-sm font-medium text-tx-primary-light dark:text-tx-primary mb-1">Watchlist is empty</p>
            <p className="text-xs text-tx-secondary">Add companies you meet regularly from the sidebar</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map(item => (
            <div
              key={item.id}
              className="bg-surface-raised-light dark:bg-surface-raised border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl p-5 hover:border-accent/20 transition-all flex flex-col justify-between squircle group"
            >
              <div>
                <h3 className="font-display font-semibold text-base truncate mb-1.5 text-tx-primary-light dark:text-tx-primary">
                  {item.company_name}
                </h3>
                {item.folder_tag && (
                  <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium mb-2.5 inline-block">
                    {item.folder_tag}
                  </span>
                )}
                <p className="text-xs text-tx-tertiary">
                  {item.last_briefed_at
                    ? `Last briefed ${new Date(item.last_briefed_at).toLocaleDateString()}`
                    : 'Never briefed'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border dark:border-[rgba(255,255,255,0.04)]">
                <button
                  onClick={() => navigate(`/brief/new?company=${encodeURIComponent(item.company_name)}`)}
                  className="w-full bg-accent hover:bg-accent-light text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97]"
                >
                  Generate Brief
                </button>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'scheduled',
      label: 'Scheduled',
      icon: <Calendar className="w-3.5 h-3.5" />,
      content: scheduled.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-raised-light dark:bg-surface-raised flex items-center justify-center">
            <Calendar className="w-6 h-6 text-tx-tertiary" />
          </div>
          <div>
            <p className="text-sm font-medium text-tx-primary-light dark:text-tx-primary mb-1">No scheduled scans</p>
            <p className="text-xs text-tx-secondary">Schedule briefs to be auto-generated before your meetings</p>
          </div>
          <Link
            to="/brief/new"
            className="text-xs text-accent hover:underline"
          >
            Set up a scheduled brief →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scheduled.map(item => (
            <div
              key={item.id}
              className="bg-surface-raised-light dark:bg-surface-raised border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl p-5 hover:border-accent/20 transition-all flex flex-col justify-between squircle group"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display font-semibold text-base truncate pr-2 text-tx-primary-light dark:text-tx-primary">
                    {item.company_name}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                    item.status === 'failed'    ? 'bg-red-500/10 text-red-400' :
                    item.status === 'running'   ? 'bg-blue-500/10 text-blue-400' :
                    'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <span className="text-[10px] bg-surface-light dark:bg-surface border border-border px-2 py-0.5 rounded-full font-medium mb-2.5 inline-block uppercase tracking-wider text-tx-secondary">
                  {item.recurring || 'one-time'}
                </span>
                <p className="text-xs text-tx-secondary mt-1">
                  {new Date(item.scheduled_for).toLocaleDateString()} at{' '}
                  {new Date(item.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[10px] text-tx-tertiary mt-0.5">Length: {item.length}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-border dark:border-[rgba(255,255,255,0.04)] flex items-center justify-between">
                {item.brief_id ? (
                  <button
                    onClick={() => navigate(`/brief/${item.brief_id}`)}
                    className="text-xs text-accent hover:underline"
                  >
                    View brief →
                  </button>
                ) : (
                  <div />
                )}
                <button
                  onClick={(e) => cancelScheduled(e, item.id)}
                  className="p-1.5 rounded-lg text-tx-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                  title="Delete scheduled brief"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )
    }
  ]

  return (
    <Layout>
      <GuidedTour active={tourActive} onClose={() => setTourActive(false)} />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-1 text-tx-primary-light dark:text-tx-primary">
                {`${greeting()}${user?.display_name ? `, ${user.display_name}` : ''}`}
              </h1>
              <p className="text-tx-secondary-light dark:text-tx-secondary text-sm">
                {totalBriefs > 0
                  ? `${totalBriefs} brief${totalBriefs !== 1 ? 's' : ''} generated`
                  : 'Generate your first AI brief to get started'}
              </p>
            </div>
            {user?.tier === 'free' && (
              <StorageWidget
                remaining={user?.briefs_remaining_this_hour ?? 3}
                total={3}
                resetAt={user?.reset_at}
              />
            )}
          </div>
          <button
            onClick={() => navigate('/brief/new')}
            className="bg-accent hover:bg-accent-light text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-[0.97] glow-accent-sm flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Brief
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl p-5 h-44 shimmer squircle" />
          ))}
        </div>
      ) : (
        <ExpandableTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      )}
    </Layout>
  )
}
