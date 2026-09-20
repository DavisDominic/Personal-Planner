import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import t from '../../styles/typography.module.css'
import s from './Calendar.module.css'

type DayItemTone = 'coral' | 'violet' | 'sage' | 'sky' | 'peach'
type WeekTaskTone = 'coral' | 'lemon' | 'violet' | 'sage' | 'sky'

export function CalendarToolbar({ caption, title, children }: { caption: string; title: string; children: ReactNode }) {
  return (
    <div className={s.calendarToolbar}>
      <div>
        <div className={t.typeCaption}>{caption}</div>
        <div className={s.calendarTitle}>{title}</div>
      </div>
      <div className={s.calendarControls}>{children}</div>
    </div>
  )
}

export type MonthCell = {
  day: number
  muted?: boolean
  today?: boolean
  items?: { label: string; tone: DayItemTone }[]
}

export function MonthGrid({ weekdays, cells }: { weekdays: string[]; cells: MonthCell[] }) {
  return (
    <div className={s.monthGrid}>
      {weekdays.map((d) => (
        <div key={d} className={s.monthDow}>
          {d}
        </div>
      ))}
      {cells.map((c, i) => (
        <div key={i} className={cx(s.dayCell, c.muted && s.muted, c.today && s.today)}>
          <div className={cx(s.dayNumber, c.today && s.todayMark)}>{c.day}</div>
          {c.items && (
            <div className={s.dayItems}>
              {c.items.map((it) => (
                <div key={it.label} className={cx(s.dayItem, s[it.tone])}>
                  {it.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export type WeekDay = {
  dow: string
  date: number
  tasks?: { title: string; meta: string; tone: WeekTaskTone }[]
}

export function WeekGrid({ days }: { days: WeekDay[] }) {
  return (
    <div className={s.weekGrid}>
      {days.map((d) => (
        <div key={d.dow} className={s.weekCol}>
          <div className={s.weekHead}>
            <span>{d.dow}</span>
            <span className={s.date}>{d.date}</span>
          </div>
          {d.tasks?.map((task) => (
            <div key={task.title} className={cx(s.weekTask, s[task.tone])}>
              <strong>{task.title}</strong>
              <small>{task.meta}</small>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export type YearMonth = { name: string; sub: string; active?: boolean; bars: number }

export function YearGrid({ months }: { months: YearMonth[] }) {
  return (
    <div className={s.yearGrid}>
      {months.map((m) => (
        <div key={m.name} className={cx(s.monthCard, m.active && s.active)}>
          <div className={s.monthName}>{m.name}</div>
          <div className={s.monthSub}>{m.sub}</div>
          <div className={s.activityRow} aria-hidden="true">
            {Array.from({ length: m.bars }, (_, i) => (
              <i key={i} className={s.activityBar} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
