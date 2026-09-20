/**
 * Domain types (PRD 5). Formats:
 * - Dates are local calendar dates, "YYYY-MM-DD". Times are "HH:mm".
 * - Timestamps (createdAt, updatedAt, ...) are ISO 8601 strings.
 * - Ids are UUID strings.
 */

export type DateString = string
export type Timestamp = string

export type TaskStatus = 'active' | 'completed' | 'no-longer-relevant'

export type Task = {
  id: string
  title: string
  note?: string
  date?: DateString
  time?: string
  /** P-level: 1 is the highest. Absent = no priority. Levels can be shared. */
  priority?: number
  status: TaskStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
}

export type OpenLoopStatus = 'open' | 'taken-care-of'

export type OpenLoop = {
  id: string
  title: string
  note?: string
  date?: DateString
  status: OpenLoopStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  resolvedAt?: Timestamp
}

export type RitualFrequency =
  | { type: 'daily' }
  | { type: 'weekly' }
  | { type: 'weekends' }
  /** days: 0 = Sunday ... 6 = Saturday */
  | { type: 'custom'; days: number[] }

export type Ritual = {
  id: string
  name: string
  frequency: RitualFrequency
  createdAt: Timestamp
  archivedAt?: Timestamp
}

export type RitualCheckin = {
  id: string
  ritualId: string
  date: DateString
  completedAt: Timestamp
}

export type GoalScope = 'year' | 'month' | 'week'
export type GoalStatus = 'active' | 'archived'

export type Goal = {
  id: string
  title: string
  description?: string
  scope: GoalScope
  /** year: "YYYY", month: "YYYY-MM", week: the Sunday that starts the week, as "YYYY-MM-DD". */
  period: string
  status: GoalStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  archivedAt?: Timestamp
}

export type ReflectionPeriodType = 'day' | 'week' | 'month' | 'year'

export type Reflection = {
  id: string
  periodType: ReflectionPeriodType
  periodStart: DateString
  periodEnd: DateString
  content: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** Key/value application settings (PRD 5, infrastructure). */
export type Setting = { key: string; value: unknown }
