import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import {
  completeTask, countDayPriorities, createTask, deleteTask, getDayPriorities, getDayTasks, getTask,
  getUnfinishedFromEarlier, markTaskNoLongerRelevant, moveTask, moveTaskToToday, reopenTask, restoreTask,
  shouldConfirmPriority, updateTask,
} from './tasks'
import { closeDomain, freshDomain, setNow } from './testHelpers'

let db: PlannerDB
beforeEach(async () => { db = await freshDomain() })
afterEach(() => closeDomain(db))

describe('createTask', () => {
  it('needs only a title and starts active', async () => {
    const t = await createTask({ title: '  Book dentist  ' })
    expect(t).toMatchObject({ title: 'Book dentist', status: 'active' })
    expect(t.date).toBeUndefined()
    expect(t.priority).toBeUndefined()
    expect(t.completedAt).toBeUndefined()
  })

  it('rejects an empty title, bad dates/times and non-integer priorities', async () => {
    await expect(createTask({ title: '   ' })).rejects.toMatchObject({ code: 'invalid-input' })
    await expect(createTask({ title: 'x', date: '2026-02-30' })).rejects.toMatchObject({ code: 'invalid-input' })
    await expect(createTask({ title: 'x', time: '25:00' })).rejects.toMatchObject({ code: 'invalid-input' })
    await expect(createTask({ title: 'x', priority: 0 })).rejects.toMatchObject({ code: 'invalid-input' })
    await expect(createTask({ title: 'x', priority: 1.5 })).rejects.toMatchObject({ code: 'invalid-input' })
  })
})

describe('completion', () => {
  it('records completedAt, keeps the original date, and reopening clears it', async () => {
    const t = await createTask({ title: 'Send invoice', date: '2026-09-20' })
    const done = await completeTask(t.id)
    expect(done.status).toBe('completed')
    expect(done.completedAt).toBeDefined()
    expect(done.date).toBe('2026-09-20')
    const again = await reopenTask(t.id)
    expect(again.status).toBe('active')
    expect(again.completedAt).toBeUndefined()
  })

  it('completing twice changes nothing', async () => {
    const t = await createTask({ title: 'a' })
    const first = await completeTask(t.id)
    setNow(2026, 9, 21)
    expect(await completeTask(t.id)).toEqual(first)
  })

  it('a no-longer-relevant task is not completable until reopened', async () => {
    const t = await createTask({ title: 'a' })
    await markTaskNoLongerRelevant(t.id)
    await expect(completeTask(t.id)).rejects.toMatchObject({ code: 'invalid-state' })
    await reopenTask(t.id)
    expect((await completeTask(t.id)).status).toBe('completed')
  })
})

describe('moving', () => {
  it('leaves the old date immediately and can repeat freely', async () => {
    const t = await createTask({ title: 'Reply to Jack', date: '2026-09-20' })
    await moveTask(t.id, '2026-09-22')
    await moveTask(t.id, '2026-09-25')
    await moveTask(t.id, '2026-09-22')
    expect(await getDayTasks('2026-09-20')).toHaveLength(0)
    expect((await getDayTasks('2026-09-22')).map((x) => x.id)).toEqual([t.id])
  })

  it('cannot move a completed task', async () => {
    const t = await createTask({ title: 'a', date: '2026-09-20' })
    await completeTask(t.id)
    await expect(moveTask(t.id, '2026-09-21')).rejects.toMatchObject({ code: 'invalid-state' })
  })

  it('"Complete today" moves to today, keeps the priority, and does not complete it', async () => {
    const t = await createTask({ title: 'a', date: '2026-09-19', priority: 2 })
    setNow(2026, 9, 20)
    const moved = await moveTaskToToday(t.id)
    expect(moved).toMatchObject({ date: '2026-09-20', priority: 2, status: 'active' })
    expect(moved.completedAt).toBeUndefined()
  })
})

describe('delete and undo', () => {
  it('removes the task permanently and returns it so Undo can restore it', async () => {
    const t = await createTask({ title: 'a', date: '2026-09-20', priority: 1 })
    const removed = await deleteTask(t.id)
    expect(await getTask(t.id)).toBeUndefined()
    await restoreTask(removed)
    expect(await getTask(t.id)).toEqual(t)
  })

  it('reports a calm not-found error', async () => {
    await expect(deleteTask('nope')).rejects.toMatchObject({ code: 'not-found', message: expect.stringContaining("couldn't be found") })
  })
})

