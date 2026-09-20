import { db } from './context'
import { assertDate, timestampToDate } from './dates'
import type { DateString, OpenLoop, Reflection, ReflectionPeriodType, Task, Timestamp } from './types'

/** A period to look back over, inclusive at both ends, or `null` for all time. */
export type LookingBackRange = { start: DateString; end: DateString } | null

export type TimelineEntry = {
  /** The record this entry came from, so the UI can open it. */
  id: string
  kind: 'task' | 'ritual' | 'loop' | 'reflection'
  /** The date the thing is recorded against. */
  date: DateString
  at: Timestamp
  title: string
  /** A task's P-level. */
  priority?: number
  /** A reflection's scope. */
  periodType?: ReflectionPeriodType
}

export type RitualTally = { ritualId: string; name: string; checkins: number }

/**
 * What was recorded, as plain facts (PRD 13). There is no score, ranking, comparison or reading
 * of what any of it means: history is evidence, not evaluation.
 */
export type LookingBackResult = {
  /** Completed tasks, most recent first. */
  tasksDone: Task[]
  /** How many of those had a priority. */
  prioritiesDone: number
  /** Ritual check-ins per ritual, in name order (not ranked). */
  rituals: RitualTally[]
  checkinCount: number
  /** Open loops taken care of, most recent first. */
  resolvedLoops: OpenLoop[]
  /** Reflections whose period overlaps the range, most recent first. */
  reflections: Reflection[]
  /** Days in the range with at least one recorded thing. */
  recordedDays: number
  /** "Your record begins ...": the earliest recorded date across everything, whatever the range. */
  recordBegins?: DateString
  /** Everything in the range, newest first. */
  timeline: TimelineEntry[]
}

/**
 * Looking Back is a derived view over records that already exist (PRD 13). A day counts as recorded if a
 * task was completed, a ritual was checked in, an open loop was taken care of, or a day reflection was written.
 */
export async function getLookingBack(range: LookingBackRange): Promise<LookingBackResult> {
  if (range) {
    assertDate(range.start)
    assertDate(range.end)
  }
  const inRange = (d: DateString) => !range || (d >= range.start && d <= range.end)

  const [completed, checkins, resolved, reflections, rituals] = await Promise.all([
    db().tasks.filter((t) => t.completedAt !== undefined).toArray(),
    db().checkins.toArray(),
    db().openLoops.filter((l) => l.resolvedAt !== undefined).toArray(),
    db().reflections.toArray(),
    db().rituals.toArray(),
  ])
  const names = new Map(rituals.map((r) => [r.id, r.name]))

  const taskDate = (t: Task) => timestampToDate(t.completedAt!)
  const loopDate = (l: OpenLoop) => timestampToDate(l.resolvedAt!)

  const allDates = [...completed.map(taskDate), ...checkins.map((c) => c.date), ...resolved.map(loopDate), ...reflections.map((r) => r.periodStart)]
  const recordBegins = allDates.length ? allDates.reduce((a, b) => (a < b ? a : b)) : undefined

  const tasksDone = completed.filter((t) => inRange(taskDate(t))).sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))
  const doneCheckins = checkins.filter((c) => inRange(c.date))
  const resolvedLoops = resolved.filter((l) => inRange(loopDate(l))).sort((a, b) => b.resolvedAt!.localeCompare(a.resolvedAt!))
  const shownReflections = reflections
    .filter((r) => !range || (r.periodStart <= range.end && r.periodEnd >= range.start))
    .sort((a, b) => b.periodStart.localeCompare(a.periodStart) || b.updatedAt.localeCompare(a.updatedAt))

  const tally = new Map<string, number>()
  for (const c of doneCheckins) tally.set(c.ritualId, (tally.get(c.ritualId) ?? 0) + 1)

  const days = new Set<DateString>([
    ...tasksDone.map(taskDate),
    ...doneCheckins.map((c) => c.date),
    ...resolvedLoops.map(loopDate),
    ...reflections.filter((r) => r.periodType === 'day' && inRange(r.periodStart)).map((r) => r.periodStart),
  ])

  const timeline: TimelineEntry[] = [
    ...tasksDone.map((t): TimelineEntry => ({ id: t.id, kind: 'task', date: taskDate(t), at: t.completedAt!, title: t.title, priority: t.priority })),
    ...doneCheckins.map((c): TimelineEntry => ({ id: c.id, kind: 'ritual', date: c.date, at: c.completedAt, title: names.get(c.ritualId) ?? 'Ritual' })),
    ...resolvedLoops.map((l): TimelineEntry => ({ id: l.id, kind: 'loop', date: loopDate(l), at: l.resolvedAt!, title: l.title })),
    ...shownReflections.map((r): TimelineEntry => ({ id: r.id, kind: 'reflection', date: r.periodStart, at: r.updatedAt, title: r.content, periodType: r.periodType })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at))

  return {
    tasksDone,
    prioritiesDone: tasksDone.filter((t) => t.priority !== undefined).length,
    rituals: [...tally.entries()]
      .map(([ritualId, count]) => ({ ritualId, name: names.get(ritualId) ?? 'Ritual', checkins: count }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    checkinCount: doneCheckins.length,
    resolvedLoops,
    reflections: shownReflections,
    recordedDays: days.size,
    recordBegins,
    timeline,
  }
}
