import { db, newId, nowTimestamp } from './context'
import { assertDate, periodBounds } from './dates'
import type { DateString, Reflection, ReflectionPeriodType } from './types'

export type SaveReflectionResult =
  | { status: 'saved'; reflection: Reflection }
  /** Empty content and nothing stored: no record is created. */
  | { status: 'unchanged' }
  /** Empty content on an existing record removes it. The removed record is returned for Undo. */
  | { status: 'removed'; reflection: Reflection }

const findFor = (type: ReflectionPeriodType, start: DateString) =>
  db().reflections.where('[periodType+periodStart]').equals([type, start]).first()

/**
 * Saves the one editable Reflection for the period containing `forDate` (a day, week, month or year).
 * Safe to call on every keystroke: an abandoned empty editor never creates a record.
 */
export async function saveReflection(type: ReflectionPeriodType, forDate: DateString, content: string): Promise<SaveReflectionResult> {
  const { start, end } = periodBounds(type, assertDate(forDate))
  const isEmpty = content.trim() === ''
  return db().transaction('rw', db().reflections, async () => {
    const existing = await findFor(type, start)
    if (isEmpty) {
      if (!existing) return { status: 'unchanged' }
      await db().reflections.delete(existing.id)
      return { status: 'removed', reflection: existing }
    }
    const now = nowTimestamp()
    const reflection: Reflection = existing
      ? { ...existing, content, updatedAt: now }
      : { id: newId(), periodType: type, periodStart: start, periodEnd: end, content, createdAt: now, updatedAt: now }
    await db().reflections.put(reflection)
    return { status: 'saved', reflection }
  })
}

export function getReflection(type: ReflectionPeriodType, forDate: DateString): Promise<Reflection | undefined> {
  return findFor(type, periodBounds(type, assertDate(forDate)).start)
}

/** Permanently removes the reflection. Returns the removed record so the UI can offer Undo. */
export async function deleteReflection(type: ReflectionPeriodType, forDate: DateString): Promise<Reflection | undefined> {
  return db().transaction('rw', db().reflections, async () => {
    const existing = await getReflection(type, forDate)
    if (existing) await db().reflections.delete(existing.id)
    return existing
  })
}

/** Undo for deleteReflection (or a `removed` save). */
export async function restoreReflection(reflection: Reflection): Promise<void> {
  await db().reflections.put(reflection)
}
