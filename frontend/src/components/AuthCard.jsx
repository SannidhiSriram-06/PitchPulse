import * as React from "react"
import { motion } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"

export function AuthCard({
  heading = "Access your workspace",
  subheading = "Connect with your team and deploy with confidence.",
  email = "",
  setEmail,
  password = "",
  setPassword,
  error = "",
  submitLabel = "Continue to workspace",
  bottomPromptText = "First time here?",
  bottomPromptLinkText = "Request an invite",
  onBottomPromptClick,
  onSubmit,
  onSocialLogin,
}) {
  const [showPassword, setShowPassword] = React.useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.(e)
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-xs px-4 py-3 rounded-xl"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <div className="w-full bg-[#f4f4f5] dark:bg-[#1c1c1e] rounded-[32px] p-2 border border-border dark:border-[rgba(255,255,255,0.06)] shadow-xl">
        <div className="bg-white dark:bg-[#0b0b0c] rounded-[26px] px-6 py-8 shadow-sm">
          <div className="space-y-3 pb-6 text-center">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl text-tx-primary-light dark:text-tx-primary">
                {heading}
              </h2>
              <p className="text-xs text-tx-secondary-light dark:text-tx-secondary leading-relaxed">
                {subheading}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="text-tx-tertiary absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                  <input
                    id="Auth-email"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#f4f4f5] dark:bg-[#1c1c1e] border border-transparent focus:border-accent/40 rounded-xl h-11 pl-10 pr-4 text-sm outline-none transition-colors text-tx-primary-light dark:text-tx-primary"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="text-tx-tertiary absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                  <input
                    id="Auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#f4f4f5] dark:bg-[#1c1c1e] border border-transparent focus:border-accent/40 rounded-xl h-11 pl-10 pr-10 text-sm outline-none transition-colors text-tx-primary-light dark:text-tx-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-tx-tertiary hover:text-tx-primary absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-accent hover:bg-accent-light text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-md shadow-accent/10"
              >
                {submitLabel}
              </button>
            </form>

            <div className="flex items-center gap-3 py-1">
              <div className="h-[1px] flex-1 bg-border dark:bg-[rgba(255,255,255,0.06)]" />
              <span className="text-tx-tertiary text-[11px] uppercase tracking-wider font-semibold">
                or use your credentials
              </span>
              <div className="h-[1px] flex-1 bg-border dark:bg-[rgba(255,255,255,0.06)]" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                className="flex items-center justify-center bg-[#f4f4f5] dark:bg-[#1c1c1e] hover:bg-border dark:hover:bg-[#2c2c2e] h-11 rounded-xl text-sm font-medium transition-colors border border-transparent text-tx-primary-light dark:text-tx-primary"
                onClick={() => onSocialLogin?.('oauth_google')}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs">Google</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center bg-[#f4f4f5] dark:bg-[#1c1c1e] hover:bg-border dark:hover:bg-[#2c2c2e] h-11 rounded-xl text-sm font-medium transition-colors border border-transparent text-tx-primary-light dark:text-tx-primary"
                onClick={() => onSocialLogin?.('oauth_github')}
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                </svg>
                <span className="text-xs">GitHub</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center py-4 text-center">
          <p className="text-tx-secondary text-xs">
            {bottomPromptText}{" "}
            <button
              type="button"
              onClick={onBottomPromptClick}
              className="text-accent font-semibold underline-offset-4 transition-all hover:underline"
            >
              {bottomPromptLinkText}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthCard
