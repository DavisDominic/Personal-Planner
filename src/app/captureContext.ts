import { createContext } from 'react'
import type { CaptureTab } from '../components/Capture/captureTabs'

/** Optional starting point for the capture surface, e.g. "a task on this day". */
export type CapturePreset = { tab?: CaptureTab; date?: string }

export type CaptureApi = {
  isOpen: boolean
  open: (preset?: CapturePreset) => void
  close: () => void
}

export const CaptureContext = createContext<CaptureApi | null>(null)
