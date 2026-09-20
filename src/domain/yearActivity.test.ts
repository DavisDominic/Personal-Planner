import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import { createOpenLoop, resolveOpenLoop } from './openLoops'
import { checkRitual, createRitual } from './rituals'
import { completeTask, createTask } from './tasks'
import { saveReflection } from './reflections'
import { closeDomain, freshDomain, setNow } from './testHelpers'
import { getYearActivity } from './yearActivity'

let db: PlannerDB
beforeEach(async () => { db = await freshDomain() })
afterEach(() => closeDomain(db))

describe('getYearActivity', () => {
  it('is twelve quiet months on a blank planner: absence is neutral', async () => {
    const months = await getYearActivity(2026)
    expect(months).toHaveLength(12)
    expect(months.every((m) => m.recordedDays === 0 && m.weeks.every((w) => w === 0))).toBe(true)
    expect(months.map((m) => m.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('counts a day once however many things were recorded on it', async () => {
    setNow(2026, 9, 3)
    const t1 = await createTask({ title: 'a' })
    const t2 = await createTask({ title: 'b' })
    await completeTask(t1.id)
    await completeTask(t2.id)
    const ritual = await createRitual({ name: 'Walk', frequency: { type: 'daily' } })
    await checkRitual(ritual.id, '2026-09-03')
    await saveReflection('day', '2026-09-03', 'a note')
    const sept = (await getYearActivity(2026))[8]
    expect(sept.recordedDays).toBe(1)
  })

  it('counts completed tasks, check-ins, taken-care-of loops and day reflections', async () => {
    const ritual = await createRitual({ name: 'Walk', frequency: { type: 'daily' } })
    await checkRitual(ritual.id, '2026-03-02')
    await saveReflection('day', '2026-03-10', 'x')
    setNow(2026, 3, 15)
    const loop = await createOpenLoop({ title: 'l' })
    await resolveOpenLoop(loop.id)
    setNow(2026, 3, 30)
    const task = await createTask({ title: 't' })
    await completeTask(task.id)
    const march = (await getYearActivity(2026))[2]
    expect(march.recordedDays).toBe(4)
    expect(march.weeks).toEqual([1, 1, 1, 0, 1]) // 2nd, 10th, 15th and 30th
  })

  it('ignores created-but-unfinished work, week and month reflections, and other years', async () => {
    await createTask({ title: 'planned only', date: '2026-05-05' })
    await saveReflection('week', '2026-05-05', 'week note')
    await saveReflection('month', '2026-05-05', 'month note')
    const ritual = await createRitual({ name: 'Walk', frequency: { type: 'daily' } })
    await checkRitual(ritual.id, '2025-05-05')
    expect((await getYearActivity(2026))[4].recordedDays).toBe(0)
    expect((await getYearActivity(2025))[4].recordedDays).toBe(1)
  })
})
