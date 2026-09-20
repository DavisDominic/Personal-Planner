import { createOpenLoop } from './openLoops'
import { createRitual } from './rituals'
import { createTask } from './tasks'
import type { DateString, OpenLoop, Ritual, RitualFrequency, Task } from './types'

/** What + Capture can create (PRD 6). The default type is Open Loop. */
export type CaptureInput =
  | { type: 'open-loop'; title: string; note?: string }
  | { type: 'task'; title: string; note?: string; date?: DateString; time?: string; priority?: number }
  | { type: 'ritual'; name: string; frequency: RitualFrequency }

export type CaptureResult =
  | { type: 'open-loop'; record: OpenLoop }
  | { type: 'task'; record: Task }
  | { type: 'ritual'; record: Ritual }

/**
 * Saves one captured item. Each type goes straight to its own object: there is no Open Loop to Task
 * funnel, and nothing is required beyond a title (or a ritual's name and frequency).
 */
export async function saveCapture(input: CaptureInput): Promise<CaptureResult> {
  switch (input.type) {
    case 'open-loop':
      return { type: 'open-loop', record: await createOpenLoop({ title: input.title, note: input.note }) }
    case 'task':
      return {
        type: 'task',
        record: await createTask({ title: input.title, note: input.note, date: input.date, time: input.time, priority: input.priority }),
      }
    case 'ritual':
      return { type: 'ritual', record: await createRitual({ name: input.name, frequency: input.frequency }) }
  }
}
