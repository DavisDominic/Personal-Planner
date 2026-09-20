import { useContext } from 'react'
import { ToastContext } from './toastContext'

/** Shows a short, factual message, optionally with an Undo-style action. */
export function useToast() {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside the app shell.')
  return api
}
