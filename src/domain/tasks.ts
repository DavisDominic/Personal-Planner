import { db, newId, nowTimestamp, today } from './context'
import { assertDate, assertTime, timestampToDate } from './dates'
import { badState, invalid, notFound } from './errors'
import type { DateString, Task } from './types'

/** The PRD recommends up to five priorities per day. It is a gentle prompt, never a limit. */
export const RECOMMENDED_PRIORITIES_PER_DAY = 5

export type NewTask = {
  title: string
  note?: string
  date?: DateString
  time?: string
  /** P-level, 1 = highest. */
  priority?: number
}

/** For each field: a value sets it, `null` clears it, `undefined` leaves it alone. */
export type TaskPatch = {
  title?: string
  note?: string | null
  date?: DateString | null
  time?: string | null
  priority?: number | null
}

/* ---------------------------------------------------------------- helpers */

const cleanTitle = (title: string) => {
  const t = title.trim()
  if (!t) throw invalid('A task needs a title.')
  return t
}
const cleanNote = (note: string) => note.trim() || undefined
const cleanPriority = (p: number) => {
  if (!Number.isInteger(p) || p < 1) throw invalid('Priority is a whole number from P1 up.')
  return p
}

const withoutUndefined = <T extends object>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T

async function requireTask(id: string): Promise<Task> {
  const task = await db().tasks.get(id)
  if (!task) throw notFound('task')
  return task
}

async function update(id: string, change: (t: Task) => Task): Promise<Task> {
  return db().transaction('rw', db().tasks, async () => {
    const next = withoutUndefined({ ...change(await requireTask(id)), updatedAt: nowTimestamp() })
    await db().tasks.put(next)
    return next
  })
}

/** Undated tasks appear on every day from creation while active; a completed one only on its completion day. */
const showsUndatedOn = (t: Task, date: DateString) =>
  t.status === 'completed'
    ? t.completedAt !== undefined && timestampToDate(t.completedAt) === date
    : timestampToDate(t.createdAt) <= date

const byPriorityThenCreated = (a: Task, b: Task) =>
  (a.priority ?? Infinity) - (b.priority ?? Infinity) || a.createdAt.localeCompare(b.createdAt)

/* --------------------------------------------------------------- commands */

export async function createTask(input: NewTask): Promise<Task> {
  const now = nowTimestamp()
  const task: Task = withoutUndefined({
    id: newId(),
    title: cleanTitle(input.title),
    note: input.note === undefined ? undefined : cleanNote(input.note),
    date: input.date === undefined ? undefined : assertDate(input.date),
    time: input.time === undefined ? undefined : assertTime(input.time),
    priority: input.priority === undefined ? undefined : cleanPriority(input.priority),
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
  })
  await db().tasks.add(task)
  return task
}

export function updateTask(id: string, patch: TaskPatch): Promise<Task> {
  return update(id, (t) => ({
    ...t,
    title: patch.title === undefined ? t.title : cleanTitle(patch.title),
    note: patch.note === undefined ? t.note : patch.note === null ? undefined : cleanNote(patch.note),
    date: patch.date === undefined ? t.date : patch.date === null ? undefined : assertDate(patch.date),
    time: patch.time === undefined ? t.time : patch.time === null ? undefined : assertTime(patch.time),
    priority: patch.priority === undefined ? t.priority : patch.priority === null ? undefined : cleanPriority(patch.priority),
  }))
}

/** One tap. Completing a completed task changes nothing. */
export async function completeTask(id: string): Promise<Task> {
  const task = await requireTask(id)
  if (task.status === 'completed') return task
  if (task.status !== 'active') throw badState('Reopen this task before completing it.')
  return update(id, (t) => ({ ...t, status: 'completed', completedAt: nowTimestamp() }))
}

/** Undoes completion (or No Longer Relevant), returning the task to Active. */
export function reopenTask(id: string): Promise<Task> {
  return update(id, (t) => ({ ...t, status: 'active', completedAt: undefined }))
}