describe('updateTask', () => {
  it('sets, changes and clears optional fields', async () => {
    const t = await createTask({ title: 'a', date: '2026-09-20', time: '09:00', note: 'n', priority: 3 })
    const u = await updateTask(t.id, { date: null, time: null, note: null, priority: null, title: 'b' })
    expect(u.title).toBe('b')
    expect(u).not.toHaveProperty('date')
    expect(u).not.toHaveProperty('time')
    expect(u).not.toHaveProperty('note')
    expect(u).not.toHaveProperty('priority')
  })
})

describe('priorities: P1 is highest, levels can be shared, five is only a gentle prompt', () => {
  it('orders a day by level and allows shared levels', async () => {
    const c = await createTask({ title: 'c', date: '2026-09-20', priority: 3 })
    const a = await createTask({ title: 'a', date: '2026-09-20', priority: 1 })
    const b1 = await createTask({ title: 'b1', date: '2026-09-20', priority: 2 })
    const b2 = await createTask({ title: 'b2', date: '2026-09-20', priority: 2 })
    expect((await getDayPriorities('2026-09-20')).map((t) => t.id)).toEqual([a.id, b1.id, b2.id, c.id])
  })

  it('never blocks more than five, and asks only when adding a sixth', async () => {
    for (let i = 0; i < 5; i++) {
      expect(await shouldConfirmPriority('2026-09-20')).toBe(false)
      await createTask({ title: `p${i}`, date: '2026-09-20', priority: i + 1 })
    }
    expect(await shouldConfirmPriority('2026-09-20')).toBe(true)
    const sixth = await createTask({ title: 'sixth', date: '2026-09-20', priority: 6 })
    expect(sixth.priority).toBe(6)
    expect(await countDayPriorities('2026-09-20')).toBe(6)
  })

  it('does not ask when changing the level of a task that already counts', async () => {
    const tasks = []
    for (let i = 0; i < 6; i++) tasks.push(await createTask({ title: `p${i}`, date: '2026-09-20', priority: i + 1 }))
    expect(await shouldConfirmPriority('2026-09-20', tasks[0].id)).toBe(false)
  })

  it('counts per day, and includes completed priorities but not no-longer-relevant ones', async () => {
    const a = await createTask({ title: 'a', date: '2026-09-20', priority: 1 })
    const b = await createTask({ title: 'b', date: '2026-09-20', priority: 1 })
    await createTask({ title: 'other day', date: '2026-09-21', priority: 1 })
    await completeTask(a.id)
    expect(await countDayPriorities('2026-09-20')).toBe(2)
    await markTaskNoLongerRelevant(b.id)
    expect(await countDayPriorities('2026-09-20')).toBe(1)
    expect(await countDayPriorities('2026-09-21')).toBe(1)
  })

  it('keeps tasks without a priority out of Priorities and priorities out of Tasks', async () => {
    const p = await createTask({ title: 'p', date: '2026-09-20', priority: 1 })
    const n = await createTask({ title: 'n', date: '2026-09-20' })
    expect((await getDayPriorities('2026-09-20')).map((t) => t.id)).toEqual([p.id])
    expect((await getDayTasks('2026-09-20')).map((t) => t.id)).toEqual([n.id])
  })
})

describe('carry-over to the next day', () => {
  it('lists unfinished tasks from earlier dates without changing them', async () => {
    const y = await createTask({ title: 'yesterday', date: '2026-09-19', priority: 2 })
    const old = await createTask({ title: 'older', date: '2026-09-10' })
    const done = await createTask({ title: 'done', date: '2026-09-19' })
    await completeTask(done.id)
    await createTask({ title: 'today', date: '2026-09-20' })
    await createTask({ title: 'undated' })
    const list = await getUnfinishedFromEarlier('2026-09-20')
    expect(list.map((t) => t.id)).toEqual([old.id, y.id])
    expect(await getTask(y.id)).toMatchObject({ date: '2026-09-19', priority: 2, status: 'active' })
  })

  it('carried-over tasks do not count toward today until they are brought to today', async () => {
    const y = await createTask({ title: 'yesterday', date: '2026-09-19', priority: 1 })
    expect(await countDayPriorities('2026-09-20')).toBe(0)
    expect(await countDayPriorities('2026-09-19')).toBe(1)
    await moveTaskToToday(y.id)
    expect(await countDayPriorities('2026-09-20')).toBe(1)
    expect(await countDayPriorities('2026-09-19')).toBe(0)
  })

  it('moving into a full day is never questioned by the domain', async () => {
    for (let i = 0; i < 5; i++) await createTask({ title: `p${i}`, date: '2026-09-20', priority: 1 })
    const y = await createTask({ title: 'y', date: '2026-09-19', priority: 1 })
    await expect(moveTaskToToday(y.id)).resolves.toMatchObject({ date: '2026-09-20' })
    expect(await countDayPriorities('2026-09-20')).toBe(6)
  })
})

