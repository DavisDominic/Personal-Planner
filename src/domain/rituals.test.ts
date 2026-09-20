import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import {
  archiveRitual, checkRitual, countRecordedDays, createRitual, getCheckinsOn, getRitualCheckins, isRitualDueOn,
  listRituals, restoreRitual, updateRitual,
} from './rituals'
import { closeDomain, freshDomain } from './testHelpers'

let db: PlannerDB
beforeEach(async () => { db = await freshDomain() })
afterEach(() => closeDomain(db))

describe('rituals', () => {
  it('validates name and custom weekdays', async () => {
    await expect(createRitual({ name: ' ', frequency: { type: 'daily' } })).rejects.toMatchObject({ code: 'invalid-input' })
    await expect(createRitual({ name: 'Walk', frequency: { type: 'custom', days: [] } })).rejects.toMatchObject({ code: 'invalid-input' })
    await expect(createRitual({ name: 'Walk', frequency: { type: 'custom', days: [7] } })).rejects.toMatchObject({ code: 'invalid-input' })
    const r = await createRitual({ name: 'Walk', frequency: { type: 'custom', days: [5, 1, 1] } })
    expect(r.frequency).toEqual({ type: 'custom', days: [1, 5] })
  })

  it('one tap checks in, the second tap toggles it off; each check-in is its own record', async () => {
    const r = await createRitual({ name: 'Smoke-free', frequency: { type: 'daily' } })
    expect(await checkRitual(r.id, '2026-09-20')).toEqual({ checked: true })
    expect(await checkRitual(r.id, '2026-09-21')).toEqual({ checked: true })
    expect(await countRecordedDays(r.id)).toBe(2)
    expect(await checkRitual(r.id, '2026-09-20')).toEqual({ checked: false })
    expect((await getRitualCheckins(r.id)).map((c) => c.date)).toEqual(['2026-09-21'])
  })

  it('checks in for today by default', async () => {
    const r = await createRitual({ name: 'Walk', frequency: { type: 'daily' } })
    await checkRitual(r.id)
    expect((await getCheckinsOn('2026-09-20')).map((c) => c.ritualId)).toEqual([r.id])
  })

  it('a lapse changes nothing: earlier progress stays and no record is created', async () => {
    const r = await createRitual({ name: 'Smoke-free', frequency: { type: 'daily' } })
    await checkRitual(r.id, '2026-01-01')
    await checkRitual(r.id, '2026-01-02')
    expect(await countRecordedDays(r.id)).toBe(2)
    expect(await db.checkins.count()).toBe(2)
  })

  it('changing frequency never rewrites history', async () => {
    const r = await createRitual({ name: 'Walk', frequency: { type: 'daily' } })
    await checkRitual(r.id, '2026-09-19') // a Saturday
    const before = await getRitualCheckins(r.id)
    await updateRitual(r.id, { frequency: { type: 'custom', days: [1] } })
    expect(await getRitualCheckins(r.id)).toEqual(before)
  })

  it('archiving keeps check-ins; archived rituals can be listed and restored; they cannot be checked', async () => {
    const r = await createRitual({ name: 'Walk', frequency: { type: 'daily' } })
    await checkRitual(r.id, '2026-09-20')
    await archiveRitual(r.id)
    expect(await listRituals()).toHaveLength(0)
    expect((await listRituals({ archived: true })).map((x) => x.id)).toEqual([r.id])
    expect(await countRecordedDays(r.id)).toBe(1)
    await expect(checkRitual(r.id, '2026-09-21')).rejects.toMatchObject({ code: 'invalid-state' })
    const back = await restoreRitual(r.id)
    expect(back).not.toHaveProperty('archivedAt')
    expect(await listRituals()).toHaveLength(1)
    expect(await checkRitual(r.id, '2026-09-21')).toEqual({ checked: true })
  })

  it('reports which days a frequency lists', async () => {
    const mk = (frequency: Parameters<typeof createRitual>[0]['frequency']) => createRitual({ name: 'x', frequency })
    const daily = await mk({ type: 'daily' })
    const weekly = await mk({ type: 'weekly' })
    const weekends = await mk({ type: 'weekends' })
    const custom = await mk({ type: 'custom', days: [1, 3] })
    const sat = '2026-09-19', sun = '2026-09-20', mon = '2026-09-21', tue = '2026-09-22', wed = '2026-09-23'
    expect([sat, mon].map((d) => isRitualDueOn(daily, d))).toEqual([true, true])
    expect([sat, wed].map((d) => isRitualDueOn(weekly, d))).toEqual([true, true])
    expect([sat, sun, mon].map((d) => isRitualDueOn(weekends, d))).toEqual([true, true, false])
    expect([mon, tue, wed].map((d) => isRitualDueOn(custom, d))).toEqual([true, false, true])
  })
})
