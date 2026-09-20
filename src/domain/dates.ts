import { invalid } from './errors'
import type { DateString, ReflectionPeriodType } from './types'

/** Weeks run Sunday to Saturday (decided by the user; see DECISIONS.md). */
const WEEK_STARTS_ON = 0

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

const pad = (n: number) => String(n).padStart(2, '0')

export function toDateString(d: Date): DateString {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parses "YYYY-MM-DD" as a local date. Throws on anything that isn't a real calendar date. */
export function parseDate(s: DateString): Date {
  if (!DATE_RE.test(s)) throw invalid(`"${s}" isn't a valid date.`)
  const [y, m, d] = s.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (toDateString(date) !== s) throw invalid(`"${s}" isn't a valid date.`)
  return date
}

export function assertDate(s: DateString): DateString {
  parseDate(s)
  return s
}

export function assertTime(s: string): string {
  if (!TIME_RE.test(s)) throw invalid(`"${s}" isn't a valid time.`)
  return s
}

export function addDays(s: DateString, n: number): DateString {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return toDateString(d)
}

/** 0 = Sunday ... 6 = Saturday */
export function dayOfWeek(s: DateString): number {
  return parseDate(s).getDay()
}

export function weekStart(s: DateString): DateString {
  const offset = (dayOfWeek(s) - WEEK_STARTS_ON + 7) % 7
  return addDays(s, -offset)
}

/** The local calendar date of a stored timestamp. */
export function timestampToDate(ts: string): DateString {
  return toDateString(new Date(ts))
}

export function periodBounds(type: ReflectionPeriodType, s: DateString): { start: DateString; end: DateString } {
  const d = parseDate(s)
  switch (type) {
    case 'day':
      return { start: s, end: s }
    case 'week': {
      const start = weekStart(s)
      return { start, end: addDays(start, 6) }
    }
    case 'month':
      return {
        start: toDateString(new Date(d.getFullYear(), d.getMonth(), 1)),
        end: toDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
      }
    case 'year':
      return { start: `${d.getFullYear()}-01-01`, end: `${d.getFullYear()}-12-31` }
  }
}

export function isDateString(s: string): boolean {
  try {
    parseDate(s)
    return true
  } catch {
    return false
  }
}

/** Adds calendar months, keeping the day of the month where it exists (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(s: DateString, n: number): DateString {
  const d = parseDate(s)
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), lastDay))
  return toDateString(target)
}

/** The seven days (Sunday to Saturday) of the week containing `s`. */
export function weekDays(s: DateString): DateString[] {
  const start = weekStart(s)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** Every day shown in a month grid: whole weeks from the week of the 1st to the week of the last day. */
export function monthGridDays(s: DateString): DateString[] {
  const { start, end } = periodBounds('month', s)
  const first = weekStart(start)
  const last = addDays(weekStart(end), 6)
  const days: DateString[] = []
  for (let d = first; d <= last; d = addDays(d, 1)) days.push(d)
  return days
}
