import { useState } from 'react'
import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import s from './Task.module.css'

type TaskRowProps = {
  title: string
  meta?: string
  /** The checkbox's accessible name when it should say more than the title, e.g. "Taken care of: ...". */
  checkLabel?: string
  defaultDone?: boolean
  /** Controlled state. With `onToggle`, the caller owns whether the row is done. */
  done?: boolean
  onToggle?: (done: boolean) => void
  /** Strike the title through when done (tasks). Rituals turn this off: a check-in is not a finished item. */
  strikeWhenDone?: boolean
  /** Set when the row sits on a colour block, so completed titles keep strong ink contrast. */
  onColor?: boolean
  priority?: boolean
  /** Replaces the checkbox, e.g. a timeline icon. */
  leading?: ReactNode
}

export function TaskRow({ title, meta, checkLabel, defaultDone = false, done: controlled, onToggle, strikeWhenDone = true, onColor, priority, leading }: TaskRowProps) {
  const [inner, setInner] = useState(defaultDone)
  const done = controlled ?? inner
  const toggle = () => {
    if (controlled === undefined) setInner(!inner)
    onToggle?.(!done)
  }
  return (
    <div className={cx(s.task, done && strikeWhenDone && s.done, onColor && s.onColor)}>
      {leading ?? (
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={checkLabel ?? title}
          className={cx(s.taskCheck, done && s.checked)}
          onClick={toggle}
        >
          {done && <span aria-hidden="true">✓</span>}
        </button>
      )}
      <div className={s.taskCopy}>
        <div className={s.taskTitle}>
          {priority && <span className={s.taskPriority} aria-hidden="true" />}
          {title}
        </div>
        {meta && <div className={s.taskMeta}>{meta}</div>}
      </div>
    </div>
  )
}
