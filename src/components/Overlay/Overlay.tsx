import type { ReactNode } from 'react'
import s from './Overlay.module.css'

/** Static presentation of a dialog surface. Focus handling and dismissal come with the real capture flow. */
export function Dialog({ children }: { children: ReactNode }) {
  return (
    <div className={s.dialog} role="dialog" aria-modal="false">
      {children}
    </div>
  )
}

export function Sheet({ children }: { children: ReactNode }) {
  return (
    <div className={s.sheet}>
      <div className={s.handle} aria-hidden="true" />
      {children}
    </div>
  )
}
