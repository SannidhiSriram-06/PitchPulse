import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-[80px] font-display font-bold text-accent/10 leading-none mb-4 select-none">
          404
        </div>
        <h1 className="text-2xl font-display font-semibold mb-3 text-tx-primary-light dark:text-tx-primary">
          Page not found
        </h1>
        <p className="text-tx-secondary-light dark:text-tx-secondary text-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-strong text-sm font-medium text-tx-secondary hover:text-tx-primary transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-white text-sm font-semibold transition-all"
          >
            <Home className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
