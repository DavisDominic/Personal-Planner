import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import s from './Empty.module.css'

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className={s.empty}>
      <div>
        {icon}
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  )
}

export function Skeleton({ width }: { width: 'long' | 'medium' | 'short' }) {
  return <div className={cx(s.skeleton, s[width])} aria-hidden="true" />
}
