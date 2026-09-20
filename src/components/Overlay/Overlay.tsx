import type { ReactNode } from 'react'
import s from './Overlay.module.css'

/** The surface of a dialog. The native <dialog> that hosts it provides the role, focus handling and dismissal. */
export function Dialog({ children }: { children: ReactNode }) {
  return (
    <div className={s.dialog}>
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
