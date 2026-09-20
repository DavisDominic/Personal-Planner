import { useState } from 'react'
import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import s from './Task.module.css'

type TaskRowProps = {
  title: string
  meta?: string
  /** The user's note, shown under the title (first few lines). */
  note?: string
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
  /** A finished record in history: a static checked box with nothing to tap. */
  readOnly?: boolean
  /** No checkbox or icon at all: just the text (history and timelines). */
  bare?: boolean
  /** A regular-weight title, so the row sits well below its card heading. */
  quiet?: boolean
  /** Makes the title a button that opens the item's details. */
  onOpen?: () => void
  /** Row actions shown under the note, e.g. "Complete today". */
  actions?: ReactNode
}

export function TaskRow({
  title, meta, note, checkLabel, defaultDone = false, done: controlled, onToggle, strikeWhenDone = true, onColor, priority, leading, readOnly, bare, quiet, onOpen, actions,
}: TaskRowProps) {
  const [inner, setInner] = useState(defaultDone)
  const done = controlled ?? inner
  const toggle = () => {
    if (controlled === undefined) setInner(!inner)
    onToggle?.(!done)
  }

  const check = bare
    ? null
    : (leading ??
    (readOnly ? (
      <div className={cx(s.taskCheck, s.checked)} aria-hidden="true">
        ✓
      </div>
    ) : (
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
    )))

  return (
    <div className={cx(s.task, done && strikeWhenDone && s.done, onColor && s.onColor, quiet && s.quiet)}>
      {check}
      <div className={s.taskCopy}>
        <div className={s.taskTitle}>
          {priority && <span className={s.taskPriority} aria-hidden="true" />}
          {onOpen ? (
            <button type="button" className={s.taskOpen} onClick={onOpen}>
              {title}
            </button>
          ) : (
            title
          )}
        </div>
        {meta && <div className={s.taskMeta}>{meta}</div>}
        {note && <div className={s.taskNote}>{note}</div>}
        {actions && <div className={s.taskActions}>{actions}</div>}
      </div>
    </div>
  )
}
