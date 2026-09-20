/** Display formatting for "YYYY-MM-DD" dates, in the reader's own language and order. */
import { today } from '../domain/index'

const parse = (d: string) => {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day)
}

const fmt = (d: string, options: Intl.DateTimeFormatOptions) => parse(d).toLocaleDateString(undefined, options)

/** "September 2026" */
export const monthTitle = (d: string) => fmt(d, { month: 'long', year: 'numeric' })
/** "Sunday 20 September" */
export const dayLong = (d: string) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })
/** "20 Sep" */
export const dayShort = (d: string) => fmt(d, { day: 'numeric', month: 'short' })
/** "Sunday" */
export const weekdayLong = (d: string) => fmt(d, { weekday: 'long' })
/** "Sun" */
export const weekdayShort = (d: string) => fmt(d, { weekday: 'short' })

/** "20 Sep" for this year, "20 Sep 2027" otherwise. */
export const dayTitle = (d: string) => (d.slice(0, 4) === today().slice(0, 4) ? dayShort(d) : `${dayShort(d)} ${d.slice(0, 4)}`)

/** A locale-aware range such as "Sep 20 – 26, 2026" or "Aug 30 – Sep 5, 2026". */
export const weekTitle = (start: string, end: string) =>
  new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).formatRange(parse(start), parse(end))

/** "Sun, Sep 20, 2026" */
export const dayFull = (d: string) => fmt(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

/** "Sep" (from any date in that month) */
export const monthShort = (d: string) => fmt(d, { month: 'short' })
/** "September" */
export const monthLong = (d: string) => fmt(d, { month: 'long' })
