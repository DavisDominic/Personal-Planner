import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Clock } from 'lucide-react'
import { cx } from '../../lib/cx'
import { Button } from '../Button/Button'
import d from '../DatePicker/DatePicker.module.css'
import s from './TimePicker.module.css'

type TimePickerProps = {
  label: string
  labelHidden?: boolean
  /** "HH:mm" (24-hour), or "" for no time. */
  value: string
  onChange: (value: string) => void
  allowClear?: boolean
  placeholder?: string
  help?: ReactNode
  align?: 'start' | 'end'
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
/** Five-minute steps keep the grid small; the time stays a plain "HH:mm". */
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
const COLUMNS = 6
/** Room the picker needs, used to decide whether it opens upward. */
const NEEDED_SPACE = 300

/**
 * A time picker in the same style as the date picker, in place of the browser's own. Choose an hour, then a
 * minute; choosing the minute closes it. Arrow keys move around each grid, Escape closes.
 */
export function TimePicker({ label, labelHidden, value, onChange, allowClear, placeholder = 'Choose a time', help, align = 'start' }: TimePickerProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const hourGrid = useRef<HTMLDivElement>(null)

  const [hh, mm] = value ? value.split(':') : ['', '']

  const show = () => {
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

  useEffect(() => {
    if (open) (hourGrid.current?.querySelector<HTMLElement>('[tabindex="0"]'))?.focus()
  }, [open])

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
      // Only the picker closes, not a dialog it may be sitting in.
      e.preventDefault()
      e.stopPropagation()
      close(true)
      return
    }
    const move: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLUMNS, ArrowDown: COLUMNS }
    const cell = e.target as HTMLElement
    if (move[e.key] === undefined || !cell.dataset.cell) return
    const cells = [...(cell.parentElement?.querySelectorAll<HTMLElement>('[data-cell]') ?? [])]
    const next = cells[cells.indexOf(cell) + move[e.key]]
    if (next) {
      e.preventDefault()
      next.focus()
    }
  }

  const chooseHour = (h: string) => onChange(`${h}:${mm || '00'}`)
  const chooseMinute = (m: string) => {
    onChange(`${hh || '09'}:${m}`)
    close(true)
  }
  // Only one stop per grid for Tab; the arrows do the rest.
  const stop = (current: string, cell: string, first: string) => (current ? cell === current : cell === first)

  return (
    <div className={d.field}>
      <label className={cx(d.label, labelHidden && d.hidden)} htmlFor={id}>
        {label}
      </label>
      <div className={d.wrap} ref={wrap} onKeyDown={onKeyDown}>
        <button ref={trigger} id={id} type="button" className={d.trigger} aria-haspopup="dialog" aria-expanded={open} onClick={() => (open ? close(false) : show())}>
          <span className={value ? undefined : d.placeholder}>{value || placeholder}</span>
          <Clock aria-hidden="true" />
        </button>

        {open && (
          <div className={cx(d.popover, align === 'end' && d.end, up && d.up)} role="dialog" aria-label={`Choose ${label.toLowerCase()}`}>
            <div className={s.legend}>Hour</div>
            <div className={s.grid} ref={hourGrid} role="group" aria-label="Hour">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-cell
                  tabIndex={stop(hh, h, '09') ? 0 : -1}
                  aria-pressed={h === hh}
                  className={cx(s.cell, h === hh && s.selected)}
                  onClick={() => chooseHour(h)}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className={s.legend}>Minute</div>
            <div className={s.grid} role="group" aria-label="Minute">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-cell
                  tabIndex={stop(mm, m, '00') ? 0 : -1}
                  aria-pressed={m === mm}
                  className={cx(s.cell, m === mm && s.selected)}
                  onClick={() => chooseMinute(m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className={d.foot}>
              <Button size="small" onClick={() => close(true)}>
                Done
              </Button>
              {allowClear && value && (
                <Button tone="ghost" size="small" onClick={() => { onChange(''); close(true) }}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      {help && <div className={d.help}>{help}</div>}
    </div>
  )
}
