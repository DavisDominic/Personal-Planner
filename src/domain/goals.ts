import { db, newId, nowTimestamp } from './context'
import { assertDate, periodBounds } from './dates'
import { invalid, notFound } from './errors'
import type { DateString, Goal, GoalScope } from './types'

export type NewGoal = {
  title: string
  description?: string
  scope: GoalScope
  /** Any date inside the period the goal is for, e.g. today for "this week". */
  forDate: DateString
}

export type GoalPatch = { title?: string; description?: string | null }

const cleanTitle = (title: string) => {
  const t = title.trim()
  if (!t) throw invalid('A goal needs a title.')
  return t
}
const cleanDescription = (d: string) => d.trim() || undefined

const withoutUndefined = <T extends object>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T

/** year: "YYYY", month: "YYYY-MM", week: the Monday of that week. */
export function goalPeriod(scope: GoalScope, forDate: DateString): string {
  const { start } = periodBounds(scope, assertDate(forDate))
  return scope === 'year' ? start.slice(0, 4) : scope === 'month' ? start.slice(0, 7) : start
}

async function requireGoal(id: string): Promise<Goal> {
  const goal = await db().goals.get(id)
  if (!goal) throw notFound('goal')
  return goal
}

async function update(id: string, change: (g: Goal) => Goal): Promise<Goal> {
  return db().transaction('rw', db().goals, async () => {
    const next = withoutUndefined({ ...change(await requireGoal(id)), updatedAt: nowTimestamp() })
    await db().goals.put(next)
    return next
  })
}

/* --------------------------------------------------------------- commands */

/**
 * Goals are directional context only: no milestones, checklist, progress or link to Tasks.
 * Change history ("when changed significantly") is not recorded yet; see DECISIONS.md.
 */
export async function createGoal(input: NewGoal): Promise<Goal> {
  const now = nowTimestamp()
  const goal: Goal = withoutUndefined({
    id: newId(),
    title: cleanTitle(input.title),
    description: input.description === undefined ? undefined : cleanDescription(input.description),
    scope: input.scope,
    period: goalPeriod(input.scope, input.forDate),
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
  })
  await db().goals.add(goal)
  return goal
}

export function updateGoal(id: string, patch: GoalPatch): Promise<Goal> {
  return update(id, (g) => ({
    ...g,
    title: patch.title === undefined ? g.title : cleanTitle(patch.title),
    description:
      patch.description === undefined ? g.description : patch.description === null ? undefined : cleanDescription(patch.description),
  }))
}

export async function archiveGoal(id: string): Promise<Goal> {
  const goal = await requireGoal(id)
  if (goal.status === 'archived') return goal
  return update(id, (g) => ({ ...g, status: 'archived', archivedAt: nowTimestamp() }))
}

export function restoreGoalFromArchive(id: string): Promise<Goal> {
  return update(id, (g) => ({ ...g, status: 'active', archivedAt: undefined }))
}

/** Permanently discards a goal. Returns the removed record so the UI can offer Undo. */
export async function discardGoal(id: string): Promise<Goal> {
  return db().transaction('rw', db().goals, async () => {
    const goal = await requireGoal(id)
    await db().goals.delete(id)
    return goal
  })
}

/** Undo for discardGoal. */
export async function restoreDiscardedGoal(goal: Goal): Promise<void> {
  await db().goals.put(goal)
}

/* ---------------------------------------------------------------- queries */

export const getGoal = (id: string) => db().goals.get(id)

/** Goals for a scope and the period containing `forDate`. Archived goals are excluded unless asked for. */
export async function listGoals(scope: GoalScope, forDate: DateString, options: { archived?: boolean } = {}): Promise<Goal[]> {
  const period = goalPeriod(scope, forDate)
  const goals = await db().goals.where('scope').equals(scope).filter((g) => g.period === period).toArray()
  return goals
    .filter((g) => (options.archived ? g.status === 'archived' : g.status === 'active'))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
