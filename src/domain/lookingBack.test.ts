import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import { getLookingBack } from './lookingBack'
import { createOpenLoop, resolveOpenLoop } from './openLoops'
import { saveReflection } from './reflections'
import { checkRitual, createRitual } from './rituals'
import { completeTask, createTask } from './tasks'
import { closeDomain, freshDomain, setNow } from './testHelpers'

let db: PlannerDB
beforeEach(async () => { db = await freshDomain() })
afterEach(() => closeDomain(db))

/** Completes a new task on a given local day. */
async function doneOn(y: number, m: number, d: number, title: string, priority?: number) {
  setNow(y, m, d)
  const t = await createTask({ title, priority })
  await completeTask(t.id)
}

describe('getLookingBack', () => {
  it('is quiet on a blank planner: no records, nothing to say about it', async () => {
    const r = await getLookingBack(null)
    expect(r).toMatchObject({ tasksDone: [], prioritiesDone: 0, rituals: [], checkinCount: 0, resolvedLoops: [], reflections: [], recordedDays: 0, timeline: [] })
    expect(r.recordBegins).toBeUndefined()
  })

  it('lists completed tasks in a range, most recent first, and counts the priorities among them', async () => {
    await doneOn(2026, 9, 14, 'older', 1)
    await doneOn(2026, 9, 16, 'newer')
    await doneOn(2026, 9, 25, 'later week', 2)
    const r = await getLookingBack({ start: '2026-09-13', end: '2026-09-19' })
    expect(r.tasksDone.map((t) => t.title)).toEqual(['newer', 'older'])
    expect(r.prioritiesDone).toBe(1)
    expect(r.recordedDays).toBe(2)
  })

  it('tallies ritual check-ins per ritual in name order, without ranking them', async () => {
    const walk = await createRitual({ name: 'Walk', frequency: { type: 'daily' } })
    const smoke = await createRitual({ name: 'Smoke-free', frequency: { type: 'daily' } })
    for (const d of ['2026-09-14', '2026-09-15', '2026-09-16']) await checkRitual(walk.id, d)
    await checkRitual(smoke.id, '2026-09-14')
    const r = await getLookingBack({ start: '2026-09-13', end: '2026-09-19' })
    expect(r.rituals.map((x) => [x.name, x.checkins])).toEqual([['Smoke-free', 1], ['Walk', 3]])
    expect(r.checkinCount).toBe(4)
    expect(r.recordedDays).toBe(3)
  })

  it('shows open loops that were taken care of, by the day they were resolved', async () => {
    setNow(2026, 9, 15)
    const l = await createOpenLoop({ title: 'Passport' })
    setNow(2026, 9, 18)
    await resolveOpenLoop(l.id)
    await createOpenLoop({ title: 'Still open' })
    expect((await getLookingBack({ start: '2026-09-18', end: '2026-09-18' })).resolvedLoops.map((x) => x.title)).toEqual(['Passport'])
    expect((await getLookingBack({ start: '2026-09-15', end: '2026-09-17' })).resolvedLoops).toHaveLength(0)
  })

  it('includes reflections whose period overlaps the range; only day reflections count as recorded days', async () => {
    await saveReflection('day', '2026-09-16', 'a day')
    await saveReflection('week', '2026-09-16', 'a week') // 13-19 Sep
    await saveReflection('month', '2026-09-16', 'a month')
    await saveReflection('year', '2026-09-16', 'a year')
    const week = await getLookingBack({ start: '2026-09-13', end: '2026-09-19' })
    expect(week.reflections.map((x) => x.periodType).sort()).toEqual(['day', 'month', 'week', 'year'])
    expect(week.recordedDays).toBe(1)
    const otherWeek = await getLookingBack({ start: '2026-09-20', end: '2026-09-26' })
    expect(otherWeek.reflections.map((x) => x.periodType).sort()).toEqual(['month', 'year'])
    expect(otherWeek.recordedDays).toBe(0)
  })

  it('all time takes everything, and says when the record begins whatever the range', async () => {
    await doneOn(2025, 3, 2, 'first')
    await doneOn(2026, 9, 16, 'second')
    const all = await getLookingBack(null)
    expect(all.tasksDone).toHaveLength(2)
    expect(all.recordBegins).toBe('2025-03-02')
    expect((await getLookingBack({ start: '2026-09-01', end: '2026-09-30' })).recordBegins).toBe('2025-03-02')
  })

  it('builds one timeline of everything in the range, newest first', async () => {
    await doneOn(2026, 9, 14, 'task')
    const ritual = await createRitual({ name: 'Walk', frequency: { type: 'daily' } })
    await checkRitual(ritual.id, '2026-09-16')
    setNow(2026, 9, 15)
    const loop = await createOpenLoop({ title: 'loop' })
    await resolveOpenLoop(loop.id)
    await saveReflection('day', '2026-09-17', 'note')
    const r = await getLookingBack({ start: '2026-09-13', end: '2026-09-19' })
    expect(r.timeline.map((e) => [e.kind, e.date])).toEqual([
      ['reflection', '2026-09-17'],
      ['ritual', '2026-09-16'],
      ['loop', '2026-09-15'],
      ['task', '2026-09-14'],
    ])
  })

  it('never includes unfinished or merely planned work', async () => {
    await createTask({ title: 'planned', date: '2026-09-16', priority: 1 })
    const r = await getLookingBack({ start: '2026-09-13', end: '2026-09-19' })
    expect(r.timeline).toHaveLength(0)
    expect(r.recordedDays).toBe(0)
  })
})
