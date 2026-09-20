import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Toast } from '../components/Feedback/Feedback'
import { ToastContext } from './toastContext'
import type { ToastOptions } from './toastContext'
import s from './ToastProvider.module.css'

/** Long enough to read and to reach an Undo; short enough not to linger. */
const TOAST_MS = 6000

type ActiveToast = ToastOptions & { id: number }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null)

  const show = useCallback((options: ToastOptions) => setToast({ ...options, id: Date.now() }), [])
  const dismiss = useCallback(() => setToast(null), [])
  const api = useMemo(() => ({ show, dismiss }), [show, dismiss])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={s.region} aria-live="polite">
        {toast && (
          <div key={toast.id} className={s.toast}>
            <Toast
              actionLabel={toast.actionLabel}
              onAction={() => {
                toast.onAction?.()
                dismiss()
              }}
            >
              {toast.message}
            </Toast>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
