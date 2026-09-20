import { useState } from 'react'
import { Target } from 'lucide-react'
import { Button } from '../../components/Button/Button'
import { Card, CardHead } from '../../components/Card/Card'
import { GoalRow } from '../../components/Goal/GoalRow'
import { addDays, addMonths, goalPeriod, listGoals, restoreGoalFromArchive, today } from '../../domain/index'
import type { Goal, GoalScope } from '../../domain/index'
import { cx } from '../../lib/cx'
import { useLive } from '../useLive'
import { GoalDialog } from './GoalDialog'
import type { GoalTarget } from './GoalDialog'
import { SCOPE_LABEL, SCOPE_TONE, periodLabel } from './goalLabels'
import s from './GoalsSection.module.css'

type GoalsSectionProps = {
  scope: GoalScope
  /** Any date inside the period the goals are for. */
  date: string
  /** "full" is a card; "context" is a compact block for the Month and Week views (PRD 12). */
  variant?: 'full' | 'context'
  /** Lists archived goals for the period behind a disclosure. */
  showArchived?: boolean
  /** Back and next arrows so any year, month or week can be reached from here. */
  navigable?: boolean
}

const NOUN: Record<GoalScope, string> = { year: 'year', month: 'month', week: 'week' }

/** The goals for a year, month or week (PRD 10): direction, not project management. */
export function GoalsSection({ scope, date, variant = 'full', showArchived, navigable }: GoalsSectionProps) {
  // With arrows the section keeps its own period; otherwise it follows the date it is given.
  const [browsed, setBrowsed] = useState(date)
  const shown = navigable ? browsed : date
  const key = `${scope}-${goalPeriod(scope, shown)}`
  const goals = useLive(() => listGoals(scope, shown), key) ?? []
  const archived =
    useLive(() => (showArchived ? listGoals(scope, shown, { archived: true }) : Promise.resolve([] as Goal[])), `${key}-archived-${!!showArchived}`) ?? []
  const [target, setTarget] = useState<GoalTarget | null>(null)
  const [showOld, setShowOld] = useState(false)

  const add = () => setTarget({ kind: 'new', scope, date: shown })
  const open = (goal: Goal) => () => setTarget({ kind: 'edit', goal })
  const step = (dir: 1 | -1) => setBrowsed(scope === 'year' ? addMonths(shown, dir * 12) : scope === 'month' ? addMonths(shown, dir) : addDays(shown, dir * 7))
  const isCurrent = goalPeriod(scope, shown) === goalPeriod(scope, today())

  if (variant === 'context') {
    return (
      <div className={cx(s.context, s[scope])}>
        <div className={s.contextLabel}>{SCOPE_LABEL[scope]}</div>
        <div className={s.list}>
          {goals.map((goal) => (
            <GoalRow key={goal.id} title={goal.title} description={goal.description} onOpen={open(goal)} />
          ))}
        </div>
        <div className={s.add}>
          <Button size="small" onClick={add}>
            + Add a goal
          </Button>
        </div>
        <GoalDialog target={target} onClose={() => setTarget(null)} />
      </div>
    )
  }

  return (
    <>
      <Card kind="color" tone={SCOPE_TONE[scope]}>
        <CardHead
          kicker={SCOPE_LABEL[scope]}
          title={periodLabel(scope, shown)}
          icon={<Target aria-hidden="true" />}
          stepper={
            navigable
              ? { onPrevious: () => step(-1), onNext: () => step(1), previousLabel: `Previous ${NOUN[scope]}`, nextLabel: `Next ${NOUN[scope]}` }
              : undefined
          }
        />
        <div className={s.list}>
          {goals.map((goal) => (
            <GoalRow key={goal.id} title={goal.title} description={goal.description} onOpen={open(goal)} />
          ))}
        </div>
        <div className={s.add}>
          <Button size="small" onClick={add}>
            + Add a goal
          </Button>
          {navigable && !isCurrent && (
            <Button size="small" onClick={() => setBrowsed(today())}>
              Show this {NOUN[scope]}
            </Button>
          )}
        </div>
        {showArchived && archived.length > 0 && (
          <>
            <div className={s.disclose}>
              <Button size="small" aria-expanded={showOld} onClick={() => setShowOld((v) => !v)}>
                Archived · {archived.length} — {showOld ? 'Hide' : 'Show'}
              </Button>
            </div>
            {showOld && (
              <div className={s.list}>
                {archived.map((goal) => (
                  <GoalRow
                    key={goal.id}
                    title={goal.title}
                    description={goal.description}
                    onOpen={open(goal)}
                    actions={
                      <Button size="small" onClick={() => void restoreGoalFromArchive(goal.id)}>
                        Restore
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Card>
      <GoalDialog target={target} onClose={() => setTarget(null)} />
    </>
  )
}
