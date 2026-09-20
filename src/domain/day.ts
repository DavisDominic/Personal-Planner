import { assertDate } from './dates'
import { listOpenLoops, listTakenCareOfOn } from './openLoops'
import { countRecordedDays, getCheckinsOn, isRitualDueOn, listRituals } from './rituals'
import { getDayPriorities, getDayTasks, getUnfinishedFromEarlier } from './tasks'
import type { DateString, OpenLoop, Ritual, Task } from './types'

export type DayRitual = {
  ritual: Ritual
  /** Checked in on this date. */
  checked: boolean
  /** Factual count of days ever recorded, e.g. "22 recorded days". A lapse never lowers it. */
  recordedDays: number
}

/** Everything the Day screen shows for a date (PRD 12). */
export type DayContents = {
  /** Always all visible, never collapsed. Ordered by P-level. */
  priorities: Task[]
  /** Tasks without a priority: remaining and completed. Undated ones come last. */
  tasks: Task[]
  /**
   * Unfinished dated tasks from before this date, oldest first. Nothing about them changes by being
   * listed. The UI shows them as "From yesterday" only on today's Day.
   */
  earlier: Task[]
  /** All open loops, newest first. They are not tied to a day, and the app doesn't choose which matters. */
  openLoops: OpenLoop[]
  /** Loops taken care of on this date, so the day shows what was cleared and it can be put back. */
  takenCareOf: OpenLoop[]
  /** Active rituals whose frequency lists this date. */
  rituals: DayRitual[]
}

export async function getDayContents(date: DateString): Promise<DayContents> {
  assertDate(date)
  const [priorities, tasks, earlier, openLoops, takenCareOf, rituals, checkins] = await Promise.all([
    getDayPriorities(date),
    getDayTasks(date),
    getUnfinishedFromEarlier(date),
    listOpenLoops(),
    listTakenCareOfOn(date),
    listRituals(),
    getCheckinsOn(date),
  ])
  const checked = new Set(checkins.map((c) => c.ritualId))
  const due = rituals.filter((r) => isRitualDueOn(r, date))
  const counts = await Promise.all(due.map((r) => countRecordedDays(r.id)))
  return {
    priorities,
    tasks,
    earlier,
    openLoops,
    takenCareOf,
    rituals: due.map((ritual, i) => ({ ritual, checked: checked.has(ritual.id), recordedDays: counts[i] })),
  }
}
