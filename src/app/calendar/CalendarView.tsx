import { Navigate, useParams } from 'react-router'
import { ViewSwitch } from '../../components/ViewSwitch/ViewSwitch'
import { isDateString, today } from '../../domain/index'
import { DayView } from '../day/DayView'
import { CALENDAR_VIEWS, calendarPath } from './calendarPaths'
import type { CalendarViewName } from './calendarPaths'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import s from './CalendarView.module.css'

const isView = (v: string | undefined): v is CalendarViewName => CALENDAR_VIEWS.includes(v as CalendarViewName)
const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1)

/** Calendar (PRD 12): Day, Week and Month for one focused date. Switching view keeps the date. */
export function CalendarView() {
  const { view, date } = useParams()

  if (!isView(view)) return <Navigate to={calendarPath('month', today())} replace />
  if (!date || !isDateString(date)) return <Navigate to={calendarPath(view, today())} replace />

  return (
    <div>
      <div className={s.switch}>
        <ViewSwitch
          label="Calendar view"
          items={CALENDAR_VIEWS.map((v) => ({ label: cap(v), to: calendarPath(v, date), active: v === view }))}
        />
      </div>
      {view === 'month' && <MonthView date={date} />}
      {view === 'week' && <WeekView date={date} />}
      {view === 'day' && <DayView key={date} date={date} />}
    </div>
  )
}
