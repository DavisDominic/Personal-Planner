import { db } from './context'
import { assertDate } from './dates'
import type { DateString, OpenLoop, Task } from './types'

/** One line in a Month or Week preview. */
export type PreviewItem = {
  kind: 'task' | 'open-loop'
  id: string
  title: string
  /** P-level of a task; tasks with one come first. */
  priority?: number
  /** A completed task stays on its date, shown checked. */
  done?: boolean
  time?: string
}

export type CalendarPreview = Record<DateString, PreviewItem[]>

const group = (i: PreviewItem) => (i.kind === 'open-loop' ? 2 : i.priority !== undefined ? 0 : 1)

function compare(a: PreviewItem, b: PreviewItem) {
  return (
    group(a) - group(b) ||
    Number(a.done ?? false) - Number(b.done ?? false) ||
    (a.priority ?? 0) - (b.priority ?? 0) ||
    (a.time ?? '99:99').localeCompare(b.time ?? '99:99')
  )
}

const fromTask = (t: Task): PreviewItem => ({
  kind: 'task', id: t.id, title: t.title, priority: t.priority, done: t.status === 'completed' || undefined, time: t.time,
})
const fromLoop = (l: OpenLoop): PreviewItem => ({ kind: 'open-loop', id: l.id, title: l.title })

/**
 * What the Month and Week views preview for each date from `start` to `end` (inclusive): dated tasks
 * (priorities first) and dated open loops that are still open.
 * Undated tasks belong to the Day view, so they are left out here rather than repeated in every cell.
 */
export async function getCalendarPreview(start: DateString, end: DateString): Promise<CalendarPreview> {
  assertDate(start)
  assertDate(end)
  const [tasks, loops] = await Promise.all([
    db().tasks.where('date').between(start, end, true, true).toArray(),
    db().openLoops.where('date').between(start, end, true, true).toArray(),
  ])
  const preview: CalendarPreview = {}
  const add = (date: DateString | undefined, item: PreviewItem) => {
    if (date) (preview[date] ??= []).push(item)
  }
  for (const t of tasks) if (t.status !== 'no-longer-relevant') add(t.date, fromTask(t))
  for (const l of loops) if (l.status === 'open') add(l.date, fromLoop(l))
  for (const items of Object.values(preview)) items.sort(compare)
  return preview
}
