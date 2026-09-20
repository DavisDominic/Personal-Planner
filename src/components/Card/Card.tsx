import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import s from './Card.module.css'

export type CardTone = 'lemon' | 'coral' | 'sage' | 'violet' | 'sky' | 'mint' | 'blush' | 'peach' | 'periwinkle'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  tone?: CardTone
  /** note = paper shadow, flat = ink border, color = coloured block with no border */
  kind?: 'note' | 'flat' | 'color'
}

export function Card({ as: Tag = 'div', tone, kind, className, ...rest }: CardProps) {
  return <Tag className={cx(s.card, kind && s[kind], tone && s[tone], className)} {...rest} />
}

export function CardHead({ kicker, title, icon, actions }: { kicker: string; title: string; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={s.cardHead}>
      <div>
        <div className={s.cardKicker}>{kicker}</div>
        <div className={s.cardTitle}>
          {icon && <span className={s.titleIcon}>{icon}</span>}
          {title}
        </div>
      </div>
      {actions}
    </div>
  )
}

export function CardKicker({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(s.cardKicker, className)} {...rest} />
}

export function CardMeta({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(s.cardMeta, className)} {...rest} />
}

export function CardRule() {
  return <div className={s.cardRule} role="separator" />
}
