import { useState } from 'react'
import { X } from 'lucide-react'
import { Button, IconButton } from '../Button/Button'
import { Field } from '../Field/Field'
import { cx } from '../../lib/cx'
import s from './Capture.module.css'

const TABS = ['Open loop', 'Task', 'Ritual'] as const

/** Presentational capture panel. The default type is Open Loop (PRD 6). */
export function CapturePanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Open loop')
  return (
    <div className={s.capture}>
      <div className={s.captureHead}>
        <div className={s.captureTitle}>Capture</div>
        <IconButton label="Close">
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
      <Field label="What's on your mind?" defaultValue="Figure out career direction" />
      <div className={s.captureFoot}>
        <Button tone="ghost">Cancel</Button>
        <Button tone="primary">Save</Button>
      </div>
    </div>
  )
}
