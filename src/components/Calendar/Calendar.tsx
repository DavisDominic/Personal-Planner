import { useState } from 'react'
import type { DragEvent, ReactNode } from 'react'
import { Link } from 'react-router'
import { CalendarDays, Plus } from 'lucide-react'
import { cx } from '../../lib/cx'
import t from '../../styles/typography.module.css'
import s from './Calendar.module.css'

type DayItemTone = 'coral' | 'violet' | 'sage' | 'sky' | 'peach' | 'lemon'
type WeekTaskTone = 'coral' | 'lemon' | 'violet' | 'sage' | 'sky' | 'peach'

export function CalendarToolbar({ caption, title, children }: { caption: string; title: string; children: ReactNode }) {
  return (
    <div className={s.calendarToolbar}>
      <div>
        <div className={t.typeCaption}>{caption}</div>
        <h1 className={s.calendarTitle}>{title}</h1>
      </div>
      <div className={s.calendarControls}>{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------- month */

export type MonthCell = {
  day: number
  muted?: boolean
  today?: boolean
  items?: { label: string; tone: DayItemTone; done?: boolean }[]
  /** Where tapping the date goes (its Day view). */
  href?: string
  /** Read by screen readers instead of the visible preview, e.g. "Sunday 20 September, 3 items". */
  ariaLabel?: string
  /** Items beyond the ones shown ("+N more"). */
  more?: number
  /** On phones the cell shows only this many tiny markers instead of titles. */
  marks?: number
  /** Shows a + on hover or focus that adds a task on this date without leaving the month. */
  onAdd?: () => void
  addLabel?: string
}

export function MonthGrid({ weekdays, cells }: { weekdays: string[]; cells: MonthCell[] }) {
  return (
    <div className={s.monthGrid}>
      {weekdays.map((d) => (
        <div key={d} className={s.monthDow}>
          {d}
        </div>
      ))}
      {cells.map((c, i) => {
        const className = cx(s.dayCell, c.muted && s.muted, c.today && s.today, c.href && s.dayLink)
        const body = (
          <>
            <div className={cx(s.dayNumber, c.today && s.todayMark)}>{c.day}</div>
            {c.items && c.items.length > 0 && (
              <div className={s.dayItems}>
                {c.items.map((it, k) => (
                  <div key={k} className={cx(s.dayItem, s[it.tone], it.done && s.done)}>
                    {it.label}
                  </div>
                ))}
              </div>
            )}
            {!!c.more && <div className={s.dayMore}>+{c.more} more</div>}
            {!!c.marks && (
              <div className={s.dayMarks} aria-hidden="true">
                {Array.from({ length: c.marks }, (_, k) => (
                  <i key={k} className={s.dayMark} />
                ))}
              </div>
            )}
          </>
        )
        return (
          <div key={i} className={className}>
            {/* The whole cell opens the Day. The preview is hidden from screen readers because the link's label says it. */}
            {c.href && <Link to={c.href} className={s.dayOverlay} aria-label={c.ariaLabel} aria-current={c.today ? 'date' : undefined} />}
            <div className={s.dayBody} aria-hidden={c.href ? true : undefined}>
              {body}
            </div>
            {c.onAdd && (
              <button type="button" className={s.dayAdd} aria-label={c.addLabel ?? 'Add a task'} onClick={c.onAdd}>
                <Plus aria-hidden="true" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------- week */

export type WeekTask = {
  title: string
  meta: string
  tone: WeekTaskTone
  key?: string
  href?: string
  done?: boolean
  /** Set on tasks that can be dragged to another day (desktop). */
  dragId?: string
  /** The click alternative to dragging: opens a way to choose a date. */
  onMove?: () => void
  moveLabel?: string
}

export type WeekDay = {
  dow: string
  date: number
  tasks?: WeekTask[]
  today?: boolean
  /** The date's Day view. */
  href?: string
  more?: number
  /** Empty space in the day creates a task with the date prefilled. */
  onAdd?: () => void
  addLabel?: string
  /** Called with a dragged task's id when it is dropped on this day. */
  onDropTask?: (taskId: string) => void
}

function WeekColumn({ day }: { day: WeekDay }) {
  const [over, setOver] = useState(false)
  const droppable = !!day.onDropTask

  const onDragOver = (e: DragEvent) => {
    if (!droppable) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOver(true)
  }
  const onDrop = (e: DragEvent) => {
    if (!droppable) return
    e.preventDefault()
    setOver(false)
    const id = e.dataTransfer.getData('text/plain')
    if (id) day.onDropTask?.(id)
  }

  const head = (
    <>
      <span>{day.dow}</span>
      <span className={cx(s.date, day.today && s.todayDate)}>{day.date}</span>
    </>
  )

  return (
    <div className={cx(s.weekCol, over && s.dropOver)} onDragOver={onDragOver} onDragLeave={() => setOver(false)} onDrop={onDrop}>
      {day.href ? (
        <Link to={day.href} className={cx(s.weekHead, s.weekHeadLink)} aria-current={day.today ? 'date' : undefined}>
          {head}
        </Link>
      ) : (
        <div className={s.weekHead}>{head}</div>
      )}
      {day.tasks?.map((task) => {
        const inner = (
          <>
            <strong>{task.title}</strong>
            <small>{task.meta}</small>
          </>
        )
        return (
          <div
            key={task.key ?? task.title}
            className={cx(s.weekTask, s[task.tone], task.done && s.done, task.dragId && s.draggable)}
            draggable={!!task.dragId}
            onDragStart={(e) => {
              if (!task.dragId) return
              e.dataTransfer.setData('text/plain', task.dragId)
              e.dataTransfer.effectAllowed = 'move'
            }}
          >
            {task.href ? (
              <Link to={task.href} className={s.weekTaskLink}>
                {inner}
              </Link>
            ) : (
              inner
            )}
            {task.onMove && (
              <button type="button" className={s.weekMove} aria-label={task.moveLabel ?? `Move ${task.title}`} onClick={task.onMove}>
                <CalendarDays aria-hidden="true" />
              </button>
            )}
          </div>
        )
      })}
      {!!day.more && day.href && (
        <Link to={day.href} className={s.weekMoreLink}>
          +{day.more} more
        </Link>
      )}
      {day.onAdd && (
        <button type="button" className={s.weekAdd} aria-label={day.addLabel ?? 'Add a task'} onClick={day.onAdd}>
          <Plus aria-hidden="true" />
          <span>Add a task</span>
        </button>
      )}
    </div>
  )
}

export function WeekGrid({ days }: { days: WeekDay[] }) {
  return (
    <div className={s.weekGrid}>
      {days.map((d) => (
        <WeekColumn key={d.dow} day={d} />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------- year */

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
