import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import s from './ModalHost.module.css'

type ModalHostProps = {
  open: boolean
  onClose: () => void
  /** Accessible name of the dialog. */
  label: string
  /** Sets the dialog's width (a class from the caller's own CSS module). */
  className?: string
  /** "sheet" (the default) is centred on desktop and a bottom sheet on phones. "drawer" comes in from the left. */
  placement?: 'sheet' | 'drawer'
  children: ReactNode
}

/**
 * A temporary surface over the planner: a centred modal on desktop, a bottom sheet on phones and
 * tablets. A native <dialog> gives Escape-to-close, a focus trap and an inert background. Children
 * are only mounted while open, so forms start fresh each time. The first element marked
 * `data-autofocus` gets focus when it opens (the keyboard opens straight away, PRD 6).
 */
export function ModalHost({ open, onClose, label, className, placement = 'sheet', children }: ModalHostProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={cx(s.dialog, placement === 'drawer' && s.drawer, className)}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose() // a click on the backdrop
      }}
    >
      {open && children}
    </dialog>
  )
}
