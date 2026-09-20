import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import { saveCapture } from './capture'
import { listOpenLoops } from './openLoops'
import { listRituals } from './rituals'
import { getDayTasks } from './tasks'
import { closeDomain, freshDomain } from './testHelpers'

let db: PlannerDB
beforeEach(async () => { db = await freshDomain() })
afterEach(() => closeDomain(db))

describe('saveCapture', () => {
  it('"+ → Open Loop → type → save" is enough: only a title is needed', async () => {
    const res = await saveCapture({ type: 'open-loop', title: 'Figure out career direction' })
    expect(res.type).toBe('open-loop')
    expect((await listOpenLoops()).map((l) => l.title)).toEqual(['Figure out career direction'])
    expect(await db.tasks.count()).toBe(0)
  })

  it('saves a task directly, with optional date, time, note and priority', async () => {
    const res = await saveCapture({ type: 'task', title: 'Send invoice', date: '2026-09-21', time: '10:30', note: 'to Jack', priority: 2 })
    expect(res.record).toMatchObject({ title: 'Send invoice', date: '2026-09-21', time: '10:30', note: 'to Jack', priority: 2, status: 'active' })
    expect(await db.openLoops.count()).toBe(0) // no Open Loop to Task funnel
  })

  it('saves an undated task that then shows on the day', async () => {
    await saveCapture({ type: 'task', title: 'Book dentist' })
    expect((await getDayTasks('2026-09-20')).map((t) => t.title)).toEqual(['Book dentist'])
  })

  it('saves a ritual with its frequency', async () => {
    await saveCapture({ type: 'ritual', name: 'Walk', frequency: { type: 'custom', days: [1, 3, 5] } })
    expect((await listRituals()).map((r) => [r.name, r.frequency])).toEqual([['Walk', { type: 'custom', days: [1, 3, 5] }]])
  })

  it('rejects an empty title without saving anything', async () => {
    await expect(saveCapture({ type: 'open-loop', title: '  ' })).rejects.toMatchObject({ code: 'invalid-input' })
    await expect(saveCapture({ type: 'task', title: '' })).rejects.toMatchObject({ code: 'invalid-input' })
    await expect(saveCapture({ type: 'ritual', name: '', frequency: { type: 'daily' } })).rejects.toMatchObject({ code: 'invalid-input' })
    expect((await db.tasks.count()) + (await db.openLoops.count()) + (await db.rituals.count())).toBe(0)
  })
})
