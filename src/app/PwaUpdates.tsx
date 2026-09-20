import { useEffect } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { useToast } from './useToast'

/**
 * Registers the offline service worker (PRD 22). Says so once when the app is ready to work offline, and when a
 * newer version is waiting it offers the update rather than reloading the page under the user.
 */
export function PwaUpdates() {
  const toast = useToast()
  useEffect(() => {
    if (!import.meta.env.PROD) return
    const update = registerSW({
      onOfflineReady: () => toast.show({ message: 'Daybook is ready to work offline.' }),
      onNeedRefresh: () => toast.show({ message: 'A new version is ready.', actionLabel: 'Update', onAction: () => void update(true) }),
    })
  }, [toast])
  return null
}
