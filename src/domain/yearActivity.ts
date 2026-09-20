import { db } from './context'
import { timestampToDate } from './dates'
import type { DateString } from './types'

/** Number of weekly buckets in a month's activity strip (days 1-7, 8-14, 15-21, 22-28, 29-31). */
export const ACTIVITY_BUCKETS = 5

export type MonthActivity = {
  /** 1 to 12. */
  month: number
  /** Days in the month with at least one recorded thing. Zero is simply zero: absence is neutral. */
  recordedDays: number
  /** Recorded days in each weekly bucket (0 to 7), for a small activity strip. */
  weeks: number[]
}

/**
 * A lightweight, factual picture of what was recorded in each month of a year (PRD 12, 13). A day counts
 * as recorded if a task was completed, a ritual was checked in, an open loop was taken care of, or a
 * day reflection was written. It is never a score, a target or a comparison.
 */
export async function getYearActivity(year: number): Promise<MonthActivity[]> {
  const prefix = `${year}-`
  const recorded = new Set<DateString>()
  const add = (date: DateString | undefined) => {
    if (date && date.startsWith(prefix)) recorded.add(date)
  }

  const [completed, checkins, resolved, reflections] = await Promise.all([
    db().tasks.filter((t) => t.completedAt !== undefined).toArray(),
    db().checkins.where('date').between(`${year}-01-01`, `${year}-12-31`, true, true).toArray(),
    db().openLoops.filter((l) => l.resolvedAt !== undefined).toArray(),
    db().reflections.where('periodType').equals('day').toArray(),
  ])
  completed.forEach((t) => add(timestampToDate(t.completedAt!)))
  checkins.forEach((c) => add(c.date))
  resolved.forEach((l) => add(timestampToDate(l.resolvedAt!)))
  reflections.forEach((r) => add(r.periodStart))

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const weeks = Array<number>(ACTIVITY_BUCKETS).fill(0)
    let recordedDays = 0
    for (const date of recorded) {
      if (Number(date.slice(5, 7)) !== month) continue
      recordedDays++
      weeks[Math.min(ACTIVITY_BUCKETS - 1, Math.floor((Number(date.slice(8)) - 1) / 7))]++
    }
    return { month, recordedDays, weeks }
  })
}
