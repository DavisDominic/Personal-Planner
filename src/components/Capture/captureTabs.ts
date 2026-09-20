export const CAPTURE_TABS = [
  { id: 'open-loop', label: 'Open loop' },
  { id: 'task', label: 'Task' },
  { id: 'ritual', label: 'Ritual' },
] as const

export type CaptureTab = (typeof CAPTURE_TABS)[number]['id']
