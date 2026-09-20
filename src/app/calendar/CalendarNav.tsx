import { useNavigate } from 'react-router'
import { Button } from '../../components/Button/Button'
import { CalendarToolbar } from '../../components/Calendar/Calendar'
import { DatePicker } from '../../components/DatePicker/DatePicker'
import { addDays, addMonths, today } from '../../domain/index'
import { calendarPath } from './calendarPaths'
import type { CalendarViewName } from './calendarPaths'
import s from './CalendarView.module.css'

type CalendarNavProps = {
  view: CalendarViewName
  /** The date being looked at (any date inside the period being shown). */
  date: string
  caption: string
  title: string
}

/**
 * Title with Back and Next arrows on either side, plus "Show today" (back to the present) and a date
 * picker on the right (PRD 12). The same for Day, Week and Month.
 */
export function CalendarNav({ view, date, caption, title }: CalendarNavProps) {
  const navigate = useNavigate()
  const go = (to: string) => navigate(calendarPath(view, to))
  const step = (dir: 1 | -1) => (view === 'month' ? addMonths(date, dir) : addDays(date, dir * (view === 'week' ? 7 : 1)))
  const now = today()

  return (
    <CalendarToolbar
      caption={caption}
      title={title}
      previousLabel={`Previous ${view}`}
      nextLabel={`Next ${view}`}
      onPrevious={() => go(step(-1))}
      onNext={() => go(step(1))}
    >
      <Button tone="lemon" disabled={date === now} onClick={() => go(now)}>
        Show today
      </Button>
      <div className={s.jump}>
        <DatePicker label="Go to date" labelHidden align="end" value={date} onChange={(v) => v && go(v)} />
      </div>
    </CalendarToolbar>
  )
}
