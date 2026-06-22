import { useState, useRef, useEffect } from 'react'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

export default function StockChart({ companyName }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const svgRef = useRef(null)

  const fetchStockData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get the authorization token from localStorage or cookie if using clerk
      // In this codebase, the `api` module handles Authorization header. We will do a direct fetch or handle it.
      // Since `api` is imported from '../lib/api', we can use it to fetch easily!
      // Let's import api from '../lib/api' at the top.
      const api = (await import('../lib/api')).default
      const res = await api.get(`/api/stock?company=${encodeURIComponent(companyName)}`)
      setData(res.data)
    } catch (e) {
      console.error(e)
      const errorMsg = e.response?.data?.error || 'No stock market data available for this company.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (companyName) {
      fetchStockData()
    }
  }, [companyName])

  if (loading) {
    return (
      <div className="bg-surface-raised-light dark:bg-surface-raised rounded-2xl p-6 border border-border dark:border-[rgba(255,255,255,0.06)] animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-border dark:bg-surface rounded" />
            <div className="h-6 w-36 bg-border dark:bg-surface rounded" />
          </div>
          <div className="h-10 w-24 bg-border dark:bg-surface rounded-full" />
        </div>
        <div className="h-48 bg-border/20 dark:bg-surface/20 rounded-xl" />
      </div>
    )
  }

  if (error || !data || data.history.length === 0) {
    return (
      <div className="bg-surface-raised-light dark:bg-surface-raised rounded-2xl p-6 border border-border dark:border-[rgba(255,255,255,0.06)] text-center space-y-3">
        <p className="text-sm text-tx-tertiary">{error || 'Stock details unavailable'}</p>
        <button 
          onClick={fetchStockData}
          className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      </div>
    )
  }

  const { info, history } = data
  const prices = history.map(h => h.close)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  // SVG parameters
  const width = 600
  const height = 180
  const padding = 20

  const getCoordinates = () => {
    return history.map((point, index) => {
      const x = padding + (index / (history.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((point.close - minPrice) / priceRange) * (height - 2 * padding)
      return { x, y }
    })
  }

  const coords = getCoordinates()

  // Generate SVG path strings
  let linePath = ''
  let areaPath = ''

  if (coords.length > 0) {
    linePath = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(' ')
    areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`
  }

  const handleMouseMove = (e) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    
    // Find closest data point by X coordinate
    let closestIndex = 0
    let minDistance = Infinity
    
    coords.forEach((coord, idx) => {
      const dist = Math.abs(coord.x - (x * (width / rect.width)))
      if (dist < minDistance) {
        minDistance = dist
        closestIndex = idx
      }
    })

    setHoveredIndex(closestIndex)
    setTooltipPos({
      x: coords[closestIndex].x * (rect.width / width),
      y: coords[closestIndex].y * (rect.height / height) - 45
    })
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  const isPositive = info.change_percent >= 0
  const activePoint = hoveredIndex !== null ? history[hoveredIndex] : null

  return (
    <div className="bg-surface-raised-light dark:bg-surface-raised border border-border dark:border-[rgba(255,255,255,0.06)] rounded-2xl p-6 relative overflow-hidden squircle mt-6">
      {/* Header Info */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-xs font-semibold text-accent uppercase tracking-wider">{info.symbol}</span>
            <span className="text-xs text-tx-tertiary truncate max-w-[180px] md:max-w-[280px]">{info.company_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl font-display font-bold text-tx-primary-light dark:text-tx-primary">
              {activePoint ? activePoint.close : info.current_price}
              <span className="text-xs font-normal text-tx-tertiary ml-1">{info.currency}</span>
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
              isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}{info.change_percent}%
            </span>
          </div>
          <div className="text-[10px] text-tx-tertiary font-mono mt-1">
            {activePoint ? `As of ${activePoint.date}` : 'Last 30 Days trend'}
          </div>
        </div>
        
        <button 
          onClick={fetchStockData} 
          className="p-2 text-tx-tertiary hover:text-tx-primary hover:bg-surface-light dark:hover:bg-surface rounded-xl transition border border-transparent hover:border-border dark:hover:border-[rgba(255,255,255,0.04)]"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Chart */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent, #3b82f6)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-accent, #3b82f6)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" className="text-border/30 dark:text-surface/30" strokeDasharray="3,3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="currentColor" className="text-border/30 dark:text-surface/30" strokeDasharray="3,3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-border/30 dark:text-surface/30" />

          {/* Area under the line */}
          {areaPath && (
            <path d={areaPath} fill="url(#chartGradient)" />
          )}

          {/* Sparkline path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-accent, #3b82f6)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interaction indicators */}
          {hoveredIndex !== null && coords[hoveredIndex] && (
            <>
              <line
                x1={coords[hoveredIndex].x}
                y1={padding}
                x2={coords[hoveredIndex].x}
                y2={height - padding}
                stroke="var(--color-accent, #3b82f6)"
                strokeOpacity="0.4"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />
              <circle
                cx={coords[hoveredIndex].x}
                cy={coords[hoveredIndex].y}
                r="6"
                fill="var(--color-accent, #3b82f6)"
                stroke="white"
                strokeWidth="2"
                className="shadow-md"
              />
            </>
          )}
        </svg>

        {/* HTML Tooltip overlay */}
        {hoveredIndex !== null && activePoint && (
          <div
            style={{
              position: 'absolute',
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: 'translateX(-50%)',
            }}
            className="bg-black/90 dark:bg-white text-white dark:text-black text-[11px] font-mono py-1.5 px-3 rounded-lg shadow-xl border border-white/10 dark:border-black/10 pointer-events-none transition-all duration-75 z-10 whitespace-nowrap"
          >
            <div className="font-bold">{activePoint.close} {info.currency}</div>
            <div className="text-[9px] opacity-75">{activePoint.date}</div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] text-tx-tertiary font-mono mt-3 px-1 border-t border-border/20 dark:border-surface/20 pt-2">
        <span>{history[0]?.date}</span>
        <span>30 Days Range</span>
        <span>{history[history.length - 1]?.date}</span>
      </div>
    </div>
  )
}
