import type { ReactNode, Ref } from 'react'
import { Button } from '../Button/Button'
import { cx } from '../../lib/cx'
import s from './ReflectionEditor.module.css'

type ReflectionEditorProps = {
  /** The small uppercase label, e.g. "REFLECTION / OPTIONAL". */
  label: string
  /** Accessible name of the writing area, e.g. "Reflection for Sunday 20 September". */
  ariaLabel: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  textareaRef?: Ref<HTMLTextAreaElement>
  /** Optional prompts the user can tap to start from. Never required. */
  prompts?: ReactNode
  /** Small factual status such as "Saved". */
  status?: string
  /** Extra actions shown in the footer, e.g. Delete. */
  actions?: ReactNode
  /** A calm message if something couldn't be saved. */
  message?: ReactNode
}

/** A lined sheet of paper to write on (design system: reflection sheet). Free writing, no required fields. */
export function ReflectionEditor({ label, ariaLabel, value, onChange, onBlur, textareaRef, prompts, status, actions, message }: ReflectionEditorProps) {
  return (
    <div className={s.sheet}>
      <div className={s.prompt}>{label}</div>
      <textarea
        ref={textareaRef}
        className={s.writing}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {prompts && <div className={s.prompts}>{prompts}</div>}
      {message}
      <div className={s.footer}>
        {actions}
        <span className={s.status} role="status">
          {status}
        </span>
      </div>
    </div>
  )
}

/** The empty state: nothing is written, nothing is asked for (PRD 18). */
export function ReflectionCollapsed({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className={cx(s.sheet, s.compact)}>
      <div className={s.prompt}>{label}</div>
      <div className={s.add}>
        <Button size="small" onClick={onAdd}>
          + Add something
        </Button>
      </div>
    </div>
  )
}
