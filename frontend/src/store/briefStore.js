import { create } from 'zustand'

const useBriefStore = create((set) => ({
  currentBrief: null,
  history: [],
  generating: false,
  statusMessage: '',
  statusStep: 0,
  setCurrentBrief: (brief) => set({ currentBrief: brief }),
  setHistory: (history) => set({ history }),
  setGenerating: (generating) => set({ generating }),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  setStatusStep: (step) => set({ statusStep: step }),
  reset: () => set({ 
    generating: false, 
    statusMessage: '', 
    statusStep: 0 
  })
}))

export default useBriefStore
