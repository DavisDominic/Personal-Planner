import type { CardTone } from '../../components/Card/Card'
import { periodBounds } from '../../domain/index'
import type { Goal, GoalScope } from '../../domain/index'
import { monthTitle, weekTitle } from '../../lib/dateFormat'

export const SCOPE_LABEL: Record<GoalScope, string> = { year: 'YEAR GOALS', month: 'MONTH GOALS', week: 'WEEK GOALS' }

/** Each scope has its own colour: year violet, month sky, week mint. The words say it too. */
export const SCOPE_TONE: Record<GoalScope, CardTone> = { year: 'violet', month: 'sky', week: 'mint' }

/** "2026", "September 2026", or "Sep 20 – 26, 2026". */
export function periodLabel(scope: GoalScope, date: string) {
  if (scope === 'year') return date.slice(0, 4)
  if (scope === 'month') return monthTitle(date)
  const { start, end } = periodBounds('week', date)
  return weekTitle(start, end)
}

/** Any date inside the period a stored goal belongs to. */
export function goalDate(goal: Goal): string {
  if (goal.scope === 'year') return `${goal.period}-01-01`
  if (goal.scope === 'month') return `${goal.period}-01`
  return goal.period
}
