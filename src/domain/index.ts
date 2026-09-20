/**
 * The planner's public domain API. The UI imports from here and nowhere else for data:
 * it never touches IndexedDB, Dexie or `src/db` directly (CLAUDE.md rule 2).
 */
export * from './types'
export * from './errors'
export * from './tasks'
export * from './openLoops'
export * from './rituals'
export * from './goals'
export * from './reflections'
export * from './capture'
export * from './calendar'
export * from './day'
export * from './watch'
export { today } from './context'
export { addDays, addMonths, isDateString, monthGridDays, periodBounds, toDateString, weekDays, weekStart } from './dates'
