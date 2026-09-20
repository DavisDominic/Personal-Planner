import { useEffect, useRef } from 'react'
import { CapturePanel } from '../components/Capture/Capture'
import s from './CaptureHost.module.css'

/**
 * The global capture surface: a centred modal on desktop, a bottom sheet on phones and tablets.
 * A native <dialog> gives Escape-to-close, a focus trap and an inert background for free.
 */
export function CaptureHost({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // The keyboard opens straight away (PRD 6).
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-label="Capture"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose() // a click on the backdrop
      }}
    >
      {open && <CapturePanel onClose={onClose} />}
    </dialog>
  )
}
