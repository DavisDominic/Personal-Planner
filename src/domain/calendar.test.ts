import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import { getCalendarPreview } from './calendar'
import { addDays, addMonths, isDateString, monthGridDays, weekDays } from './dates'
import { createOpenLoop, resolveOpenLoop } from './openLoops'
import { completeTask, createTask, markTaskNoLongerRelevant } from './tasks'
import { closeDomain, freshDomain } from './testHelpers'
import { watch } from './watch'

describe('calendar date maths', () => {
  it('validates date strings', () => {
    expect(isDateString('2026-09-20')).toBe(true)
    expect(isDateString('2026-13-01')).toBe(false)
    expect(isDateString('nope')).toBe(false)
  })

  it('adds months, clamping to the end of a shorter month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
  })

  it('lists the seven days of a Sunday-to-Saturday week', () => {
    expect(weekDays('2026-09-23')).toEqual(['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26'])
  })

  it('builds a month grid of whole weeks that includes the neighbouring days', () => {
    const days = monthGridDays('2026-09-15') // Sept 2026 starts on a Tuesday and ends on a Wednesday
    expect(days[0]).toBe('2026-08-30')
    expect(days.at(-1)).toBe('2026-10-03')
    expect(days).toHaveLength(35)
    expect(days.length % 7).toBe(0)
    expect(monthGridDays('2026-02-10')).toHaveLength(28) // Feb 2026 runs Sunday 1st to Saturday 28th: exactly four rows
    expect(monthGridDays('2026-11-10')).toHaveLength(35)
    expect(monthGridDays('2027-05-10')).toHaveLength(42) // May 2027 starts on a Saturday: six rows
  })
})

describe('getCalendarPreview', () => {
  let db: PlannerDB
  beforeEach(async () => { db = await freshDomain() })
  afterEach(() => closeDomain(db))

  it('groups dated tasks and open loops by date, priorities first, then tasks, then open loops', async () => {
    await createOpenLoop({ title: 'Passport', date: '2026-09-21' })
    await createTask({ title: 'Plain', date: '2026-09-21' })
    await createTask({ title: 'P3', date: '2026-09-21', priority: 3 })
    await createTask({ title: 'P1', date: '2026-09-21', priority: 1 })
    const preview = await getCalendarPreview('2026-09-20', '2026-09-26')
    expect(preview['2026-09-21'].map((i) => i.title)).toEqual(['P1', 'P3', 'Plain', 'Passport'])
  })

  it('shows completed tasks checked and after unfinished ones in their group', async () => {
    const a = await createTask({ title: 'done', date: '2026-09-21' })
    await createTask({ title: 'todo', date: '2026-09-21' })
    await completeTask(a.id)
    const items = (await getCalendarPreview('2026-09-21', '2026-09-21'))['2026-09-21']
    expect(items.map((i) => [i.title, i.done ?? false])).toEqual([['todo', false], ['done', true]])
  })

  it('leaves out undated tasks, no-longer-relevant tasks, resolved loops, and dates outside the range', async () => {
    await createTask({ title: 'undated' })
    const nlr = await createTask({ title: 'nlr', date: '2026-09-21' })
    await markTaskNoLongerRelevant(nlr.id)
    const loop = await createOpenLoop({ title: 'resolved', date: '2026-09-21' })
    await resolveOpenLoop(loop.id)
    await createTask({ title: 'outside', date: '2026-10-05' })
    await createTask({ title: 'edge', date: '2026-09-26' })
    const preview = await getCalendarPreview('2026-09-20', '2026-09-26')
    expect(Object.keys(preview)).toEqual(['2026-09-26'])
  })

  it('returns nothing for an empty range', async () => {
    expect(await getCalendarPreview('2026-09-20', addDays('2026-09-20', 6))).toEqual({})
  })
})

describe('watch', () => {
  let db: PlannerDB
  beforeEach(async () => { db = await freshDomain() })
  afterEach(() => closeDomain(db))

  it('re-runs a query when the data it read changes, and stops after unsubscribe', async () => {
    const seen: number[] = []
    const stop = watch(
      () => db.tasks.count(),
      (n) => seen.push(n),
    )
    await new Promise((r) => setTimeout(r, 50))
    await createTask({ title: 'a' })
    await new Promise((r) => setTimeout(r, 100))
    stop()
    await createTask({ title: 'b' })
    await new Promise((r) => setTimeout(r, 100))
    expect(seen).toEqual([0, 1])
  })
})
