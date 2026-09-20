import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlannerDB } from '../db/db'
import { createGoal } from './goals'
import { createOpenLoop, resolveOpenLoop } from './openLoops'
import { saveReflection } from './reflections'
import { checkRitual, createRitual } from './rituals'
import { searchPlanner } from './search'
import { completeTask, createTask, markTaskNoLongerRelevant } from './tasks'
import { closeDomain, freshDomain, setNow } from './testHelpers'

let db: PlannerDB
beforeEach(async () => { db = await freshDomain() })
afterEach(() => closeDomain(db))

const titles = async (q: string, f?: Parameters<typeof searchPlanner>[1]) => (await searchPlanner(q, f)).map((r) => r.title || `(${r.kind})`)

describe('ranking (PRD 14): exact title, then title, then note or content, then more recent', () => {
  it('orders exact title matches before title matches before note matches', async () => {
    await createTask({ title: 'Book appointment', note: 'ask about passport' })
    await createTask({ title: 'Renew passport online' })
    await createOpenLoop({ title: 'passport' })
    const r = await searchPlanner('passport')
    expect(r.map((x) => [x.title, x.match])).toEqual([
      ['passport', 'exact'],
      ['Renew passport online', 'title'],
      ['Book appointment', 'content'],
    ])
  })

  it('puts the more recent record first within the same kind of match', async () => {
    setNow(2026, 9, 1)
    await createTask({ title: 'Passport photos' })
    setNow(2026, 9, 15)
    await createTask({ title: 'Passport forms' })
    expect(await titles('passport')).toEqual(['Passport forms', 'Passport photos'])
  })

  it('is case- and accent-insensitive and needs every word to appear', async () => {
    await createTask({ title: 'Café with Sam' })
    await createTask({ title: 'Cafe only' })
    expect(await titles('CAFE sam')).toEqual(['Café with Sam'])
    expect(await titles('cafe')).toHaveLength(2)
    expect(await titles('cafe nothing')).toEqual([])
  })

  it('gives content matches a short excerpt around the match', async () => {
    await createTask({ title: 'Errand', note: `${'lorem '.repeat(30)}the passport appointment is booked ${'ipsum '.repeat(30)}` })
    const [r] = await searchPlanner('passport')
    expect(r.match).toBe('content')
    expect(r.snippet).toContain('passport appointment')
    expect(r.snippet!.length).toBeLessThan(200)
    expect(r.snippet!.startsWith('…')).toBe(true)
  })
})

describe('what is searched', () => {
  it('finds tasks (any status), open loops, taken-care-of items, rituals, goals and reflections', async () => {
    const done = await createTask({ title: 'passport done' })
    await completeTask(done.id)
    const nlr = await createTask({ title: 'passport dropped' })
    await markTaskNoLongerRelevant(nlr.id)
    await createOpenLoop({ title: 'passport open' })
    const loop = await createOpenLoop({ title: 'passport resolved' })
    await resolveOpenLoop(loop.id)
    await createRitual({ name: 'passport ritual', frequency: { type: 'daily' } })
    await createGoal({ title: 'passport goal', scope: 'year', forDate: '2026-09-20' })
    await saveReflection('day', '2026-09-20', 'Thinking about the passport today')
    const kinds = (await searchPlanner('passport')).map((r) => r.kind).sort()
    expect(kinds).toEqual(['goal', 'open-loop', 'reflection', 'ritual', 'taken-care-of', 'task', 'task'])
  })

  it('searches notes and descriptions, and reflections only by content', async () => {
    await createOpenLoop({ title: 'Loop', note: 'contains widget' })
    await createGoal({ title: 'Goal', description: 'a widget goal', scope: 'month', forDate: '2026-09-20' })
    await saveReflection('week', '2026-09-20', 'widget week')
    expect((await searchPlanner('widget')).map((r) => r.kind).sort()).toEqual(['goal', 'open-loop', 'reflection'])
  })

  it('reports ritual history: how many days were recorded', async () => {
    const r = await createRitual({ name: 'Smoke-free', frequency: { type: 'daily' } })
    for (const d of ['2026-09-18', '2026-09-19', '2026-09-20']) await checkRitual(r.id, d)
    const [hit] = await searchPlanner('smoke')
    expect(hit.kind === 'ritual' && hit.recordedDays).toBe(3)
  })
})

describe('filters', () => {
  beforeEach(async () => {
    await createTask({ title: 'passport task', date: '2026-09-10' })
    await createTask({ title: 'passport later', date: '2026-10-05' })
    await createOpenLoop({ title: 'passport loop' })
  })

  it('limits by type', async () => {
    expect(await titles('passport', { kinds: ['open-loop'] })).toEqual(['passport loop'])
    expect((await searchPlanner('passport', { kinds: ['task'] })).every((r) => r.kind === 'task')).toBe(true)
  })

  it('limits by time scope: past is before today, upcoming is today or later', async () => {
    expect(await titles('passport', { time: 'past' })).toEqual(['passport task'])
    expect((await titles('passport', { time: 'upcoming' })).sort()).toEqual(['passport later', 'passport loop'])
  })

  it('limits by date range, inclusive', async () => {
    expect(await titles('passport', { from: '2026-09-10', to: '2026-09-15' })).toEqual(['passport task'])
  })
})

describe('status filter', () => {
  it('separates open, done and set-aside across kinds, and leaves reflections out', async () => {
    const done = await createTask({ title: 'x done' })
    await completeTask(done.id)
    const nlr = await createTask({ title: 'x dropped' })
    await markTaskNoLongerRelevant(nlr.id)
    await createTask({ title: 'x active' })
    const loop = await createOpenLoop({ title: 'x resolved' })
    await resolveOpenLoop(loop.id)
    await createOpenLoop({ title: 'x open loop' })
    await saveReflection('day', '2026-09-20', 'x reflection')
    expect((await titles('x', { status: 'open' })).sort()).toEqual(['x active', 'x open loop'])
    expect((await titles('x', { status: 'done' })).sort()).toEqual(['x done', 'x resolved'])
    expect(await titles('x', { status: 'set-aside' })).toEqual(['x dropped'])
  })
})

describe('empty query', () => {
  it('lists everything the filters allow, newest first, so a long list can be browsed', async () => {
    setNow(2026, 9, 1)
    await createOpenLoop({ title: 'older loop' })
    setNow(2026, 9, 10)
    await createOpenLoop({ title: 'newer loop' })
    await createTask({ title: 'a task' })
    const r = await searchPlanner('', { kinds: ['open-loop'] })
    expect(r.map((x) => x.title)).toEqual(['newer loop', 'older loop'])
    expect(r.every((x) => x.match === 'none')).toBe(true)
  })

  it('stays usable with hundreds of open loops', async () => {
    for (let i = 0; i < 300; i++) await createOpenLoop({ title: `loop number ${i}` })
    expect(await searchPlanner('number 299')).toHaveLength(1)
    expect((await searchPlanner('loop', { kinds: ['open-loop'] })).length).toBe(300)
  })
})
