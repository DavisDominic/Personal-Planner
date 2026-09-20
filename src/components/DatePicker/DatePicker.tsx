import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, addMonths, monthGridDays, today } from '../../domain/index'
import { cx } from '../../lib/cx'
import { dayFull, dayLong, monthTitle, weekdayShort } from '../../lib/dateFormat'
import { Button } from '../Button/Button'
import s from './DatePicker.module.css'

type DatePickerProps = {
  label: string
  /** Hides the label visually; screen readers still read it. */
  labelHidden?: boolean
  /** "YYYY-MM-DD", or "" for no date. */
  value: string
  onChange: (value: string) => void
  /** Shows a Clear button, for dates that are optional. */
  allowClear?: boolean
  placeholder?: string
  help?: ReactNode
  /** Which edge the calendar lines up with. */
  align?: 'start' | 'end'
}

/** Room the calendar needs, used to decide whether it opens upward. */
const NEEDED_SPACE = 380

/**
 * A date picker in the design system's style, in place of the browser's own (which can't be styled).
 * Arrow keys move by day and week, Page Up / Page Down by month, Enter chooses, Escape closes.
 */
export function DatePicker({ label, labelHidden, value, onChange, allowClear, placeholder = 'Choose a date', help, align = 'start' }: DatePickerProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(value || today())
  const [focused, setFocused] = useState(value || today())
  const [up, setUp] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const grid = useRef<HTMLDivElement>(null)

  const now = today()
  const days = monthGridDays(view)
  const month = view.slice(0, 7)

  const show = () => {
    const start = value || now
    setView(start)
    setFocused(start)
    const rect = trigger.current?.getBoundingClientRect()
    if (rect) {
      const below = window.innerHeight - rect.bottom
      setUp(below < NEEDED_SPACE && rect.top > below)
    }
    setOpen(true)
  }

  const close = (returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) trigger.current?.focus()
  }

  const choose = (date: string) => {
    onChange(date)
    close(true)
  }

  const moveTo = (date: string) => {
    setFocused(date)
    setView(date)
  }

  // Focus the highlighted day whenever it changes (keyboard navigation) and when the calendar opens.
  useEffect(() => {
    if (open) grid.current?.querySelector<HTMLElement>(`[data-date="${focused}"]`)?.focus()
  }, [open, focused, view])


  // The popover is centred on a phone, so it would otherwise hang there while the page moved
  // underneath. Any scroll outside it closes it.
  useEffect(() => {
    if (!open) return
    const onScroll = (e: Event) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [open])

  // A click anywhere else closes it.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Only the calendar closes, not a dialog it may be sitting in.
      e.preventDefault()
      e.stopPropagation()
      close(true)
      return
    }
    const step: Record<string, string> = {
      ArrowLeft: addDays(focused, -1),
      ArrowRight: addDays(focused, 1),
      ArrowUp: addDays(focused, -7),
      ArrowDown: addDays(focused, 7),
      PageUp: addMonths(focused, -1),
      PageDown: addMonths(focused, 1),
    }
    if (step[e.key] && (e.target as HTMLElement).dataset.date) {
      e.preventDefault()
      moveTo(step[e.key])
    }
  }

  return (
    <div className={s.field}>
      <label className={cx(s.label, labelHidden && s.hidden)} htmlFor={id}>
        {label}
      </label>
      <div className={s.wrap} ref={wrap} onKeyDown={onKeyDown}>
        <button
          ref={trigger}
          id={id}
          type="button"
          className={s.trigger}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => (open ? close(false) : show())}
        >
          <span className={value ? undefined : s.placeholder}>{value ? dayFull(value) : placeholder}</span>
          <CalendarDays aria-hidden="true" />
        </button>

        {/* On a phone the popover is centred like a dialog, so a scrim holds the page still behind it. */}
        {open && <div className={s.scrim} aria-hidden="true" onClick={() => close(false)} />}

        {open && (
          <div className={cx(s.popover, align === 'end' && s.end, up && s.up)} role="dialog" aria-label={`Choose ${label.toLowerCase()}`}>
            <div className={s.head}>
              <button type="button" className={s.nav} aria-label="Previous month" onClick={() => moveTo(addMonths(focused, -1))}>
                <ChevronLeft aria-hidden="true" />
              </button>
              <div className={s.title} aria-live="polite">
                {monthTitle(view)}
              </div>
              <button type="button" className={s.nav} aria-label="Next month" onClick={() => moveTo(addMonths(focused, 1))}>
                <ChevronRight aria-hidden="true" />
              </button>
            </div>

            <div className={s.dow} aria-hidden="true">
              {days.slice(0, 7).map((d) => (
                <span key={d}>{weekdayShort(d).slice(0, 2)}</span>
              ))}
            </div>

            <div className={s.grid} ref={grid} role="grid" aria-label={monthTitle(view)}>
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  data-date={d}
                  tabIndex={d === focused ? 0 : -1}
                  aria-label={dayLong(d)}
                  aria-pressed={d === value}
                  aria-current={d === now ? 'date' : undefined}
                  className={cx(s.day, d.slice(0, 7) !== month && s.outside, d === now && s.today, d === value && s.selected)}
                  onClick={() => choose(d)}
                >
                  {Number(d.slice(8))}
                </button>
              ))}
            </div>

            <div className={s.foot}>
              <Button tone="lemon" size="small" onClick={() => choose(now)}>
                Today
              </Button>
              {allowClear && value && (
                <Button tone="ghost" size="small" onClick={() => choose('')}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      {help && <div className={s.help}>{help}</div>}
    </div>
  )
}
