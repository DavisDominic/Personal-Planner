import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import s from './Paper.module.css'

/** Ruled lines, like a blank notepad. Decorative. */
export function NoteLines() {
  return <div className={s.noteLines} aria-hidden="true" />
}

export function OpenLoopList({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(s.openLoopLines, className)} {...rest} />
}

export function OpenLoopLine({ children }: { children?: ReactNode }) {
  return <div className={s.openLoopLine}>{children}</div>
}

export function ReflectionSheet({ prompt, children }: { prompt: string; children?: ReactNode }) {
  return (
    <div className={s.reflectionSheet}>
      <div className={s.prompt}>{prompt}</div>
      <div className={s.writing} aria-hidden="true" />
      {children}
    </div>
  )
}
