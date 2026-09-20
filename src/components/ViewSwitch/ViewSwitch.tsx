import { Link } from 'react-router'
import { cx } from '../../lib/cx'
import s from './ViewSwitch.module.css'

export type ViewSwitchItem = { label: string; to: string; active: boolean }

/** A row of links to the same place at a different zoom (Day / Week / Month). */
export function ViewSwitch({ label, items }: { label: string; items: ViewSwitchItem[] }) {
  return (
    <nav className={s.switch} aria-label={label}>
      {items.map((it) => (
        <Link key={it.label} to={it.to} className={cx(s.item, it.active && s.active)} aria-current={it.active ? 'page' : undefined}>
          {it.label}
        </Link>
      ))}
    </nav>
  )
}
