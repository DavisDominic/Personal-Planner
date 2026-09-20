import { useState } from 'react'
import { Target } from 'lucide-react'
import { Button } from '../../components/Button/Button'
import { Card, CardHead } from '../../components/Card/Card'
import { GoalRow } from '../../components/Goal/GoalRow'
import { goalPeriod, listGoals, periodBounds, restoreGoalFromArchive } from '../../domain/index'
import type { Goal, GoalScope } from '../../domain/index'
import { monthTitle, weekTitle } from '../../lib/dateFormat'
import { useLive } from '../useLive'
import { GoalDialog } from './GoalDialog'
import type { GoalTarget } from './GoalDialog'
import s from './GoalsSection.module.css'

const SCOPE_LABEL: Record<GoalScope, string> = { year: 'YEAR GOALS', month: 'MONTH GOALS', week: 'WEEK GOALS' }

function periodLabel(scope: GoalScope, date: string) {
  if (scope === 'year') return date.slice(0, 4)
  if (scope === 'month') return monthTitle(date)
  const { start, end } = periodBounds('week', date)
  return weekTitle(start, end)
}

type GoalsSectionProps = {
  scope: GoalScope
  /** Any date inside the period the goals are for. */
  date: string
  /** "full" is a card; "context" is a slim strip for the Month and Week views (PRD 12). */
  variant?: 'full' | 'context'
  /** Lists archived goals for the period behind a disclosure. */
  showArchived?: boolean
}

/** The goals for a year, month or week (PRD 10): direction, not project management. */
export function GoalsSection({ scope, date, variant = 'full', showArchived }: GoalsSectionProps) {
  const key = `${scope}-${goalPeriod(scope, date)}`
  const goals = useLive(() => listGoals(scope, date), key) ?? []
  const archived = useLive(() => (showArchived ? listGoals(scope, date, { archived: true }) : Promise.resolve([] as Goal[])), `${key}-archived-${!!showArchived}`) ?? []
  const [target, setTarget] = useState<GoalTarget | null>(null)
  const [showOld, setShowOld] = useState(false)

  const add = () => setTarget({ kind: 'new', scope, date })
  const open = (goal: Goal) => () => setTarget({ kind: 'edit', goal })

  if (variant === 'context') {
    return (
      <div className={s.context}>
        <span className={s.contextLabel}>{SCOPE_LABEL[scope]}</span>
        {goals.map((goal) => (
          <button key={goal.id} type="button" className={s.chip} onClick={open(goal)}>
            {goal.title}
          </button>
        ))}
        <Button size="small" onClick={add}>
          + Add a goal
        </Button>
        <GoalDialog target={target} onClose={() => setTarget(null)} />
      </div>
    )
  }

  return (
    <>
      <Card kind="color" tone="violet">
        <CardHead kicker={SCOPE_LABEL[scope]} title={periodLabel(scope, date)} icon={<Target aria-hidden="true" />} />
        {goals.map((goal) => (
          <GoalRow key={goal.id} title={goal.title} description={goal.description} onOpen={open(goal)} />
        ))}
        <div className={s.add}>
          <Button size="small" onClick={add}>
            + Add a goal
          </Button>
        </div>
        {showArchived && archived.length > 0 && (
          <>
            <div className={s.disclose}>
              <Button size="small" aria-expanded={showOld} onClick={() => setShowOld((v) => !v)}>
                Archived · {archived.length} — {showOld ? 'Hide' : 'Show'}
              </Button>
            </div>
            {showOld &&
              archived.map((goal) => (
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
          </>
        )}
      </Card>
      <GoalDialog target={target} onClose={() => setTarget(null)} />
    </>
  )
}
