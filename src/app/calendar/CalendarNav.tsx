import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button, IconButton } from '../../components/Button/Button'
import { CalendarToolbar } from '../../components/Calendar/Calendar'
import { Field } from '../../components/Field/Field'
import { addDays, addMonths, today } from '../../domain/index'
import { calendarPath } from './calendarPaths'
import type { CalendarViewName } from './calendarPaths'
import s from './CalendarView.module.css'

type CalendarNavProps = {
  view: CalendarViewName
  /** Any date inside the period being shown. */
  date: string
  caption: string
  title: string
}

/** Title plus date navigation (PRD 12): previous / next, a date picker, and a Today shortcut. */
export function CalendarNav({ view, date, caption, title }: CalendarNavProps) {
  const navigate = useNavigate()
  const go = (to: string) => navigate(calendarPath(view, to))
  const step = (dir: 1 | -1) => (view === 'month' ? addMonths(date, dir) : addDays(date, dir * (view === 'week' ? 7 : 1)))

  return (
    <CalendarToolbar caption={caption} title={title}>
      <IconButton label={`Previous ${view}`} onClick={() => go(step(-1))}>
        <ChevronLeft aria-hidden="true" />
      </IconButton>
      <Button tone="lemon" size="small" onClick={() => go(today())}>
        Today
      </Button>
      <IconButton label={`Next ${view}`} onClick={() => go(step(1))}>
        <ChevronRight aria-hidden="true" />
      </IconButton>
      <div className={s.jump}>
        <Field label="Go to date" labelHidden type="date" value={date} onChange={(e) => e.target.value && go(e.target.value)} />
      </div>
    </CalendarToolbar>
  )
}
