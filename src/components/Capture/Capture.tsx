import { useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { Button, IconButton } from '../Button/Button'
import { Field } from '../Field/Field'
import { cx } from '../../lib/cx'
import s from './Capture.module.css'

const TABS = ['Open loop', 'Task', 'Ritual'] as const

type CapturePanelProps = {
  /** Called by the close button, Cancel and Save. */
  onClose?: () => void
  initialText?: string
}

/**
 * Presentational capture panel. The default type is Open Loop (PRD 6).
 * Saving is wired in the Capture slice; for now Save only closes.
 */
export function CapturePanel({ onClose, initialText }: CapturePanelProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Open loop')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onClose?.()
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
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={name === tab}
            className={cx(s.captureTab, name === tab && s.active)}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <Field label="What's on your mind?" defaultValue={initialText} data-autofocus />
      <div className={s.captureFoot}>
        <Button tone="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button tone="primary" type="submit">
          Save
        </Button>
      </div>
    </form>
  )
}
