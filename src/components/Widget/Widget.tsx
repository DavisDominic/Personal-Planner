import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import s from './Widget.module.css'

type WidgetProps = {
  tone: 'lemon' | 'sky' | 'sage' | 'violet' | 'coral' | 'paper'
  kicker: string
  corner: string
  number: string
  /** Smaller figure for text values such as a date. */
  small?: boolean
  children: ReactNode
}

export function Widget({ tone, kicker, corner, number, small, children }: WidgetProps) {
  return (
    <div className={cx(s.widget, s[tone])}>
      <div className={s.widgetKicker}>{kicker}</div>
      <div className={s.widgetCorner}>{corner}</div>
      <div className={cx(s.widgetNumber, small && s.small)}>{number}</div>
      <div className={s.widgetCopy}>{children}</div>
    </div>
  )
}

export function WidgetGrid({ children }: { children: ReactNode }) {
  return <div className={s.widgetGrid}>{children}</div>
}
