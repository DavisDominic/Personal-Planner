import { createContext } from 'react'

export type ToastOptions = {
  message: string
  /** e.g. "Undo". Shown as a button that runs `onAction` and dismisses the toast. */
  actionLabel?: string
  onAction?: () => void
}

export type ToastApi = {
  show: (toast: ToastOptions) => void
  dismiss: () => void
}

export const ToastContext = createContext<ToastApi | null>(null)
