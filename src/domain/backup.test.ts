import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import { createBackup, lastBackupAt, parseBackup, recordBackup, restoreBackup } from './backup'
import { createGoal } from './goals'
import { createOpenLoop } from './openLoops'
import { saveReflection } from './reflections'
import { checkRitual, createRitual } from './rituals'
import { createTask } from './tasks'
import { closeDomain, freshDomain } from './testHelpers'

let db: PlannerDB
beforeEach(async () => { db = await freshDomain() })
afterEach(() => closeDomain(db))

async function seed() {
  await createTask({ title: 'A task', note: 'n', date: '2026-09-20', priority: 1 })
  await createOpenLoop({ title: 'A loop' })
  const r = await createRitual({ name: 'Walk', frequency: { type: 'daily' } })
  await checkRitual(r.id, '2026-09-20')
  await createGoal({ title: 'G', scope: 'year', forDate: '2026-09-20' })
  await saveReflection('day', '2026-09-20', 'text')
}

describe('backup round trip', () => {
  it('exports everything and restores it into an empty planner', async () => {
    await seed()
    const text = JSON.stringify(await createBackup())
    await Promise.all([db.tasks.clear(), db.openLoops.clear(), db.rituals.clear(), db.checkins.clear(), db.goals.clear(), db.reflections.clear()])
    expect(await db.tasks.count()).toBe(0)
    const summary = await restoreBackup(parseBackup(text))
    expect(summary).toEqual({ tasks: 1, openLoops: 1, rituals: 1, goals: 1, reflections: 1 })
    expect(await db.checkins.count()).toBe(1)
  })

  it('replaces rather than merges', async () => {
    await seed()
    const text = JSON.stringify(await createBackup())
    await createTask({ title: 'Made after the backup' })
    await restoreBackup(parseBackup(text))
    expect((await db.tasks.toArray()).map((t) => t.title)).toEqual(['A task'])
  })

  it('records the last backup, keeps it across a restore and leaves it out of the file', async () => {
    expect(await lastBackupAt()).toBeUndefined()
    await recordBackup('2026-09-20T10:00:00.000Z')
    const backup = await createBackup()
    expect(backup.data.settings).toEqual([])
    await restoreBackup(backup)
    expect(await lastBackupAt()).toBe('2026-09-20T10:00:00.000Z')
  })
})

describe('an invalid backup changes nothing', () => {
  const good = async () => JSON.parse(JSON.stringify(await createBackup())) as any // eslint-disable-line

  const rejects = async (text: string) => {
    const before = JSON.stringify((await createBackup()).data)
    expect(() => parseBackup(text)).toThrow(/current data hasn't been changed/)
    expect(JSON.stringify((await createBackup()).data)).toBe(before)
  }

  it('rejects text that is not JSON or not a backup', async () => {
    await seed()
    await rejects('not json')
    await rejects('[]')
    await rejects('{"data":1}')
  })

  it('rejects a newer schema version', async () => {
    await seed()
    const b = await good()
    b.schemaVersion = 99
    await rejects(JSON.stringify(b))
  })

  it('rejects one bad record anywhere in the file', async () => {
    await seed()
    const b = await good()
    b.data.tasks[0].status = 'weird'
    await rejects(JSON.stringify(b))
  })

  it('rejects missing tables, duplicate ids, orphan check-ins and duplicate periods', async () => {
    await seed()
    const missing = await good()
    delete missing.data.goals
    await rejects(JSON.stringify(missing))
    const dup = await good()
    dup.data.tasks.push(dup.data.tasks[0])
    await rejects(JSON.stringify(dup))
    const orphan = await good()
    orphan.data.checkins[0].ritualId = 'nope'
    await rejects(JSON.stringify(orphan))
    const twice = await good()
    twice.data.reflections.push({ ...twice.data.reflections[0], id: 'other' })
    await rejects(JSON.stringify(twice))
  })

  it('a failing write rolls the whole restore back', async () => {
    await seed()
    const before = JSON.stringify((await createBackup()).data)
    const b = parseBackup(JSON.stringify(await createBackup()))
    const original = db.goals.bulkAdd.bind(db.goals)
    db.goals.bulkAdd = (() => Promise.reject(new Error('disk'))) as never
    await expect(restoreBackup(b)).rejects.toThrow(/current data hasn't been changed/)
    db.goals.bulkAdd = original
    expect(JSON.stringify((await createBackup()).data)).toBe(before)
  })
})
