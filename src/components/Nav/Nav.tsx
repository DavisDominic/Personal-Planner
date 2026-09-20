import { useState } from 'react'
import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { cx } from '../../lib/cx'
import s from './Nav.module.css'

export type NavItem = { label: string; icon: ReactNode }

export function ProductNav({ brand, items }: { brand: string; items: NavItem[] }) {
  const [active, setActive] = useState(0)
  return (
    <nav className={s.productNav} aria-label="Primary">
      <div className={s.productBrand}>
        <span className={s.dot} aria-hidden="true" />
        <strong>{brand}</strong>
      </div>
      {items.map((it, i) => (
        <button
          key={it.label}
          type="button"
          className={cx(s.productLink, i === active && s.active)}
          aria-current={i === active ? 'page' : undefined}
          onClick={() => setActive(i)}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
      <button type="button" className={s.productAdd} aria-label="Capture">
        <Plus aria-hidden="true" />
      </button>
    </nav>
  )
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(0)
  return (
    <nav className={s.mobileNav} aria-label="Primary">
      {items.map((it, i) => (
        <button
          key={it.label}
          type="button"
          className={cx(s.mobileItem, i === active && s.active)}
          aria-current={i === active ? 'page' : undefined}
          onClick={() => setActive(i)}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </nav>
  )
}
