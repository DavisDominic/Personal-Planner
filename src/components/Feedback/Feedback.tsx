import type { ReactNode } from 'react'
import s from './Feedback.module.css'

export function Toast({ children, actionLabel, onAction }: { children: ReactNode; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className={s.toast} role="status">
      {children}
      {actionLabel && (
        <button type="button" className={s.undo} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function InlineMessage({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  return (
    <div className={kind === 'error' ? s.inlineError : s.inlineSuccess} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
