import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// NOTE: key names here are camelCase for local use.
// When syncing to the backend, map: defaultView → default_view, etc.
const usePrefsStore = create(
  persist(
    (set) => ({
      theme: 'system',
      defaultView: 'tabs',    // 'tabs' | 'cards'
      defaultLength: 'medium',
      showWatchlist: true,
      showSources: true,
      tourActive: false,

      setPrefs: (prefs) => set(prefs),

      /** Merge a single key without overwriting others */
      setPref: (key, value) => set({ [key]: value }),
      setTourActive: (active) => set({ tourActive: active }),
    }),
    { name: 'pitchpulse-prefs' }
  )
)

export default usePrefsStore
