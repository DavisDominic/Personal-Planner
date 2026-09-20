import type { ReactNode } from 'react'
import s from './GoalRow.module.css'

type GoalRowProps = {
  title: string
  description?: string
  /** Makes the title a button that opens the goal's details. */
  onOpen?: () => void
  /** Actions under the description, e.g. Restore. */
  actions?: ReactNode
}

/**
 * One goal: a title and an optional description, and nothing else. No checkbox, progress or milestones:
 * goals are direction, not project management (PRD 10).
 */
export function GoalRow({ title, description, onOpen, actions }: GoalRowProps) {
  return (
    <div className={s.row}>
      <div className={s.title}>
        {onOpen ? (
          <button type="button" className={s.open} onClick={onOpen}>
            {title}
          </button>
        ) : (
          title
        )}
      </div>
      {description && <div className={s.description}>{description}</div>}
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  )
}
