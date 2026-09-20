import type { PreviewItem } from '../../domain/index'

/** The design system's colour for each kind of thing: priority lemon, task coral, open loop peach. */
export const toneFor = (i: PreviewItem) => (i.kind === 'open-loop' ? 'peach' : i.priority !== undefined ? 'lemon' : 'coral')

/** Words carry the meaning too, never colour alone: a check for done, "P1" for priority. */
export const labelFor = (i: PreviewItem) => `${i.done ? '✓ ' : ''}${i.priority !== undefined ? `P${i.priority} ` : ''}${i.title}`
