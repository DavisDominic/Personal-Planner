import { useContext } from 'react'
import { CaptureContext } from './captureContext'

/** Opens and closes the global + Capture surface from anywhere inside the app shell. */
export function useCapture() {
  const api = useContext(CaptureContext)
  if (!api) throw new Error('useCapture must be used inside the app shell.')
  return api
}
