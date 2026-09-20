import { useState } from 'react'
import { cx } from '../../lib/cx'
import s from './Ritual.module.css'

type RitualGridProps = {
  /** One entry per day; true = checked in. Each square toggles on tap. */
  initial: boolean[]
  todayIndex?: number
  label: string
}

export function RitualGrid({ initial, todayIndex, label }: RitualGridProps) {
  const [checked, setChecked] = useState(initial)
  return (
    <div className={s.ritualGrid} role="group" aria-label={label}>
      {checked.map((on, i) => (
        <button
          key={i}
          type="button"
          role="checkbox"
          aria-checked={on}
          aria-label={`Day ${i + 1}`}
          className={cx(s.ritualSquare, on && s.checked, i === todayIndex && s.today)}
          onClick={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
        />
      ))}
    </div>
  )
}
