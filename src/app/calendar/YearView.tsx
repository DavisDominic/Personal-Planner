import { YearGrid } from '../../components/Calendar/Calendar'
import type { YearMonth } from '../../components/Calendar/Calendar'
import { getYearActivity, today } from '../../domain/index'
import { monthLong, monthShort } from '../../lib/dateFormat'
import { GoalsSection } from '../goals/GoalsSection'
import { useLive } from '../useLive'
import { CalendarNav } from './CalendarNav'
import { calendarPath } from './calendarPaths'
import s from './CalendarView.module.css'

/**
 * The Year (PRD 12): orientation, not planning. Exactly three things: the 12 months, a light indication of
 * recorded activity, and the Year's goals. No individual tasks, open loops or rituals.
 */
export function YearView({ date }: { date: string }) {
  const year = Number(date.slice(0, 4))
  const activity = useLive(() => getYearActivity(year), String(year))
  const now = today()

  const months: YearMonth[] = Array.from({ length: 12 }, (_, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, '0')}`
    const first = `${prefix}-01`
    const inMonth = (d: string) => d.startsWith(prefix)
    // Opening a month keeps the selected date if it is in it, else today if it is, else the 1st.
    const target = inMonth(date) ? date : inMonth(now) ? now : first
    const days = activity?.[i]?.recordedDays ?? 0
    return {
      name: monthShort(first),
      sub: days > 0 ? `${days} recorded ${days === 1 ? 'day' : 'days'}` : '',
      active: inMonth(date),
      current: inMonth(now),
      bars: activity?.[i]?.weeks ?? [],
      href: calendarPath('month', target),
      ariaLabel: `${monthLong(first)} ${year}${days > 0 ? `, ${days} recorded ${days === 1 ? 'day' : 'days'}` : ''}`,
    }
  })

  return (
    <>
      <CalendarNav view="year" date={date} caption="Year" title={String(year)} />
      <YearGrid months={months} />
      <div className={s.goals}>
        <GoalsSection scope="year" date={date} />
      </div>
    </>
  )
}
