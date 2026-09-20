import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import {
  convertOpenLoopToTask, countOpenLoops, createOpenLoop, deleteOpenLoop, getOpenLoop, listOpenLoops, listTakenCareOf,
  reopenOpenLoop, resolveOpenLoop, restoreOpenLoop, updateOpenLoop,
} from './openLoops'
import { getTask, getDayTasks } from './tasks'
import { closeDomain, freshDomain, setNow } from './testHelpers'

let db: PlannerDB
beforeEach(async () => { db = await freshDomain() })
afterEach(() => closeDomain(db))

describe('open loops', () => {
  it('need only a title: no category, date or expiry', async () => {
    const l = await createOpenLoop({ title: 'Look into passport' })
    expect(l).toMatchObject({ title: 'Look into passport', status: 'open' })
    expect(l.date).toBeUndefined()
    await expect(createOpenLoop({ title: ' ' })).rejects.toMatchObject({ code: 'invalid-input' })
  })

  it('an optional date does not turn it into a task', async () => {
    await createOpenLoop({ title: 'Passport', date: '2026-09-30' })
    expect(await getDayTasks('2026-09-30')).toHaveLength(0)
    expect(await listOpenLoops()).toHaveLength(1)
  })

  it('resolving moves it to "taken care of" and stays on record; reopen undoes it', async () => {
    const l = await createOpenLoop({ title: 'a' })
    setNow(2026, 9, 21)
    const r = await resolveOpenLoop(l.id)
    expect(r.status).toBe('taken-care-of')
    expect(r.resolvedAt).toBeDefined()
    expect(await listOpenLoops()).toHaveLength(0)
    expect((await listTakenCareOf()).map((x) => x.id)).toEqual([l.id])
    const back = await reopenOpenLoop(l.id)
    expect(back.status).toBe('open')
    expect(back).not.toHaveProperty('resolvedAt')
  })

  it('stays usable with hundreds of loops and counts only the open ones', async () => {
    for (let i = 0; i < 300; i++) await createOpenLoop({ title: `loop ${i}` })
    const first = (await listOpenLoops())[0]
    await resolveOpenLoop(first.id)
    expect(await countOpenLoops()).toBe(299)
  })

  it('updates and clears optional fields', async () => {
    const l = await createOpenLoop({ title: 'a', note: 'n', date: '2026-09-30' })
    const u = await updateOpenLoop(l.id, { title: 'b', note: null, date: null })
    expect(u.title).toBe('b')
    expect(u).not.toHaveProperty('note')
    expect(u).not.toHaveProperty('date')
  })

  it('deleting is permanent but returns the record for Undo', async () => {
    const l = await createOpenLoop({ title: 'a' })
    const removed = await deleteOpenLoop(l.id)
    expect(await getOpenLoop(l.id)).toBeUndefined()
    await restoreOpenLoop(removed)
    expect(await getOpenLoop(l.id)).toEqual(l)
  })
})

describe('convertOpenLoopToTask', () => {
  it('creates the task and removes the loop: no duplicate, no link', async () => {
    const l = await createOpenLoop({ title: 'Book appointment', note: 'ask about passport', date: '2026-09-22' })
    const t = await convertOpenLoopToTask(l.id, { priority: 2, time: '10:00' })
    expect(t).toMatchObject({ title: 'Book appointment', note: 'ask about passport', date: '2026-09-22', priority: 2, time: '10:00', status: 'active' })
    expect(t.id).not.toBe(l.id)
    expect(await getOpenLoop(l.id)).toBeUndefined()
    expect(await getTask(t.id)).toBeDefined()
    expect(await countOpenLoops()).toBe(0)
  })

  it('lets the details override the loop\'s date', async () => {
    const l = await createOpenLoop({ title: 'a', date: '2026-09-22' })
    expect((await convertOpenLoopToTask(l.id, { date: '2026-09-25' })).date).toBe('2026-09-25')
  })

  it('changes nothing if the conversion fails', async () => {
    const l = await createOpenLoop({ title: 'a' })
    await expect(convertOpenLoopToTask(l.id, { priority: 0 })).rejects.toMatchObject({ code: 'invalid-input' })
    expect(await getOpenLoop(l.id)).toBeDefined()
    expect(await db.tasks.count()).toBe(0)
  })
})
