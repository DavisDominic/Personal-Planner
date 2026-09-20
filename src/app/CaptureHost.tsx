import { CaptureForm } from './CaptureForm'
import type { CapturePreset } from './captureContext'
import { ModalHost } from './ModalHost'
import s from './CaptureHost.module.css'

/** The global capture surface (PRD 6). */
export function CaptureHost({ open, preset, onClose }: { open: boolean; preset?: CapturePreset; onClose: () => void }) {
  return (
    <ModalHost open={open} onClose={onClose} label="Capture" className={s.width}>
      <CaptureForm preset={preset} onClose={onClose} />
    </ModalHost>
  )
}
