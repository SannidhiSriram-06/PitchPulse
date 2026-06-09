import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/[0.04] blur-[100px] rounded-full pointer-events-none" />
      
      {/* Left branding panel (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center relative z-10 p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold text-lg">P</span>
            </div>
            <span className="font-display font-bold text-2xl text-tx-primary-light dark:text-tx-primary">PitchPulse</span>
          </Link>
          <h2 className="text-4xl font-display font-bold mb-4 text-gradient leading-tight">
            Welcome back.
          </h2>
          <p className="text-lg text-tx-secondary-light dark:text-tx-secondary leading-relaxed">
            Sign in to access your briefs, watchlist, and scheduled deliveries. Your next meeting prep is one click away.
          </p>
          <div className="mt-12 space-y-4">
            {[
              '60-second AI company briefs',
              'Scheduled delivery before meetings',
              'Shareable read-only links'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-accent text-xs">✓</span>
                </div>
                <span className="text-sm text-tx-secondary">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Sign-in form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">P</span>
            </div>
            <span className="font-display font-bold text-lg text-tx-primary-light dark:text-tx-primary">PitchPulse</span>
          </div>

          <div className="w-full max-w-sm bg-[#f4f4f5] dark:bg-[#1c1c1e] rounded-[32px] p-2 border border-border dark:border-[rgba(255,255,255,0.06)] shadow-xl">
            <SignIn 
              routing="path" 
              path="/sign-in"
              fallbackRedirectUrl="/dashboard"
              appearance={{
                variables: {
                  colorPrimary: '#FF6B2C',
                  fontFamily: 'Inter, system-ui, sans-serif',
                },
                elements: {
                  card: 'border-0 shadow-none bg-white dark:bg-[#0b0b0c] rounded-[26px] px-2 py-4',
                  headerTitle: 'font-display text-xl sm:text-2xl font-extrabold text-tx-primary-light dark:text-tx-primary',
                  headerSubtitle: 'text-xs text-tx-secondary-light dark:text-tx-secondary leading-relaxed',
                  formButtonPrimary: 'bg-accent hover:bg-accent-light text-white font-semibold rounded-xl py-3 transition-all active:scale-[0.98] shadow-md shadow-accent/10',
                  formFieldInput: 'bg-[#f4f4f5] dark:bg-[#1c1c1e] border-0 rounded-xl focus:ring-1 focus:ring-accent/40 text-tx-primary-light dark:text-tx-primary',
                  footerActionLink: 'text-accent hover:text-accent-light font-semibold',
                  socialButtonsBlockButton: 'border border-[#e4e4e7] dark:border-[rgba(255,255,255,0.06)] hover:bg-[#f4f4f5] dark:hover:bg-[#1c1c1e] rounded-xl text-tx-primary-light dark:text-tx-primary',
                  dividerLine: 'bg-border dark:bg-[rgba(255,255,255,0.06)]',
                  dividerText: 'text-tx-tertiary uppercase text-[10px] tracking-wider font-semibold',
                  footer: 'bg-transparent',
                  footerActionText: 'text-tx-secondary text-xs',
                  identityPreviewText: 'text-tx-primary-light dark:text-tx-primary',
                  identityPreviewEditButton: 'text-accent hover:text-accent-light',
                }
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
