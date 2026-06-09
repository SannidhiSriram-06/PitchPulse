import { create } from 'zustand'
import api from '../lib/api'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),

  clearUser: () => set({ user: null, loading: false }),

  updateUser: (updates) =>
    set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),

  /**
   * Called after a successful brief generation.
   * Updates the remaining count and reset timestamp so the
   * UsagePill reflects reality without a full re-fetch.
   */
  consumeBriefCredit: ({ briefs_remaining_this_hour, reset_at }) =>
    set((s) => ({
      user: s.user
        ? { ...s.user, briefs_remaining_this_hour, reset_at }
        : null
    })),

  /**
   * Lightweight poll of /api/usage — syncs remaining count from server.
   * Called on a 30-second interval from UsagePill when user is free tier.
   */
  refreshUsage: async () => {
    const { user } = get()
    if (!user || user.tier !== 'free') return
    try {
      const res = await api.get('/api/usage')
      const { remaining, reset_at } = res.data
      set((s) => ({
        user: s.user
          ? { ...s.user, briefs_remaining_this_hour: remaining, reset_at }
          : null
      }))
    } catch (_) {
      // silently ignore — stale UI is acceptable
    }
  },
}))

export default useAuthStore
