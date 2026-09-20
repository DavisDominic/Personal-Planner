import { db, newId, nowTimestamp } from './context'
import { assertDate, timestampToDate } from './dates'
import { invalid, notFound } from './errors'
import { createTask } from './tasks'
import type { DateString, OpenLoop, Task } from './types'

export type NewOpenLoop = { title: string; note?: string; date?: DateString }

/** For each field: a value sets it, `null` clears it, `undefined` leaves it alone. */
export type OpenLoopPatch = { title?: string; note?: string | null; date?: DateString | null }

/** Optional Task details supplied when an Open Loop becomes a Task. */
export type TaskFromLoop = { date?: DateString; time?: string; priority?: number }

const cleanTitle = (title: string) => {
  const t = title.trim()
  if (!t) throw invalid('An open loop needs a title.')
  return t
}
const cleanNote = (note: string) => note.trim() || undefined

const withoutUndefined = <T extends object>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T

async function requireLoop(id: string): Promise<OpenLoop> {
  const loop = await db().openLoops.get(id)
  if (!loop) throw notFound('open loop')
  return loop
}

async function update(id: string, change: (l: OpenLoop) => OpenLoop): Promise<OpenLoop> {
  return db().transaction('rw', db().openLoops, async () => {
    const next = withoutUndefined({ ...change(await requireLoop(id)), updatedAt: nowTimestamp() })
    await db().openLoops.put(next)
    return next
  })
}

/* --------------------------------------------------------------- commands */

/** No category, no required date, no expiration. Only a title. */
export async function createOpenLoop(input: NewOpenLoop): Promise<OpenLoop> {
  const now = nowTimestamp()
  const loop: OpenLoop = withoutUndefined({
    id: newId(),
    title: cleanTitle(input.title),
    note: input.note === undefined ? undefined : cleanNote(input.note),
    date: input.date === undefined ? undefined : assertDate(input.date),
    status: 'open' as const,
    createdAt: now,
    updatedAt: now,
  })
  await db().openLoops.add(loop)
  return loop
}

export function updateOpenLoop(id: string, patch: OpenLoopPatch): Promise<OpenLoop> {
  return update(id, (l) => ({
    ...l,
    title: patch.title === undefined ? l.title : cleanTitle(patch.title),
    note: patch.note === undefined ? l.note : patch.note === null ? undefined : cleanNote(patch.note),
    date: patch.date === undefined ? l.date : patch.date === null ? undefined : assertDate(patch.date),
  }))
}

/** "Taken care of". Kept as a record; it moves out of the open list. */
export async function resolveOpenLoop(id: string): Promise<OpenLoop> {
  const loop = await requireLoop(id)
  if (loop.status === 'taken-care-of') return loop
  return update(id, (l) => ({ ...l, status: 'taken-care-of', resolvedAt: nowTimestamp() }))
}

/** Undoes "taken care of". */
export function reopenOpenLoop(id: string): Promise<OpenLoop> {
  return update(id, (l) => ({ ...l, status: 'open', resolvedAt: undefined }))
}

/**
 * Turns an Open Loop into a Task. The Open Loop ceases to exist (no duplicate, no link), and both
 * changes happen together or not at all. The Task keeps the loop's title, note and date unless overridden.
 */
export async function convertOpenLoopToTask(id: string, details: TaskFromLoop = {}): Promise<Task> {
  return db().transaction('rw', db().openLoops, db().tasks, async () => {
    const loop = await requireLoop(id)
    const task = await createTask({
      title: loop.title,
      note: loop.note,
      date: details.date ?? loop.date,
      time: details.time,
      priority: details.priority,
    })
    await db().openLoops.delete(id)
    return task
  })
}

/** Permanently removes the open loop. Returns the removed record so the UI can offer Undo. */
export async function deleteOpenLoop(id: string): Promise<OpenLoop> {
  return db().transaction('rw', db().openLoops, async () => {
    const loop = await requireLoop(id)
    await db().openLoops.delete(id)
    return loop
  })
}

/** Undo for deleteOpenLoop. */
export async function restoreOpenLoop(loop: OpenLoop): Promise<void> {
  await db().openLoops.put(loop)
}

/* ---------------------------------------------------------------- queries */

export const getOpenLoop = (id: string) => db().openLoops.get(id)

/** Open (not yet taken care of) loops, newest first. The app does not decide which deserves attention. */
export async function listOpenLoops(): Promise<OpenLoop[]> {
  const loops = await db().openLoops.where('status').equals('open').toArray()
  return loops.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * Loops taken care of on a date, most recently resolved first. The Day keeps them in view, ticked, so
 * that taking care of something leaves a visible record and can be undone later.
 */
export async function listTakenCareOfOn(date: DateString): Promise<OpenLoop[]> {
  assertDate(date)
  const loops = await db()
    .openLoops.filter((l) => l.status === 'taken-care-of' && l.resolvedAt !== undefined && timestampToDate(l.resolvedAt) === date)
    .toArray()
  return loops.sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''))
}

/** Loops that were taken care of, most recently resolved first. */
export async function listTakenCareOf(): Promise<OpenLoop[]> {
  const loops = await db().openLoops.where('status').equals('taken-care-of').toArray()
  return loops.sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''))
}

export const countOpenLoops = () => db().openLoops.where('status').equals('open').count()