export async function markTaskNoLongerRelevant(id: string): Promise<Task> {
  const task = await requireTask(id)
  if (task.status === 'no-longer-relevant') return task
  if (task.status !== 'active') throw badState('Only an active task can be marked no longer relevant.')
  return update(id, (t) => ({ ...t, status: 'no-longer-relevant' }))
}

/** Moves an active task to another date. Repeated moves are always allowed; nothing warns or counts them. */
export async function moveTask(id: string, date: DateString): Promise<Task> {
  const task = await requireTask(id)
  if (task.status === 'completed') throw badState('A completed task stays on its date. Reopen it to move it.')
  const to = assertDate(date)
  return update(id, (t) => ({ ...t, date: to }))
}

/**
 * PRD "Complete today": the task's date becomes today. It does not mark the task completed,
 * and its priority is kept.
 */
export const moveTaskToToday = (id: string) => moveTask(id, today())

/** Permanently removes the task (no trash). Returns the removed record so the UI can offer Undo. */
export async function deleteTask(id: string): Promise<Task> {
  return db().transaction('rw', db().tasks, async () => {
    const task = await requireTask(id)
    await db().tasks.delete(id)
    return task
  })
}

/** Undo for deleteTask. */
export async function restoreTask(task: Task): Promise<void> {
  await db().tasks.put(task)
}

/* ---------------------------------------------------------------- queries */

export const getTask = (id: string) => db().tasks.get(id)

/**
 * The Priorities section of a Day: tasks with a priority that belong to that day, ordered by level.
 * - Dated tasks on that date (active or completed; No Longer Relevant is removed).
 * - Undated priority tasks show on every day from their creation date while active. A completed
 *   one shows (checked) only on the day it was completed.
 * Tasks carried over from an earlier date are not included until they are moved or brought to today.
 */
export async function getDayPriorities(date: DateString): Promise<Task[]> {
  assertDate(date)
  const tasks = await db().tasks.filter((t) => t.priority !== undefined && t.status !== 'no-longer-relevant').toArray()
  return tasks
    .filter((t) => (t.date !== undefined ? t.date === date : showsUndatedOn(t, date)))
    .sort(byPriorityThenCreated)
}

/**
 * The Tasks section of a Day: tasks without a priority, remaining and completed.
 * Dated tasks on that date come first (by time, then creation). Undated tasks follow, below all
 * the others, and keep appearing every day from their creation until finished or removed.
 * A completed undated task shows (checked) only on the day it was completed.
 */
export async function getDayTasks(date: DateString): Promise<Task[]> {
  assertDate(date)
  const plain = (t: Task) => t.priority === undefined && t.status !== 'no-longer-relevant'
  const dated = (await db().tasks.where('date').equals(date).toArray()).filter(plain)
  const undated = (await db().tasks.filter((t) => t.date === undefined && plain(t)).toArray()).filter((t) => showsUndatedOn(t, date))
  dated.sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99') || a.createdAt.localeCompare(b.createdAt))
  undated.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return [...dated, ...undated]
}

/**
 * Unfinished dated tasks from before `before` (default: today), oldest first.
 * The UI shows the previous day as "From yesterday"; nothing about them is changed by being listed.
 */
export async function getUnfinishedFromEarlier(before: DateString = today()): Promise<Task[]> {
  assertDate(before)
  const tasks = await db().tasks.where('date').below(before).filter((t) => t.status === 'active').toArray()
  return tasks.sort((a, b) => a.date!.localeCompare(b.date!) || byPriorityThenCreated(a, b))
}

/** How many priorities a Day currently holds. */
export async function countDayPriorities(date: DateString): Promise<number> {
  return (await getDayPriorities(date)).length
}

/**
 * Whether the UI should show the gentle "You've chosen five priorities already. Add this anyway?"
 * before giving a task a priority on `date`. Only asks when the task would add a sixth (or later)
 * priority; changing the level of a task that already counts never asks. Never blocks: this is a
 * question for the UI, and only when a priority is set or changed, not when a task is moved.
 */
export async function shouldConfirmPriority(date: DateString, taskId?: string): Promise<boolean> {
  const current = await getDayPriorities(date)
  if (taskId && current.some((t) => t.id === taskId)) return false
  return current.length >= RECOMMENDED_PRIORITIES_PER_DAY
}
