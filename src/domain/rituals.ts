import { db, newId, nowTimestamp, today } from './context'
import { assertDate, dayOfWeek } from './dates'
import { badState, invalid, notFound } from './errors'
import type { DateString, Ritual, RitualCheckin, RitualFrequency } from './types'

export type NewRitual = { name: string; frequency: RitualFrequency }
export type RitualPatch = { name?: string; frequency?: RitualFrequency }

const cleanName = (name: string) => {
  const n = name.trim()
  if (!n) throw invalid('A ritual needs a name.')
  return n
}

function cleanFrequency(f: RitualFrequency): RitualFrequency {
  if (f.type !== 'custom') return { type: f.type }
  const days = [...new Set(f.days)].sort((a, b) => a - b)
  if (days.length === 0 || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
    throw invalid('Choose at least one weekday.')
  }
  return { type: 'custom', days }
}

async function requireRitual(id: string): Promise<Ritual> {
  const ritual = await db().rituals.get(id)
  if (!ritual) throw notFound('ritual')
  return ritual
}

/* --------------------------------------------------------------- commands */

export async function createRitual(input: NewRitual): Promise<Ritual> {
  const ritual: Ritual = {
    id: newId(),
    name: cleanName(input.name),
    frequency: cleanFrequency(input.frequency),
    createdAt: nowTimestamp(),
  }
  await db().rituals.add(ritual)
  return ritual
}

/** Changing a frequency never touches existing check-ins: history is not rewritten. */
export async function updateRitual(id: string, patch: RitualPatch): Promise<Ritual> {
  return db().transaction('rw', db().rituals, async () => {
    const ritual = await requireRitual(id)
    const next: Ritual = {
      ...ritual,
      name: patch.name === undefined ? ritual.name : cleanName(patch.name),
      frequency: patch.frequency === undefined ? ritual.frequency : cleanFrequency(patch.frequency),
    }
    await db().rituals.put(next)
    return next
  })
}

/**
 * One-tap check-in for a date (default today). A second call for the same ritual and date toggles it
 * off. Each check-in is its own record. Works on any date, including ones the frequency doesn't list.
 */
export async function checkRitual(ritualId: string, date: DateString = today()): Promise<{ checked: boolean }> {
  assertDate(date)
  return db().transaction('rw', db().rituals, db().checkins, async () => {
    const ritual = await requireRitual(ritualId)
    if (ritual.archivedAt) throw badState('Restore this ritual to check in.')
    const existing = await db().checkins.where('[ritualId+date]').equals([ritualId, date]).first()
    if (existing) {
      await db().checkins.delete(existing.id)
      return { checked: false }
    }
    await db().checkins.add({ id: newId(), ritualId, date, completedAt: nowTimestamp() })
    return { checked: true }
  })
}

/** Archives a ritual. Its check-ins stay. */
export async function archiveRitual(id: string): Promise<Ritual> {
  return db().transaction('rw', db().rituals, async () => {
    const ritual = await requireRitual(id)
    if (ritual.archivedAt) return ritual
    const next = { ...ritual, archivedAt: nowTimestamp() }
    await db().rituals.put(next)
    return next
  })
}

export async function restoreRitual(id: string): Promise<Ritual> {
  return db().transaction('rw', db().rituals, async () => {
    const next: Ritual = { ...(await requireRitual(id)) }
    delete next.archivedAt
    await db().rituals.put(next)
    return next
  })
}

/* ---------------------------------------------------------------- queries */

export const getRitual = (id: string) => db().rituals.get(id)

export async function listRituals(options: { archived?: boolean } = {}): Promise<Ritual[]> {
  const all = await db().rituals.toArray()
  return all
    .filter((r) => (options.archived ? r.archivedAt !== undefined : r.archivedAt === undefined))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/**
 * Whether a ritual's frequency lists this date. Weekly means "once a week, any day", so every day
 * lists it. This only decides what the Day shows; check-ins are accepted on any date.
 */
export function isRitualDueOn(ritual: Ritual, date: DateString): boolean {
  const dow = dayOfWeek(date)
  switch (ritual.frequency.type) {
    case 'daily':
    case 'weekly':
      return true
    case 'weekends':
      return dow === 0 || dow === 6
    case 'custom':
      return ritual.frequency.days.includes(dow)
  }
}

/** Check-ins recorded on a date, for the Day's "2 of 4 checked". */
export const getCheckinsOn = (date: DateString): Promise<RitualCheckin[]> =>
  db().checkins.where('date').equals(assertDate(date)).toArray()

export const getRitualCheckins = async (ritualId: string): Promise<RitualCheckin[]> =>
  (await db().checkins.where('ritualId').equals(ritualId).toArray()).sort((a, b) => a.date.localeCompare(b.date))

/** Factual count for lines like "Smoke-free — 22 recorded days". A lapse never lowers earlier progress. */
export const countRecordedDays = (ritualId: string) => db().checkins.where('ritualId').equals(ritualId).count()
