import { db, nowTimestamp } from './context'
import { isDateString } from './dates'
import { DomainError } from './errors'
import type { Goal, OpenLoop, Reflection, Ritual, RitualCheckin, Setting, Task } from './types'

/** Bump when the shape of stored data changes. A backup from a newer version is refused, never guessed at. */
export const SCHEMA_VERSION = 1
export const APPLICATION_VERSION = '0.1.0'

const LAST_BACKUP_KEY = 'lastBackupAt'

export type Backup = {
  schemaVersion: number
  exportedAt: string
  applicationVersion: string
  data: {
    tasks: Task[]
    openLoops: OpenLoop[]
    rituals: Ritual[]
    checkins: RitualCheckin[]
    goals: Goal[]
    reflections: Reflection[]
    settings: Setting[]
  }
}

/** Everything the planner holds (PRD 21). "Last backup" is per device, so it is not part of a backup. */
export async function createBackup(): Promise<Backup> {
  const d = db()
  const [tasks, openLoops, rituals, checkins, goals, reflections, settings] = await Promise.all([
    d.tasks.toArray(),
    d.openLoops.toArray(),
    d.rituals.toArray(),
    d.checkins.toArray(),
    d.goals.toArray(),
    d.reflections.toArray(),
    d.settings.toArray(),
  ])
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowTimestamp(),
    applicationVersion: APPLICATION_VERSION,
    data: { tasks, openLoops, rituals, checkins, goals, reflections, settings: settings.filter((s) => s.key !== LAST_BACKUP_KEY) },
  }
}

/** Notes that a backup was saved, for "Last backup" in Settings. Call once the file has actually been handed over. */
export async function recordBackup(when: string = nowTimestamp()): Promise<void> {
  await db().settings.put({ key: LAST_BACKUP_KEY, value: when })
}

/** When the last backup was saved on this device, or undefined if none has been. */
export async function lastBackupAt(): Promise<string | undefined> {
  const s = await db().settings.get(LAST_BACKUP_KEY)
  return typeof s?.value === 'string' ? s.value : undefined
}

const COULD_NOT_IMPORT = "This backup couldn't be imported. Your current data hasn't been changed."
const fail = (reason: string): never => {
  throw new DomainError('invalid-input', `${COULD_NOT_IMPORT} ${reason}`)
}

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string' && v !== ''
const isTime = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && isDateString(v)
const optional = (v: unknown, ok: (x: unknown) => boolean) => v === undefined || ok(v)
const isText = (v: unknown) => typeof v === 'string'

type Check = (r: Rec) => boolean
const CHECKS: Record<Exclude<keyof Backup['data'], 'settings'>, { label: string; ok: Check }> = {
  tasks: {
    label: 'tasks',
    ok: (r) =>
      isStr(r.id) &&
      isText(r.title) &&
      optional(r.note, isText) &&
      optional(r.date, isDay) &&
      optional(r.time, (x) => typeof x === 'string' && /^\d{2}:\d{2}$/.test(x)) &&
      optional(r.priority, (x) => Number.isInteger(x) && (x as number) >= 1) &&
      ['active', 'completed', 'no-longer-relevant'].includes(r.status as string) &&
      isTime(r.createdAt) &&
      isTime(r.updatedAt) &&
      optional(r.completedAt, isTime),
  },
  openLoops: {
    label: 'open loops',
    ok: (r) =>
      isStr(r.id) &&
      isText(r.title) &&
      optional(r.note, isText) &&
      optional(r.date, isDay) &&
      ['open', 'taken-care-of'].includes(r.status as string) &&
      isTime(r.createdAt) &&
      isTime(r.updatedAt) &&
      optional(r.resolvedAt, isTime),
  },
  rituals: {
    label: 'rituals',
    ok: (r) => {
      const f = r.frequency
      const freq =
        isRec(f) &&
        (['daily', 'weekly', 'weekends'].includes(f.type as string) ||
          (f.type === 'custom' && Array.isArray(f.days) && f.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)))
      return isStr(r.id) && isStr(r.name) && freq && isTime(r.createdAt) && optional(r.archivedAt, isTime)
    },
  },
  checkins: {
    label: 'ritual check-ins',
    ok: (r) => isStr(r.id) && isStr(r.ritualId) && isDay(r.date) && isTime(r.completedAt),
  },
  goals: {
    label: 'goals',
    ok: (r) =>
      isStr(r.id) &&
      isText(r.title) &&
      optional(r.description, isText) &&
      ['year', 'month', 'week'].includes(r.scope as string) &&
      isStr(r.period) &&
      (r.scope === 'year' ? /^\d{4}$/.test(r.period) : r.scope === 'month' ? /^\d{4}-\d{2}$/.test(r.period) : isDay(r.period)) &&
      ['active', 'archived'].includes(r.status as string) &&
      isTime(r.createdAt) &&
      isTime(r.updatedAt) &&
      optional(r.archivedAt, isTime),
  },
  reflections: {
    label: 'reflections',
    ok: (r) =>
      isStr(r.id) &&
      ['day', 'week', 'month', 'year'].includes(r.periodType as string) &&
      isDay(r.periodStart) &&
      isDay(r.periodEnd) &&
      isText(r.content) &&
      isTime(r.createdAt) &&
      isTime(r.updatedAt),
  },
}

