import { db, today } from './context'
import { parseDate } from './dates'
import { getUnfinishedFromEarlier } from './tasks'

/** The device-only setting that remembers the last day the planner was opened and used. */
export const LAST_VISIT_KEY = 'lastVisitDate'

/** PRD 15: from this many days away, the planner opens with a Welcome Back state. There is no escalation after that. */
const WELCOME_BACK_AFTER_DAYS = 3

/** What the planner shows when it opens: PRD 25 (first launch), PRD 15 (after 3+ days away), or straight to the day. */
export type EntryState = 'first-launch' | 'welcome-back' | 'none'

const daysBetween = (from: string, to: string) => Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000)

/**
 * Decides how the planner opens. A brand new planner (no visit recorded and nothing saved) is a first launch.
 * A planner that holds data but has no visit recorded, such as one restored from a backup, just opens normally.
 */
export async function getEntryState(): Promise<EntryState> {
  const d = db()
  const last = await d.settings.get(LAST_VISIT_KEY)
  if (typeof last?.value === 'string') {
    return daysBetween(last.value, today()) >= WELCOME_BACK_AFTER_DAYS ? 'welcome-back' : 'none'
  }
  const counts = await Promise.all([d.tasks.count(), d.openLoops.count(), d.rituals.count(), d.goals.count(), d.reflections.count()])
  return counts.every((n) => n === 0) ? 'first-launch' : 'none'
}

/** Notes that the planner was opened today. Also ends a Welcome Back or First Launch state. */
export async function recordVisit(): Promise<void> {
  await db().settings.put({ key: LAST_VISIT_KEY, value: today() })
}

export type WaitingSummary = { unfinishedTasks: number; openLoops: number }

/** What Welcome Back lists: dated tasks from earlier days still unfinished, and open loops. Only counts; nothing is changed. */
export async function getWaitingSummary(): Promise<WaitingSummary> {
  const d = db()
  const [tasks, openLoops] = await Promise.all([getUnfinishedFromEarlier(today()), d.openLoops.where('status').equals('open').count()])
  return { unfinishedTasks: tasks.length, openLoops }
}
