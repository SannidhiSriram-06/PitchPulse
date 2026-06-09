import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Sparkles } from 'lucide-react'
import api from '../lib/api'
import { MetalButton } from '../components/MetalButton'
import { useToast } from '../components/Toast'
import { TIMEZONES } from '../utils/constants'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user: clerkUser } = useUser()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [companies, setCompanies] = useState([])
  const [companyInput, setCompanyInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [prefs, setPrefs] = useState({
    default_brief_length: 'medium',
    default_view: 'tabs',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  })

  // Flag is keyed to the Clerk user ID so different users on the same device each see onboarding
  const onboardedKey = clerkUser ? `pp_onboarded_${clerkUser.id}` : 'pp_onboarded'

  useEffect(() => {
    if (localStorage.getItem(onboardedKey)) {
      navigate('/dashboard')
    }
  }, [navigate, onboardedKey])

  const addCompany = () => {
    const trimmed = companyInput.trim()
    if (!trimmed || companies.length >= 10 || companies.includes(trimmed)) return
    setCompanies([...companies, trimmed])
    setCompanyInput('')
  }

  const removeCompany = (idx) => {
    setCompanies(companies.filter((_, i) => i !== idx))
  }

  const completeOnboarding = async () => {
    setSubmitting(true)
    try {
      // Add watchlist companies — skip duplicates (409) and limit errors (400), they're non-fatal
      for (const comp of companies) {
        try {
          await api.post('/api/watchlist', { company_name: comp })
        } catch (err) {
          if (err.response?.status === 429) {
            toast.warning(`Watchlist limit reached — some companies weren't added`)
            break
          }
          // 409 duplicate: silently skip
        }
      }

      // Save user preferences
      await api.patch('/api/user/me', {
        default_brief_length: prefs.default_brief_length,
        timezone: prefs.timezone
      })

      // Save view pref if endpoint exists — non-fatal if not
      try {
        await api.patch('/api/user/preferences', { default_view: prefs.default_view })
      } catch { /* endpoint optional */ }

      localStorage.setItem(onboardedKey, 'true')
      navigate('/dashboard')
    } catch (err) {
      toast.error('Something went wrong — please try again')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const slideVariants = {
    enter:  { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0  },
    exit:   { opacity: 0, x: -24 }
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-500 ${
                s < step  ? 'w-6 bg-accent/60' :
                s === step ? 'w-8 bg-accent' :
                             'w-2 bg-surface-raised'
              }`}
            />
          ))}
        </div>

        <div className="bg-surface-light dark:bg-surface border border-border-strong rounded-2xl p-7 relative overflow-hidden squircle">
          <AnimatePresence mode="wait">
            {/* ── Step 1: Watchlist ── */}
            {step === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
                <h2 className="text-2xl font-display font-bold mb-1.5">Pin your key accounts</h2>
                <p className="text-sm text-tx-secondary mb-6 leading-relaxed">
                  Add companies you meet with regularly. PitchPulse will surface them first on your dashboard.
                </p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={companyInput}
                    onChange={e => setCompanyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCompany()}
                    placeholder="e.g. Salesforce, HubSpot…"
                    className="flex-1 bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-xl px-4 py-2.5 text-sm focus:border-accent/50 focus:outline-none transition-colors"
                  />
                  <MetalButton onClick={addCompany} variant="default" size="default" className="px-5 py-2.5 rounded-xl">
                    Add
                  </MetalButton>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[80px] mb-2">
                  {companies.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">
                      {c}
                      <button onClick={() => removeCompany(i)} className="hover:text-red-400 transition-colors ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {companies.length > 0 && (
                  <p className="text-xs text-tx-tertiary mb-4">{companies.length}/10 companies added</p>
                )}
                <div className="flex justify-end mt-6">
                  <MetalButton onClick={() => setStep(2)} variant="outline" size="sm">
                    {companies.length > 0 ? 'Next →' : 'Skip for now →'}
                  </MetalButton>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Preferences ── */}
            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
                <h2 className="text-2xl font-display font-bold mb-1.5">Customise your experience</h2>
                <p className="text-sm text-tx-secondary mb-6">These can all be changed later in Settings.</p>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-tx-primary-light dark:text-tx-primary mb-2">Default brief length</label>
                    <div className="flex bg-surface-raised-light dark:bg-surface-raised p-1 rounded-xl">
                      {[
                        { id: 'short',  label: 'Quick Scan'  },
                        { id: 'medium', label: 'Standard'    },
                        { id: 'long',   label: 'Deep Dive'   },
                      ].map(l => (
                        <button
                          key={l.id}
                          onClick={() => setPrefs({ ...prefs, default_brief_length: l.id })}
                          className={`flex-1 py-2 rounded-lg capitalize text-sm font-medium transition-all ${
                            prefs.default_brief_length === l.id
                              ? 'bg-surface-light dark:bg-surface shadow-sm text-tx-primary-light dark:text-tx-primary'
                              : 'text-tx-tertiary hover:text-tx-secondary'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-tx-primary-light dark:text-tx-primary mb-2">Default view</label>
                    <div className="flex bg-surface-raised-light dark:bg-surface-raised p-1 rounded-xl">
                      {['tabs', 'cards'].map(v => (
                        <button
                          key={v}
                          onClick={() => setPrefs({ ...prefs, default_view: v })}
                          className={`flex-1 py-2 rounded-lg capitalize text-sm font-medium transition-all ${
                            prefs.default_view === v
                              ? 'bg-surface-light dark:bg-surface shadow-sm text-tx-primary-light dark:text-tx-primary'
                              : 'text-tx-tertiary hover:text-tx-secondary'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-tx-primary-light dark:text-tx-primary mb-2">Timezone</label>
                    <select
                      value={prefs.timezone}
                      onChange={e => setPrefs({ ...prefs, timezone: e.target.value })}
                      className="w-full bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-xl px-4 py-2.5 text-sm focus:border-accent/50 focus:outline-none transition-colors"
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <MetalButton onClick={() => setStep(1)} variant="outline" size="sm">← Back</MetalButton>
                  <MetalButton onClick={() => setStep(3)} variant="default" size="sm">Next →</MetalButton>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Ready ── */}
            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="text-2xl font-display font-bold">You're all set!</h2>
                </div>
                <p className="text-sm text-tx-secondary mb-6 leading-relaxed">
                  PitchPulse will generate AI-powered sales intelligence briefs in about 60 seconds.
                  Start by generating a brief for your next meeting.
                </p>
                <div className="bg-surface-raised-light dark:bg-surface-raised border border-border rounded-xl p-4 mb-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-tx-secondary">
                      Watchlist: <strong className="text-tx-primary-light dark:text-tx-primary">
                        {companies.length > 0 ? `${companies.length} companies pinned` : 'skipped'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-tx-secondary">
                      Default length: <strong className="text-tx-primary-light dark:text-tx-primary capitalize">{prefs.default_brief_length}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-tx-secondary">
                      Timezone: <strong className="text-tx-primary-light dark:text-tx-primary">{prefs.timezone}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <MetalButton
                    onClick={completeOnboarding}
                    disabled={submitting}
                    variant="default"
                    preset="chromatic"
                    className="w-full justify-center"
                  >
                    {submitting ? 'Setting up…' : 'Go to Dashboard →'}
                  </MetalButton>
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs text-tx-tertiary hover:text-tx-secondary text-center transition-colors"
                  >
                    ← Go back to preferences
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
