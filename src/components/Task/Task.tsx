import { useState } from 'react'
import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import s from './Task.module.css'

type TaskRowProps = {
  title: string
  meta?: string
  defaultDone?: boolean
  /** Set when the row sits on a colour block, so completed titles keep strong ink contrast. */
  onColor?: boolean
  priority?: boolean
  /** Replaces the checkbox, e.g. a timeline icon. */
  leading?: ReactNode
}

export function TaskRow({ title, meta, defaultDone = false, onColor, priority, leading }: TaskRowProps) {
  const [done, setDone] = useState(defaultDone)
  return (
    <div className={cx(s.task, done && s.done, onColor && s.onColor)}>
      {leading ?? (
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={title}
          className={cx(s.taskCheck, done && s.checked)}
          onClick={() => setDone((d) => !d)}
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
