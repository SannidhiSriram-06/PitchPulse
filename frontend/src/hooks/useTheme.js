import { useEffect } from 'react'
import usePrefsStore from '../store/prefsStore'

export function useTheme() {
  const { theme } = usePrefsStore()
  
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // system
      const mq = window.matchMedia(
        '(prefers-color-scheme: dark)')
      root.classList.toggle('dark', mq.matches)
      const handler = (e) => 
        root.classList.toggle('dark', e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])
}
