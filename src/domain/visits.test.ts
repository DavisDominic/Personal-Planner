import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import { createBackup, restoreBackup } from './backup'
import { createOpenLoop, resolveOpenLoop } from './openLoops'
import { createTask } from './tasks'
import { closeDomain, freshDomain, setNow } from './testHelpers'
import { getEntryState, getWaitingSummary, recordVisit } from './visits'

let db: PlannerDB
beforeEach(async () => { db = await freshDomain() })
afterEach(() => closeDomain(db))

describe('how the planner opens', () => {
  it('is a first launch only when nothing has been recorded or saved', async () => {
    expect(await getEntryState()).toBe('first-launch')
    await recordVisit()
    expect(await getEntryState()).toBe('none')
  })

  it('does not treat a planner that already holds data as a first launch', async () => {
    await createOpenLoop({ title: 'something on my mind' })
    expect(await getEntryState()).toBe('none')
  })

  it('shows Welcome Back from 3 days away, and not before', async () => {
    setNow(2026, 9, 10)
    await recordVisit()
    setNow(2026, 9, 12)
    expect(await getEntryState()).toBe('none')
    setNow(2026, 9, 13)
    expect(await getEntryState()).toBe('welcome-back')
    setNow(2026, 11, 1)
    expect(await getEntryState()).toBe('welcome-back')
  })

  it('ends when a visit is recorded', async () => {
    setNow(2026, 9, 1)
    await recordVisit()
    setNow(2026, 9, 20)
    expect(await getEntryState()).toBe('welcome-back')
    await recordVisit()
    expect(await getEntryState()).toBe('none')
  })

  it('is not carried in a backup, and a restore keeps this device\'s last visit', async () => {
    setNow(2026, 9, 1)
    await recordVisit()
    const backup = await createBackup()
    expect(backup.data.settings).toEqual([])
    setNow(2026, 9, 20)
    await recordVisit()
    await restoreBackup(backup)
    expect(await getEntryState()).toBe('none')
  })
})

describe('what is waiting', () => {
  it('counts unfinished tasks from earlier days and open loops, and nothing else', async () => {
    await createTask({ title: 'earlier', date: '2026-09-10' })
    await createTask({ title: 'today', date: '2026-09-20' })
    await createTask({ title: 'undated' })
    const done = await createTask({ title: 'earlier done', date: '2026-09-11' })
    await db.tasks.update(done.id, { status: 'completed' })
    await createOpenLoop({ title: 'a' })
    await createOpenLoop({ title: 'b' })
    const c = await createOpenLoop({ title: 'c' })
    await resolveOpenLoop(c.id)
    expect(await getWaitingSummary()).toEqual({ unfinishedTasks: 1, openLoops: 2 })
  })
})
