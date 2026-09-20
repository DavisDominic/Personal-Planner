import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '../../lib/cx'
import s from './Field.module.css'

type FieldState = 'error' | 'success'

type Shared = { label: string; help?: ReactNode; state?: FieldState }

function Wrap({ label, help, state, id, children }: Shared & { id: string; children: ReactNode }) {
  return (
    <div className={s.fieldWrap}>
      <label className={s.fieldLabel} htmlFor={id}>
        {label}
      </label>
      {children}
      {help && (
        <div id={`${id}-help`} className={cx(s.fieldHelp, state && s[state])}>
          {help}
        </div>
      )}
    </div>
  )
}

const aria = (id: string, help: ReactNode, state?: FieldState) => ({
  'aria-describedby': help ? `${id}-help` : undefined,
  'aria-invalid': state === 'error' ? true : undefined,
})

export function Field({ label, help, state, className, ...rest }: Shared & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Wrap label={label} help={help} state={state} id={id}>
      <input id={id} className={cx(s.field, state && s[state], className)} {...aria(id, help, state)} {...rest} />
    </Wrap>
  )
}

export function TextArea({ label, help, state, className, ...rest }: Shared & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Wrap label={label} help={help} state={state} id={id}>
      <textarea id={id} className={cx(s.field, state && s[state], className)} {...aria(id, help, state)} {...rest} />
    </Wrap>
  )
}

export function Select({ label, help, state, className, children, ...rest }: Shared & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Wrap label={label} help={help} state={state} id={id}>
      <div className={s.selectWrap}>
        <select id={id} className={cx(s.field, state && s[state], className)} {...aria(id, help, state)} {...rest}>
          {children}
        </select>
        <ChevronDown aria-hidden="true" />
      </div>
    </Wrap>
  )
}
