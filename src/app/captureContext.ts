import { createContext } from 'react'

export type CaptureApi = {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const CaptureContext = createContext<CaptureApi | null>(null)
