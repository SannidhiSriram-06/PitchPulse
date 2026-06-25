import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Zap, X, Plus, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { useToast } from './Toast'

export default function WatchlistSidebar() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const fetchWatchlist = async () => {
    try {
      const res = await api.get('/api/watchlist')
      setItems(res.data.watchlist || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const addCompany = async (e) => {
    e.preventDefault()
    if (!input.trim() || adding) return
    setAdding(true)
    try {
      await api.post('/api/watchlist', { company_name: input.trim() })
      setInput('')
      fetchWatchlist()
      toast.success(`${input.trim()} added to watchlist`)
    } catch (e) {
      const msg = e.response?.data?.error || 'Failed to add company'
      if (e.response?.status === 409) {
        toast.warning('Already in your watchlist')
      } else if (e.response?.status === 400 && msg.includes('limit')) {
        toast.error('Watchlist limit (50) reached')
      } else {
        toast.error(msg)
      }
    } finally {
      setAdding(false)
    }
  }

  const removeCompany = async (id, name) => {
    const originalItems = items
    setItems(items.filter(i => i.id !== id))
    toast.success(`${name} removed`)
    try {
      await api.delete(`/api/watchlist/${id}`)
    } catch (e) {
      setItems(originalItems)
      toast.error('Failed to remove company')
    }
  }

  const generateBrief = (company_name) => {
    navigate(`/brief/new?company=${encodeURIComponent(company_name)}`)
  }

  // Determine active company from the current page context
  const getActiveCompany = () => {
    // Generator page: ?company=X query param
    const queryCompany = new URLSearchParams(location.search).get('company')
    if (queryCompany) return queryCompany
    return null
  }
  const activeCompany = getActiveCompany()

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 text-[10px] uppercase tracking-widest text-tx-tertiary font-bold select-none">
        Watchlist
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-surface-raised-light dark:bg-surface-raised rounded-lg shimmer" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-tx-tertiary leading-relaxed">
              No companies yet.<br />Add one below to get started.
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5 px-2 pb-2">
            {items.map(item => {
              const isActive = activeCompany === item.company_name
              return (
                <li key={item.id} className="group">
                  <div
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                      isActive
                        ? 'bg-accent/10 border-accent/20'
                        : 'hover:bg-surface-raised-light dark:hover:bg-surface-raised border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => generateBrief(item.company_name)}
                      className="flex-1 text-left min-w-0 pr-1 focus:outline-none"
                    >
                      <div className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-accent' : 'text-tx-primary-light dark:text-tx-primary'}`}>
                        {item.company_name}
                      </div>
                      <div className="text-[10px] text-tx-tertiary font-mono truncate mt-0.5">
                        {item.last_briefed_at
                          ? `briefed ${new Date(item.last_briefed_at).toLocaleDateString()}`
                          : 'never briefed'}
                      </div>
                    </button>
                    <div className="flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        title="Generate brief"
                        onClick={(e) => { e.stopPropagation(); generateBrief(item.company_name) }}
                        className="p-1.5 rounded-lg hover:text-accent hover:bg-accent/10 text-tx-tertiary transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Remove"
                        onClick={(e) => { e.stopPropagation(); removeCompany(item.id, item.company_name) }}
                        className="p-1.5 rounded-lg hover:text-red-500 hover:bg-red-500/10 text-tx-tertiary transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Add company form */}
      <div className="p-3 border-t border-border dark:border-[rgba(255,255,255,0.04)]">
        <form onSubmit={addCompany} className="flex gap-1.5">
          <input
            type="text"
            placeholder="Add company..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={adding}
            className="w-full bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-xl px-3 py-1.5 text-sm placeholder:text-tx-tertiary focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={adding || !input.trim()}
            className="bg-accent hover:bg-accent-light disabled:opacity-40 text-white p-1.5 rounded-xl transition-all active:scale-95 shrink-0"
          >
            {adding
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Plus className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
