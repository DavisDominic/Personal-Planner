import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import { getDayContents } from './day'
import { createOpenLoop, resolveOpenLoop } from './openLoops'
import { checkRitual, createRitual } from './rituals'
import { completeTask, createTask } from './tasks'
import { closeDomain, freshDomain } from './testHelpers'

let db: PlannerDB
beforeEach(async () => { db = await freshDomain() })
afterEach(() => closeDomain(db))

describe('getDayContents', () => {
  it('is empty on a blank planner, which is a valid day', async () => {
    expect(await getDayContents('2026-09-20')).toEqual({ priorities: [], tasks: [], earlier: [], openLoops: [], rituals: [] })
  })

  it('gathers priorities, tasks, open loops and due rituals for a date', async () => {
    const p = await createTask({ title: 'p', date: '2026-09-20', priority: 1 })
    const t = await createTask({ title: 't', date: '2026-09-20' })
    const u = await createTask({ title: 'undated' })
    const l = await createOpenLoop({ title: 'loop' })
    const r = await createRitual({ name: 'Walk', frequency: { type: 'daily' } })
    const day = await getDayContents('2026-09-20')
    expect(day.priorities.map((x) => x.id)).toEqual([p.id])
    expect(day.tasks.map((x) => x.id)).toEqual([t.id, u.id]) // undated last
    expect(day.openLoops.map((x) => x.id)).toEqual([l.id])
    expect(day.rituals.map((x) => x.ritual.id)).toEqual([r.id])
  })

  it('reports ritual check-in state per date and a factual recorded-day count', async () => {
    const r = await createRitual({ name: 'Smoke-free', frequency: { type: 'daily' } })
    await checkRitual(r.id, '2026-09-19')
    await checkRitual(r.id, '2026-09-20')
    expect((await getDayContents('2026-09-20')).rituals[0]).toMatchObject({ checked: true, recordedDays: 2 })
    expect((await getDayContents('2026-09-21')).rituals[0]).toMatchObject({ checked: false, recordedDays: 2 })
  })

  it('lists only rituals whose frequency includes the date, and never archived ones', async () => {
    await createRitual({ name: 'Weekends only', frequency: { type: 'weekends' } })
    expect((await getDayContents('2026-09-21')).rituals).toHaveLength(0) // a Monday
    expect((await getDayContents('2026-09-20')).rituals).toHaveLength(1) // a Sunday
  })

  it('keeps completed tasks on the day, and drops resolved open loops', async () => {
    const t = await createTask({ title: 't', date: '2026-09-20' })
    await completeTask(t.id)
    const l = await createOpenLoop({ title: 'loop' })
    await resolveOpenLoop(l.id)
    const day = await getDayContents('2026-09-20')
    expect(day.tasks.map((x) => x.status)).toEqual(['completed'])
    expect(day.openLoops).toHaveLength(0)
  })
})

describe('getDayContents: unfinished tasks from earlier days', () => {
  it('lists unfinished dated tasks from before the date, oldest first, without touching them', async () => {
    const old = await createTask({ title: 'older', date: '2026-09-10' })
    const yest = await createTask({ title: 'yesterday', date: '2026-09-19', priority: 1 })
    const done = await createTask({ title: 'done', date: '2026-09-18' })
    await completeTask(done.id)
    await createTask({ title: 'undated' })
    const day = await getDayContents('2026-09-20')
    expect(day.earlier.map((t) => t.id)).toEqual([old.id, yest.id])
    expect(day.priorities).toHaveLength(0) // not counted or shown as today's priorities
    expect((await getDayContents('2026-09-19')).earlier.map((t) => t.id)).toEqual([old.id])
  })
})