describe('undated priority tasks', () => {
  it('show on every day from their creation date onward, not before', async () => {
    setNow(2026, 9, 20)
    const t = await createTask({ title: 'someday', priority: 2 })
    expect((await getDayPriorities('2026-09-19')).map((x) => x.id)).toEqual([])
    expect((await getDayPriorities('2026-09-20')).map((x) => x.id)).toEqual([t.id])
    expect((await getDayPriorities('2026-12-31')).map((x) => x.id)).toEqual([t.id])
  })

  it('count toward each day\'s five', async () => {
    await createTask({ title: 'u', priority: 1 })
    await createTask({ title: 'd', date: '2026-09-25', priority: 1 })
    expect(await countDayPriorities('2026-09-25')).toBe(2)
    expect(await countDayPriorities('2026-09-26')).toBe(1)
  })

  it('once completed, show checked only on the day they were completed', async () => {
    const t = await createTask({ title: 'u', priority: 1 })
    setNow(2026, 9, 22)
    await completeTask(t.id)
    expect((await getDayPriorities('2026-09-22')).map((x) => x.id)).toEqual([t.id])
    expect(await getDayPriorities('2026-09-23')).toHaveLength(0)
    expect(await getDayPriorities('2026-09-21')).toHaveLength(0)
  })

  it('stop showing when no longer relevant, and never appear as carried over', async () => {
    const t = await createTask({ title: 'u', priority: 1 })
    expect(await getUnfinishedFromEarlier('2026-12-31')).toHaveLength(0)
    await markTaskNoLongerRelevant(t.id)
    expect(await getDayPriorities('2026-09-21')).toHaveLength(0)
  })
})

describe('undated tasks without a priority', () => {
  it('appear on every day from creation, below all dated tasks, until finished or removed', async () => {
    const someday = await createTask({ title: 'someday' })
    const today = await createTask({ title: 'today', date: '2026-09-20' })
    const timed = await createTask({ title: 'timed', date: '2026-09-20', time: '09:00' })
    expect((await getDayTasks('2026-09-20')).map((t) => t.id)).toEqual([timed.id, today.id, someday.id])
    expect((await getDayTasks('2026-10-15')).map((t) => t.id)).toEqual([someday.id])
    expect(await getDayTasks('2026-09-19')).toHaveLength(0) // not before it was created
  })

  it('show checked only on the day they were completed, then stop', async () => {
    const t = await createTask({ title: 'someday' })
    setNow(2026, 9, 23)
    await completeTask(t.id)
    expect((await getDayTasks('2026-09-23')).map((x) => x.id)).toEqual([t.id])
    expect(await getDayTasks('2026-09-24')).toHaveLength(0)
  })

  it('stop when no longer relevant or deleted, are not counted as priorities, and are not carried over', async () => {
    const a = await createTask({ title: 'a' })
    const b = await createTask({ title: 'b' })
    expect(await countDayPriorities('2026-09-21')).toBe(0)
    expect(await getUnfinishedFromEarlier('2026-12-31')).toHaveLength(0)
    await markTaskNoLongerRelevant(a.id)
    await deleteTask(b.id)
    expect(await getDayTasks('2026-09-21')).toHaveLength(0)
  })
})

describe('completed priorities', () => {
  it('stay visible but sink to the bottom of the day\'s priorities', async () => {
    const p1 = await createTask({ title: 'p1', date: '2026-09-20', priority: 1 })
    const p2 = await createTask({ title: 'p2', date: '2026-09-20', priority: 2 })
    const p3 = await createTask({ title: 'p3', date: '2026-09-20', priority: 3 })
    await completeTask(p1.id)
    expect((await getDayPriorities('2026-09-20')).map((t) => t.id)).toEqual([p2.id, p3.id, p1.id])
    await reopenTask(p1.id)
    expect((await getDayPriorities('2026-09-20')).map((t) => t.id)).toEqual([p1.id, p2.id, p3.id])
  })
})
