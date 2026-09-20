import { PlannerDB } from '../db/db'
import { toDateString } from './dates'
import type { DateString, Timestamp } from './types'

type Context = {
  db: PlannerDB
  now: () => Date
  newId: () => string
}

let ctx: Context | undefined

/** Replaces the database, clock or id generator. Used by tests; the app uses the defaults. */
export function configureDomain(overrides: Partial<Context>): void {
  ctx = { ...getContext(), ...overrides }
}

export function resetDomain(): void {
  ctx = undefined
}

export function getContext(): Context {
  // Created lazily so importing the domain never touches IndexedDB.
  ctx ??= { db: new PlannerDB(), now: () => new Date(), newId: () => crypto.randomUUID() }
  return ctx
}

export const db = () => getContext().db
export const newId = () => getContext().newId()
export const nowTimestamp = (): Timestamp => getContext().now().toISOString()
export const today = (): DateString => toDateString(getContext().now())
