import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button, IconButton } from '../Button/Button'
import { InlineMessage, Notice } from '../Feedback/Feedback'
import { cx } from '../../lib/cx'
import { CAPTURE_TABS } from './captureTabs'
import type { CaptureTab } from './captureTabs'
import s from './Capture.module.css'

type CapturePanelProps = {
  tab: CaptureTab
  onTabChange: (tab: CaptureTab) => void
  onClose?: () => void
  onSubmit: () => void
  /** False until the form is valid; Save (and Enter) do nothing meanwhile. */
  canSave: boolean
  busy?: boolean
  error?: string
  /** Replaces the Cancel / Save row, e.g. for a gentle question. */
  footer?: ReactNode
  /** The fields for the selected type. */
  children: ReactNode
}

/** Presentational capture panel (PRD 6). Which type is selected, and what saving does, is decided by the caller. */
export function CapturePanel({ tab, onTabChange, onClose, onSubmit, canSave, busy, error, footer, children }: CapturePanelProps) {
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (canSave && !busy) onSubmit()
  }

  const moveTab = (e: KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = CAPTURE_TABS[(index + step + CAPTURE_TABS.length) % CAPTURE_TABS.length]
    onTabChange(next.id)
    document.getElementById(`capture-tab-${next.id}`)?.focus()
  }

  return (
    <form className={s.capture} onSubmit={submit}>
      <div className={s.captureHead}>
        <div className={s.captureTitle}>Capture</div>
        <IconButton label="Close" onClick={onClose}>
          <X aria-hidden="true" />
        </IconButton>
      </div>
      <div className={s.captureTabs} role="tablist" aria-label="Capture type">
        {CAPTURE_TABS.map((t, i) => (
          <button
            key={t.id}
            id={`capture-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={t.id === tab}
            aria-controls="capture-panel"
            tabIndex={t.id === tab ? 0 : -1}
            className={cx(s.captureTab, t.id === tab && s.active)}
            onClick={() => onTabChange(t.id)}
            onKeyDown={(e) => moveTab(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id="capture-panel" role="tabpanel" aria-labelledby={`capture-tab-${tab}`} className={s.captureFields}>
        {children}
      </div>
      {error && (
        <div className={s.captureMessage}>
          <InlineMessage kind="error">{error}</InlineMessage>
        </div>
      )}
      {footer ?? (
        <div className={s.captureFoot}>
          <Button tone="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button tone="primary" type="submit" disabled={!canSave || busy}>
            Save
          </Button>
        </div>
      )}
    </form>
  )
}

/** Two fields side by side (e.g. date and time). */
export function CaptureRow({ children }: { children: ReactNode }) {
  return <div className={s.captureRow}>{children}</div>
}

/** A gentle question shown in place of Cancel / Save. The answer is always the user's. */
export function CaptureQuestion({ question, backLabel, confirmLabel, busy, onBack, onConfirm }: {
  question: string
  backLabel: string
  confirmLabel: string
  busy?: boolean
  onBack: () => void
  onConfirm: () => void
}) {
  return (
    <>
      <Notice>{question}</Notice>
      <div className={s.captureFoot}>
        <Button tone="ghost" onClick={onBack}>
          {backLabel}
        </Button>
        <Button tone="primary" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </div>
    </>
  )
}
