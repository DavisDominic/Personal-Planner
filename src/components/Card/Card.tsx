import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '../Button/Button'
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

export type CardStepper = { onPrevious: () => void; onNext: () => void; previousLabel: string; nextLabel: string }

/** A card's heading. With `stepper`, back and next chevrons sit before and after the title. */
export function CardHead({ kicker, title, icon, stepper }: { kicker: string; title: string; icon?: ReactNode; stepper?: CardStepper }) {
  return (
    <div className={s.cardHead}>
      <div>
        <div className={s.cardKicker}>{kicker}</div>
        <div className={s.cardTitleRow}>
          {stepper && (
            <IconButton tone="plain" className={s.firstChevron} label={stepper.previousLabel} onClick={stepper.onPrevious}>
              <ChevronLeft aria-hidden="true" />
            </IconButton>
          )}
          <div className={s.cardTitle}>
            {icon && <span className={s.titleIcon}>{icon}</span>}
            {title}
          </div>
          {stepper && (
            <IconButton tone="plain" label={stepper.nextLabel} onClick={stepper.onNext}>
              <ChevronRight aria-hidden="true" />
            </IconButton>
          )}
        </div>
      </div>
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
