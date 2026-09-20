import { useState } from 'react'
import type { Ref } from 'react'
import { Search } from 'lucide-react'
import { cx } from '../../lib/cx'
import t from '../../styles/typography.module.css'
import s from './Search.module.css'

type SearchBarProps = {
  placeholder: string
  hint?: string
  /** Controlled text. Without it the bar keeps its own (as in the gallery). */
  value?: string
  onChange?: (value: string) => void
  autoFocus?: boolean
  inputRef?: Ref<HTMLInputElement>
}

export function SearchBar({ placeholder, hint, value, onChange, autoFocus, inputRef }: SearchBarProps) {
  return (
    <div className={s.searchbar} role="search">
      <Search aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        aria-label="Search"
        placeholder={placeholder}
        autoFocus={autoFocus}
        {...(value === undefined ? {} : { value })}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {hint && <span className={t.typeCaption}>{hint}</span>}
    </div>
  )
}

type FilterChipsProps = {
  items: string[]
  label: string
  /** Controlled selection. Without it the chips keep their own state (as in the gallery). */
  value?: string
  onChange?: (item: string) => void
  /** "segmented" joins the options into one pill track. */
  variant?: 'chips' | 'segmented'
}

export function FilterChips({ items, label, value, onChange, variant = 'chips' }: FilterChipsProps) {
  const [own, setOwn] = useState(items[0])
  const active = value ?? own
  const setActive = (item: string) => {
    setOwn(item)
    onChange?.(item)
  }
  return (
    <div className={variant === 'segmented' ? s.segments : s.filters} role="group" aria-label={label}>
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