/**
 * Reads and checks a whole backup file before anything is touched (PRD 21). Throws a calm error that says
 * the current data is unchanged. Nothing is repaired or skipped: one bad record makes the whole file invalid.
 */
export function parseBackup(text: string): Backup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return fail("The file isn't a Daybook backup.")
  }
  if (!isRec(raw) || !isRec(raw.data)) return fail("The file isn't a Daybook backup.")
  if (!Number.isInteger(raw.schemaVersion)) return fail("It doesn't say which version it is.")
  if ((raw.schemaVersion as number) > SCHEMA_VERSION) return fail('It was made by a newer version of Daybook.')
  if (!isTime(raw.exportedAt)) return fail("It doesn't say when it was made.")

  const data = raw.data
  const out: Record<string, unknown[]> = {}
  for (const [name, { label, ok }] of Object.entries(CHECKS)) {
    const list = data[name]
    if (!Array.isArray(list)) return fail(`The ${label} are missing.`)
    if (!list.every((r) => isRec(r) && ok(r))) return fail(`Some ${label} are not readable.`)
    const ids = new Set(list.map((r) => (r as Rec).id))
    if (ids.size !== list.length) return fail(`Some ${label} appear twice.`)
    out[name] = list
  }
  const settings = data.settings ?? []
  if (!Array.isArray(settings) || !settings.every((s) => isRec(s) && isStr(s.key))) return fail('The settings are not readable.')
  out.settings = settings

  const ritualIds = new Set((out.rituals as Rec[]).map((r) => r.id))
  const seen = new Set<string>()
  for (const c of out.checkins as Rec[]) {
    if (!ritualIds.has(c.ritualId)) return fail('A ritual check-in belongs to a ritual that is not in the file.')
    const k = `${c.ritualId as string}|${c.date as string}`
    if (seen.has(k)) return fail('A ritual has two check-ins for the same day.')
    seen.add(k)
  }
  const periods = new Set<string>()
  for (const r of out.reflections as Rec[]) {
    const k = `${r.periodType as string}|${r.periodStart as string}`
    if (periods.has(k)) return fail('Two reflections are for the same period.')
    periods.add(k)
  }

  return {
    schemaVersion: raw.schemaVersion as number,
    exportedAt: raw.exportedAt,
    applicationVersion: typeof raw.applicationVersion === 'string' ? raw.applicationVersion : 'unknown',
    data: out as unknown as Backup['data'],
  }
}

export type RestoreSummary = { tasks: number; openLoops: number; rituals: number; goals: number; reflections: number }

/**
 * Replaces everything with the backup's contents (replace, not merge). The swap is one transaction, so if
 * anything goes wrong the existing data stays exactly as it was. "Last backup" is kept.
 */
export async function restoreBackup(backup: Backup): Promise<RestoreSummary> {
  const d = db()
  const { data } = backup
  try {
    await d.transaction('rw', [d.tasks, d.openLoops, d.rituals, d.checkins, d.goals, d.reflections, d.settings], async () => {
      const last = await d.settings.get(LAST_BACKUP_KEY)
      await Promise.all([d.tasks.clear(), d.openLoops.clear(), d.rituals.clear(), d.checkins.clear(), d.goals.clear(), d.reflections.clear(), d.settings.clear()])
      await d.tasks.bulkAdd(data.tasks)
      await d.openLoops.bulkAdd(data.openLoops)
      await d.rituals.bulkAdd(data.rituals)
      await d.checkins.bulkAdd(data.checkins)
      await d.goals.bulkAdd(data.goals)
      await d.reflections.bulkAdd(data.reflections)
      await d.settings.bulkAdd(data.settings.filter((s) => s.key !== LAST_BACKUP_KEY))
      if (last) await d.settings.put(last)
    })
  } catch {
    throw new DomainError('invalid-state', COULD_NOT_IMPORT)
  }
  return { tasks: data.tasks.length, openLoops: data.openLoops.length, rituals: data.rituals.length, goals: data.goals.length, reflections: data.reflections.length }
}
