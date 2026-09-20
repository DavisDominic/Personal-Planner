import type { ReactNode, Ref } from 'react'
import { Trash2 } from 'lucide-react'
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
  prompts?: string[]
  onPrompt?: (prompt: string) => void
  /** Small factual status such as "Saved". */
  status?: string
  /** Shown as a quiet text action in the footer, only once something is saved. */
  onDelete?: () => void
  /** A calm message if something couldn't be saved. */
  message?: ReactNode
}

/** A lined sheet of paper to write on (design system: reflection sheet). Free writing, no required fields. */
export function ReflectionEditor({ label, ariaLabel, value, onChange, onBlur, textareaRef, prompts, onPrompt, status, onDelete, message }: ReflectionEditorProps) {
  // Keeps the writing area focused while a chip or Delete is pressed, so leaving it can't collapse the sheet.
  const keepFocus = (e: { preventDefault: () => void }) => e.preventDefault()

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
      {prompts && prompts.length > 0 && (
        <div className={s.prompts} role="group" aria-label="Optional prompts">
          {prompts.map((p) => (
            <button key={p} type="button" className={s.chip} onMouseDown={keepFocus} onClick={() => onPrompt?.(p)}>
              {p}
            </button>
          ))}
        </div>
      )}
      {message}
      {(status || onDelete) && (
        <div className={s.footer}>
          <span className={s.status} role="status">
            {status}
          </span>
          {onDelete && (
            <button type="button" className={s.delete} onMouseDown={keepFocus} onClick={onDelete}>
              <Trash2 aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
      )}
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
