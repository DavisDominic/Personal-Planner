import { cx } from '../../lib/cx'
import s from './WeekdayPicker.module.css'

/** Index = day of week, 0 = Sunday (weeks start on Sunday). */
const DAYS = [
  ['S', 'Sunday'],
  ['M', 'Monday'],
  ['T', 'Tuesday'],
  ['W', 'Wednesday'],
  ['T', 'Thursday'],
  ['F', 'Friday'],
  ['S', 'Saturday'],
] as const

type WeekdayPickerProps = {
  label: string
  /** Selected days, 0 = Sunday ... 6 = Saturday. */
  value: number[]
  onChange: (days: number[]) => void
}

export function WeekdayPicker({ label, value, onChange }: WeekdayPickerProps) {
  const toggle = (day: number) => onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b))
  return (
    <div className={s.wrap} role="group" aria-label={label}>
      <div className={s.label} aria-hidden="true">
        {label}
      </div>
      <div className={s.days}>
        {DAYS.map(([letter, name], day) => {
          const on = value.includes(day)
          return (
            <button key={name} type="button" aria-pressed={on} aria-label={name} className={cx(s.day, on && s.active)} onClick={() => toggle(day)}>
              {letter}
            </button>
          )
        })}
      </div>
    </div>
  )
}
