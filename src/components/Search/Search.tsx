import { useState } from 'react'
import { Search } from 'lucide-react'
import { cx } from '../../lib/cx'
import t from '../../styles/typography.module.css'
import s from './Search.module.css'

export function SearchBar({ placeholder, hint }: { placeholder: string; hint?: string }) {
  return (
    <div className={s.searchbar} role="search">
      <Search aria-hidden="true" />
      <input type="search" aria-label="Search" placeholder={placeholder} />
      {hint && <span className={t.typeCaption}>{hint}</span>}
    </div>
  )
}

export function FilterChips({ items, label }: { items: string[]; label: string }) {
  const [active, setActive] = useState(items[0])
  return (
    <div className={s.filters} role="group" aria-label={label}>
      {items.map((it) => (
        <button
          key={it}
          type="button"
          className={cx(s.filter, it === active && s.active)}
          aria-pressed={it === active}
          onClick={() => setActive(it)}
        >
          {it}
        </button>
      ))}
    </div>
  )
}
