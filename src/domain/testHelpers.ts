import { PlannerDB } from '../db/db'
import { configureDomain, resetDomain } from './context'

let dbCounter = 0
let clock = new Date(2026, 8, 20, 12, 0, 0)
let idCounter = 0

/** Local date/time, so tests behave the same in any timezone. */
export function setNow(year: number, month: number, day: number, hour = 12, minute = 0) {
  clock = new Date(year, month - 1, day, hour, minute, 0)
}

/** Fresh empty database, fixed clock (2026-09-20 12:00 local) and predictable ids for each test. */
export async function freshDomain() {
  resetDomain()
  const db = new PlannerDB(`test-${++dbCounter}`)
  await db.open()
  idCounter = 0
  setNow(2026, 9, 20)
  configureDomain({ db, now: () => new Date(clock), newId: () => `id-${++idCounter}` })
  return db
}

export async function closeDomain(db: PlannerDB) {
  db.close()
  await db.delete()
  resetDomain()
}
