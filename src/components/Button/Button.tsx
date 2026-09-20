import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import s from './Button.module.css'

type ButtonTone = 'primary' | 'lemon' | 'coral' | 'violet' | 'sage' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone
  size?: 'small' | 'large'
  icon?: ReactNode
}

export function Button({ tone, size, icon, className, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={cx(s.btn, tone && s[tone], size && s[size], className)} {...rest}>
      {icon}
      {children}
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  /** "plain" is a bare icon with no box around it (used for the back / next chevrons). */
  tone?: 'fill' | 'lemon' | 'plain'
  round?: boolean
}

export function IconButton({ label, tone, round, className, children, ...rest }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} className={cx(s.iconBtn, tone && s[tone], round && s.round, className)} {...rest}>
      {children}
    </button>
  )
}
