import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Search, Trash2, FileText, ChevronRight, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import Layout from '../components/Layout'
import HorizontalTextReveal from '../components/HorizontalTextReveal'
import { useToast } from '../components/Toast'

const LIMIT = 10

export default function HistoryPage() {
  const [briefs, setBriefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()
  const toast = useToast()

  // Fetch fresh list (offset = 0)
  const fetchBriefs = useCallback(async (q, saved) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset: 0 })
      if (q) params.set('search', q)
      if (saved) params.set('saved', 'true')
      const res = await api.get(`/api/briefs?${params}`)
      setBriefs(res.data.briefs || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load briefs')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search + filter changes
  useEffect(() => {
    const t = setTimeout(() => fetchBriefs(search, savedOnly), 300)
    return () => clearTimeout(t)
  }, [search, savedOnly, fetchBriefs])

  // Load more — compute new offset inline, don't rely on state
  const loadMore = async () => {
    const newOffset = briefs.length          // current length = next offset
    setLoadingMore(true)
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset: newOffset })
      if (search) params.set('search', search)
      if (savedOnly) params.set('saved', 'true')
      const res = await api.get(`/api/briefs?${params}`)
      setBriefs(prev => [...prev, ...(res.data.briefs || [])])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load more')
    } finally {
      setLoadingMore(false)
    }
  }

  const deleteBrief = async (e, id) => {
    e.stopPropagation()
    try {
      await api.delete(`/api/briefs/${id}`)
      setBriefs(prev => prev.filter(b => b.id !== id))
      setTotal(t => Math.max(0, t - 1))
      toast.success('Brief deleted')
    } catch {
      toast.error('Failed to delete brief')
    }
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">
          <HorizontalTextReveal inline>Brief History</HorizontalTextReveal>
        </h1>
        <p className="text-sm text-tx-secondary">{total} brief{total !== 1 ? 's' : ''} total</p>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-tx-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Search company name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-accent/50 focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={() => setSavedOnly(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            savedOnly
              ? 'bg-accent/10 border-accent text-accent'
              : 'border-border dark:border-[rgba(255,255,255,0.06)] text-tx-secondary hover:text-tx-primary'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${savedOnly ? 'fill-accent' : ''}`} />
          Saved only
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl shimmer" />
          ))}
        </div>
      ) : briefs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-raised-light dark:bg-surface-raised flex items-center justify-center">
            <FileText className="w-6 h-6 text-tx-tertiary" />
          </div>
          <div>
            <p className="text-sm font-medium text-tx-primary-light dark:text-tx-primary mb-1">
              {savedOnly ? 'No saved briefs' : search ? 'No results found' : 'No briefs yet'}
            </p>
            <p className="text-xs text-tx-secondary">
              {savedOnly ? 'Bookmark briefs you want to reference later' : search ? 'Try a different search term' : 'Generate your first brief to get started'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {briefs.map((brief, idx) => (
              <motion.div
                key={brief.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16, height: 0 }}
                transition={{ duration: 0.22, delay: idx < 10 ? idx * 0.025 : 0 }}
                onClick={() => navigate(`/brief/${brief.id}`)}
                className="group bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl px-5 py-4 cursor-pointer hover:border-accent/20 transition-all flex flex-col sm:flex-row gap-4 justify-between squircle"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-display font-semibold text-base text-tx-primary-light dark:text-tx-primary truncate group-hover:text-accent transition-colors">
                      {brief.company_name}
                    </h3>
                    {brief.saved && <Bookmark className="w-3.5 h-3.5 text-accent fill-accent shrink-0" />}
                  </div>
                  {brief.preview && (
                    <p className="text-sm text-tx-secondary line-clamp-2 leading-relaxed pr-4">{brief.preview}</p>
                  )}
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-tx-tertiary">
                    <Clock className="w-3 h-3" />
                    {new Date(brief.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider bg-surface-raised-light dark:bg-surface-raised border border-border px-2 py-0.5 rounded-full font-medium text-tx-secondary">
                      {brief.length_used}
                    </span>
                    <button
                      onClick={(e) => deleteBrief(e, brief.id)}
                      className="p-1.5 rounded-lg text-tx-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete brief"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-tx-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {briefs.length < total && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-3.5 text-sm font-medium text-tx-secondary hover:text-accent border border-dashed border-border dark:border-[rgba(255,255,255,0.06)] hover:border-accent/40 rounded-2xl transition-all mt-2 disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : `Load more (${total - briefs.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </Layout>
  )
}
