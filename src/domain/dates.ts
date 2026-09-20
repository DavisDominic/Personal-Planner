import { invalid } from './errors'
import type { DateString, ReflectionPeriodType } from './types'

/** Weeks run Monday to Sunday (matches the design system's week view). */
const WEEK_STARTS_ON = 1

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
