import Dexie from 'dexie'
import type { EntityTable } from 'dexie'
import type { Goal, OpenLoop, Reflection, Ritual, RitualCheckin, Setting, Task } from '../domain/types'

/**
 * IndexedDB schema. Only `src/domain` may import this module; the UI goes through domain functions.
 * `&` marks a unique index.
 */
export class PlannerDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  openLoops!: EntityTable<OpenLoop, 'id'>
  rituals!: EntityTable<Ritual, 'id'>
  checkins!: EntityTable<RitualCheckin, 'id'>
  goals!: EntityTable<Goal, 'id'>
  reflections!: EntityTable<Reflection, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor(name = 'personal-planner') {
    super(name)
    this.version(1).stores({
      tasks: 'id, date, status, priority, createdAt, completedAt',
      openLoops: 'id, status, date, createdAt',
      rituals: 'id, archivedAt',
      checkins: 'id, ritualId, date, &[ritualId+date]',
      goals: 'id, scope, period, status',
      reflections: 'id, &[periodType+periodStart]',
      settings: 'key',
    })
  }
}
