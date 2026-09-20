import { MonthGrid } from '../../components/Calendar/Calendar'
import type { MonthCell } from '../../components/Calendar/Calendar'
import { getCalendarPreview, monthGridDays, today } from '../../domain/index'
import { dayLong, monthTitle, weekdayShort } from '../dateFormat'
import { useLive } from '../useLive'
import { CalendarNav } from './CalendarNav'
import { dayPath } from './calendarPaths'
import { labelFor, toneFor } from './previewItems'

/** How many previews fit in a cell before "+N more" (PRD 12). */
const SHOWN = 3
/** On phones a cell only carries tiny markers, never titles. */
const MARKS = 4

export function MonthView({ date }: { date: string }) {
  const days = monthGridDays(date)
  const start = days[0]
  const end = days[days.length - 1]
  const preview = useLive(() => getCalendarPreview(start, end), `${start}|${end}`)
  const now = today()

  const cells: MonthCell[] = days.map((d) => {
    const items = preview?.[d] ?? []
    return {
      day: Number(d.slice(8)),
      muted: d.slice(0, 7) !== date.slice(0, 7),
      today: d === now,
      href: dayPath(d),
      ariaLabel: `${dayLong(d)}${items.length ? `, ${items.length} ${items.length === 1 ? 'item' : 'items'}` : ''}`,
      items: items.slice(0, SHOWN).map((i) => ({ label: labelFor(i), tone: toneFor(i), done: i.done })),
      more: Math.max(0, items.length - SHOWN),
      marks: Math.min(items.length, MARKS),
    }
  })

  return (
    <>
      <CalendarNav view="month" date={date} caption="Month" title={monthTitle(date)} />
      <MonthGrid weekdays={days.slice(0, 7).map(weekdayShort)} cells={cells} />
    </>
  )
}
