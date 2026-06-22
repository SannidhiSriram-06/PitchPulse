import { SignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-bg font-sans text-neutral-950 dark:text-tx-primary antialiased selection:bg-neutral-900 selection:text-white relative flex flex-col lg:flex-row overflow-x-hidden">
      
      {/* Left Form Section */}
      <div className="flex w-full flex-col lg:w-1/2 min-h-screen justify-between relative">
        {/* Header Branding */}
        <div className="p-6 md:p-10 absolute md:top-4 md:left-4 top-2 left-2 z-20">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-display font-bold text-sm">P</span>
            </div>
            <span className="text-lg md:text-xl font-display font-bold tracking-tight text-tx-primary-light dark:text-tx-primary">PITCHPULSE</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex flex-1 items-center justify-center p-6 md:p-8 mt-12 md:mt-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="w-full max-w-[400px]"
          >
            <SignUp 
              routing="path" 
              path="/sign-up"
              fallbackRedirectUrl="/onboarding"
              appearance={{
                variables: {
                  colorPrimary: '#FF6B2C',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  spacingUnit: '0.8rem',
                },
                elements: {
                  cardBox: 'border-0 shadow-none bg-transparent w-full',
                  card: 'bg-white dark:bg-[#111112] border border-neutral-200 dark:border-[rgba(255,255,255,0.08)] rounded-[1.5rem] shadow-2xl p-6 sm:p-8 w-full transition-all duration-300 hover:shadow-accent/5 dark:hover:shadow-accent/5 hover:border-neutral-300 dark:hover:border-[rgba(255,255,255,0.12)]',
                  headerTitle: 'font-display text-xl sm:text-2xl font-bold tracking-tight text-tx-primary-light dark:text-tx-primary text-center mb-0.5',
                  headerSubtitle: 'text-xs sm:text-sm text-tx-secondary-light dark:text-tx-secondary text-center leading-relaxed mb-4',
                  formButtonPrimary: 'w-full rounded-xl bg-accent hover:bg-accent-light text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] mt-1.5',
                  formFieldInput: 'w-full rounded-xl border border-neutral-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#141414] px-4 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-accent dark:focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all duration-200',
                  formFieldLabel: 'text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-0.5',
                  footerActionLink: 'font-semibold text-accent hover:text-accent-light hover:underline',
                  socialButtonsBlockButton: 'flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#141414] px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-all hover:bg-neutral-50 dark:hover:bg-[#1c1c1d] active:scale-[0.98]',
                  dividerLine: 'bg-neutral-200 dark:bg-[rgba(255,255,255,0.06)]',
                  dividerText: 'px-4 text-xs text-neutral-400 font-medium',
                  footer: 'bg-transparent',
                  footerActionText: 'text-neutral-500 text-xs mt-3',
                  identityPreviewText: 'text-tx-primary-light dark:text-tx-primary',
                  identityPreviewEditButton: 'text-accent hover:text-accent-light',
                  formFieldInputShowPasswordButton: 'text-tx-secondary hover:text-tx-primary',
                  formResendCodeLink: 'text-accent hover:text-accent-light',
                }
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Right Image Section */}
      <div className="hidden lg:block lg:w-1/2 p-4 h-screen sticky top-0">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] shadow-xl">
          <img
            src="https://assets.watermelon.sh/auth-7.avif"
            alt="Cloudscape background"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  )
}
