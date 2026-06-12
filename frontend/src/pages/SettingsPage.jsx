import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { User, Sliders, CreditCard } from 'lucide-react'
import api from '../lib/api'
import Layout from '../components/Layout'
import useAuthStore from '../store/authStore'
import usePrefsStore from '../store/prefsStore'
import ExpandableTabs from '../components/ExpandableTabs'
import { MetalButton } from '../components/MetalButton'
import { useToast } from '../components/Toast'
import { TIMEZONES } from '../utils/constants'

export default function SettingsPage() {
  const { signOut } = useAuth()
  const { user, updateUser } = useAuthStore()
  const { theme, setPrefs } = usePrefsStore()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('account')
  const [formData, setFormData] = useState({
    display_name: '',
    timezone: '',
    default_brief_length: 'medium',
    user_context: ''
  })
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && ['account', 'preferences', 'billing'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [])

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        timezone: user.timezone || 'Asia/Kolkata',
        default_brief_length: user.default_brief_length || 'medium',
        user_context: user.user_context || ''
      })
    }
  }, [user])

  const saveSettings = async () => {
    setSaving(true)
    try {
      await api.patch('/api/user/me', formData)
      updateUser(formData)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/api/user/me')
      signOut()
    } catch (e) {
      console.error(e)
    }
  }

  if (!user) return <Layout>Loading...</Layout>

  const tabs = [
    {
      id: 'account',
      label: 'Account',
      icon: <User className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-6">
          <section className="bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-xl p-6 squircle">
            <h2 className="text-lg font-display font-semibold mb-4 border-b border-border dark:border-[rgba(255,255,255,0.06)] pb-2">Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-tx-secondary-light dark:text-tx-secondary mb-1">Email</label>
                <input type="text" value={user.email} disabled className="w-full bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-lg px-4 py-2 opacity-60 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-tx-secondary-light dark:text-tx-secondary mb-1">Display Name</label>
                <input type="text" value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="w-full bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-lg px-4 py-2 text-sm focus:border-accent outline-none" />
              </div>
              <div>
                <label className="block text-sm text-tx-secondary-light dark:text-tx-secondary mb-1">Timezone</label>
                <select value={formData.timezone} onChange={e => setFormData({...formData, timezone: e.target.value})} className="w-full bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-lg px-4 py-2 text-sm focus:border-accent outline-none">
                  {TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <MetalButton onClick={saveSettings} disabled={saving} variant="default" preset="chromatic" className="mt-6">
              {saving ? 'Saving...' : 'Save Changes'}
            </MetalButton>
          </section>

          <section className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 squircle">
            <h2 className="text-lg font-display font-semibold mb-2 text-red-600 dark:text-red-500">Danger Zone</h2>
            <p className="text-sm text-tx-secondary-light dark:text-tx-secondary mb-4">Permanently delete your account and all generated briefs.</p>
            {showConfirm ? (
              <div className="flex gap-2">
                <MetalButton onClick={handleDeleteAccount} variant="destructive">Yes, Delete Everything</MetalButton>
                <MetalButton onClick={() => setShowConfirm(false)} variant="outline">Cancel</MetalButton>
              </div>
            ) : (
              <MetalButton onClick={() => setShowConfirm(true)} variant="destructive">Delete Account</MetalButton>
            )}
          </section>
        </div>
      )
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <Sliders className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-6">
          <section className="bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-xl p-6 squircle">
            <h2 className="text-lg font-display font-semibold mb-4 border-b border-border dark:border-[rgba(255,255,255,0.06)] pb-2">Brief Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-tx-secondary-light dark:text-tx-secondary mb-2">Default Length</label>
                <div className="flex bg-surface-raised-light dark:bg-surface-raised p-1 rounded-lg w-fit">
                  {['short', 'medium', 'long'].map(l => (
                     <button key={l} onClick={() => setFormData({...formData, default_brief_length: l})} className={`px-6 py-1.5 rounded capitalize text-sm font-medium ${formData.default_brief_length === l ? 'bg-surface-light dark:bg-surface shadow-sm text-tx-primary-light dark:text-tx-primary' : 'text-tx-tertiary'}`}>
                       {l}
                     </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-tx-secondary-light dark:text-tx-secondary mb-1">My Context (Used by AI to tailor briefs)</label>
                <textarea 
                  value={formData.user_context}
                  onChange={e => setFormData({...formData, user_context: e.target.value})}
                  placeholder="What do you sell? e.g. 'DevOps tooling for enterprise'"
                  className="w-full bg-surface-raised-light dark:bg-surface-raised border border-border-strong rounded-lg px-4 py-2 text-sm focus:border-accent outline-none min-h-[80px]"
                />
              </div>
            </div>
            <MetalButton onClick={saveSettings} disabled={saving} variant="default" preset="chromatic" className="mt-6">
              {saving ? 'Saving...' : 'Save Changes'}
            </MetalButton>
          </section>

          <section className="bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-xl p-6 squircle">
            <h2 className="text-lg font-display font-semibold mb-4 border-b border-border dark:border-[rgba(255,255,255,0.06)] pb-2">Appearance</h2>
            <div>
              <label className="block text-sm text-tx-secondary-light dark:text-tx-secondary mb-2">Theme</label>
              <div className="flex bg-surface-raised-light dark:bg-surface-raised p-1 rounded-lg w-fit">
                {['system', 'light', 'dark'].map(t => (
                   <button key={t} onClick={() => setPrefs({ theme: t })} className={`px-6 py-1.5 rounded capitalize text-sm font-medium ${theme === t ? 'bg-surface-light dark:bg-surface shadow-sm text-tx-primary-light dark:text-tx-primary' : 'text-tx-tertiary'}`}>
                     {t}
                   </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      )
    },
    {
      id: 'billing',
      label: 'Plan & Billing',
      icon: <CreditCard className="w-3.5 h-3.5" />,
      content: (
        <section className="bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] rounded-xl p-6 squircle">
          <h2 className="text-lg font-display font-semibold mb-4 border-b border-border dark:border-[rgba(255,255,255,0.06)] pb-2">Subscription</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-surface-raised-light dark:bg-surface-raised border border-border-strong p-4 rounded-lg">
            <div>
              <h3 className="font-medium">Free Plan</h3>
              <p className="text-sm text-tx-secondary-light dark:text-tx-secondary">3 briefs per hour limit</p>
            </div>
            <button disabled className="bg-surface-raised-light dark:bg-surface-raised border border-border-strong px-4 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed flex items-center gap-2">
              Upgrade to Pro <span className="text-[10px] bg-border px-1.5 rounded uppercase tracking-wider">Soon</span>
            </button>
          </div>
        </section>
      )
    }
  ]

  return (
    <Layout>
      <h1 className="text-2xl font-display font-semibold mb-8">Settings</h1>
      <div className="max-w-3xl">
        <ExpandableTabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
      </div>
    </Layout>
  )
}
