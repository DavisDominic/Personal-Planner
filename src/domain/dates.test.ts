import { describe, expect, it } from 'vitest'
import { addDays, assertDate, assertTime, dayOfWeek, periodBounds, timestampToDate, toDateString, weekStart } from './dates'

describe('dates', () => {
  it('formats and parses local calendar dates', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(() => assertDate('2026-02-30')).toThrow()
    expect(() => assertDate('2026-9-1')).toThrow()
    expect(assertDate('2028-02-29')).toBe('2028-02-29')
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('finds weekday and the Monday that starts a week', () => {
    expect(dayOfWeek('2026-09-20')).toBe(0) // Sunday
    expect(weekStart('2026-09-20')).toBe('2026-09-14')
    expect(weekStart('2026-09-21')).toBe('2026-09-21')
    expect(weekStart('2026-09-27')).toBe('2026-09-21')
  })

  it('computes period bounds', () => {
    expect(periodBounds('month', '2028-02-10')).toEqual({ start: '2028-02-01', end: '2028-02-29' })
    expect(periodBounds('week', '2026-09-23')).toEqual({ start: '2026-09-21', end: '2026-09-27' })
    expect(periodBounds('day', '2026-09-23')).toEqual({ start: '2026-09-23', end: '2026-09-23' })
  })

  it('validates times and reads a stored timestamp as a local date', () => {
    expect(assertTime('09:05')).toBe('09:05')
    expect(() => assertTime('9:05')).toThrow()
    expect(timestampToDate(new Date(2026, 8, 20, 23, 30).toISOString())).toBe('2026-09-20')
  })
})
