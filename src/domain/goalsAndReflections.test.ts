import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import {
  archiveGoal, createGoal, discardGoal, getGoal, goalPeriod, listGoals, restoreDiscardedGoal, restoreGoalFromArchive, updateGoal,
} from './goals'
import { deleteReflection, getReflection, restoreReflection, saveReflection } from './reflections'
import { closeDomain, freshDomain } from './testHelpers'

let db: PlannerDB
beforeEach(async () => { db = await freshDomain() })
afterEach(() => closeDomain(db))

describe('goals', () => {
  it('normalises the period for each scope (weeks start on Sunday)', () => {
    expect(goalPeriod('year', '2026-09-20')).toBe('2026')
    expect(goalPeriod('month', '2026-09-20')).toBe('2026-09')
    expect(goalPeriod('week', '2026-09-20')).toBe('2026-09-20') // a Sunday starts its own week
    expect(goalPeriod('week', '2026-09-26')).toBe('2026-09-20') // the Saturday ends it
    expect(goalPeriod('week', '2026-09-27')).toBe('2026-09-27')
  })

  it('lists goals for the period containing a date, by scope', async () => {
    const wk = await createGoal({ title: 'Finish portfolio case study', scope: 'week', forDate: '2026-09-22' })
    await createGoal({ title: 'Next week', scope: 'week', forDate: '2026-09-29' })
    const yr = await createGoal({ title: 'Ship v1', scope: 'year', forDate: '2026-03-01' })
    expect((await listGoals('week', '2026-09-26')).map((g) => g.id)).toEqual([wk.id])
    expect((await listGoals('year', '2026-12-31')).map((g) => g.id)).toEqual([yr.id])
    expect(await listGoals('month', '2026-09-01')).toHaveLength(0)
  })

  it('stores only direction: no progress, milestones, checklist or task link', async () => {
    const g = await createGoal({ title: 'a', description: '  why  ', scope: 'month', forDate: '2026-09-01' })
    expect(Object.keys(g).sort()).toEqual(['createdAt', 'description', 'id', 'period', 'scope', 'status', 'title', 'updatedAt'])
    expect(g.description).toBe('why')
  })

  it('archives, restores from archive, and discards with Undo', async () => {
    const g = await createGoal({ title: 'a', scope: 'week', forDate: '2026-09-21' })
    await archiveGoal(g.id)
    expect(await listGoals('week', '2026-09-21')).toHaveLength(0)
    expect((await listGoals('week', '2026-09-21', { archived: true })).map((x) => x.id)).toEqual([g.id])
    const back = await restoreGoalFromArchive(g.id)
    expect(back.status).toBe('active')
    expect(back).not.toHaveProperty('archivedAt')
    const removed = await discardGoal(g.id)
    expect(await getGoal(g.id)).toBeUndefined()
    await restoreDiscardedGoal(removed)
    expect(await getGoal(g.id)).toEqual(removed)
  })

  it('edits title and description, and rejects an empty title', async () => {
    const g = await createGoal({ title: 'a', description: 'd', scope: 'week', forDate: '2026-09-21' })
    const u = await updateGoal(g.id, { title: 'b', description: null })
    expect(u.title).toBe('b')
    expect(u).not.toHaveProperty('description')
    await expect(updateGoal(g.id, { title: ' ' })).rejects.toMatchObject({ code: 'invalid-input' })
  })
})

describe('reflections', () => {
  it('an abandoned empty editor creates no record', async () => {
    expect(await saveReflection('day', '2026-09-20', '   ')).toEqual({ status: 'unchanged' })
    expect(await db.reflections.count()).toBe(0)
  })

  it('keeps one editable record per period and updates it in place', async () => {
    const a = await saveReflection('day', '2026-09-20', 'Did very little today.')
    const b = await saveReflection('day', '2026-09-20', 'Did very little today. That counts.')
    expect(a.status === 'saved' && b.status === 'saved' && a.reflection.id === b.reflection.id).toBe(true)
    expect(await db.reflections.count()).toBe(1)
    expect((await getReflection('day', '2026-09-20'))?.content).toBe('Did very little today. That counts.')
  })

  it('a day, week, month and year are separate periods with the right bounds', async () => {
    await saveReflection('day', '2026-09-20', 'd')
    await saveReflection('week', '2026-09-20', 'w')
    await saveReflection('month', '2026-09-20', 'm')
    await saveReflection('year', '2026-09-20', 'y')
    expect(await db.reflections.count()).toBe(4)
    expect(await getReflection('week', '2026-09-23')).toMatchObject({ periodStart: '2026-09-20', periodEnd: '2026-09-26' })
    expect(await getReflection('week', '2026-09-16')).toBeUndefined() // the week before is a different period
    expect(await getReflection('month', '2026-09-01')).toMatchObject({ periodStart: '2026-09-01', periodEnd: '2026-09-30' })
    expect(await getReflection('year', '2026-01-01')).toMatchObject({ periodStart: '2026-01-01', periodEnd: '2026-12-31' })
  })

  it('emptying an existing reflection removes it and returns it for Undo', async () => {
    await saveReflection('day', '2026-09-20', 'hello')
    const res = await saveReflection('day', '2026-09-20', '')
    expect(res.status).toBe('removed')
    expect(await getReflection('day', '2026-09-20')).toBeUndefined()
    if (res.status === 'removed') await restoreReflection(res.reflection)
    expect((await getReflection('day', '2026-09-20'))?.content).toBe('hello')
  })

  it('delete is permanent with Undo', async () => {
    await saveReflection('week', '2026-09-20', 'x')
    const removed = await deleteReflection('week', '2026-09-20')
    expect(await getReflection('week', '2026-09-20')).toBeUndefined()
    await restoreReflection(removed!)
    expect(await getReflection('week', '2026-09-20')).toEqual(removed)
    expect(await deleteReflection('day', '2026-01-01')).toBeUndefined()
  })
})
