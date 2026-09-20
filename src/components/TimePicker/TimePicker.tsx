import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Clock } from 'lucide-react'
import { cx } from '../../lib/cx'
import { formatTime } from '../../lib/dateFormat'
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

const two = (n: number) => String(n).padStart(2, '0')
const MINUTES = Array.from({ length: 60 }, (_, i) => two(i))
/** Room the picker needs, used to decide whether it opens upward. */
const NEEDED_SPACE = 340

/**
 * A time picker in the same style as the date picker, in place of the browser's own. Like the native one it is
 * a clock: scrolling columns for hour (00-23) and minute (00-59). The value is 24-hour "HH:mm". Arrow keys move
 * within a column, Escape closes.
 */
export function TimePicker({ label, labelHidden, value, onChange, allowClear, placeholder = 'Choose a time', help, align = 'start' }: TimePickerProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)

  const [hh, mm] = value ? value.split(':') : ['', '']
  const h24 = hh === '' ? undefined : Number(hh)
  const hourCells = Array.from({ length: 24 }, (_, i) => i)

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

  // Open on the current choice: scroll each column to it and focus the hour.
  useEffect(() => {
    if (!open) return
    popover.current?.querySelectorAll<HTMLElement>('[aria-pressed="true"]').forEach((el) => el.scrollIntoView({ block: 'center' }))
    popover.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
  }, [open])

  // Keep the chosen hour and minute in view as they change.
  useEffect(() => {
    if (open) popover.current?.querySelectorAll<HTMLElement>('[aria-pressed="true"]').forEach((el) => el.scrollIntoView({ block: 'nearest' }))
  }, [open, value])


  // The popover is centred on a phone, so it would otherwise hang there while the page moved
  // underneath. Any scroll outside it closes it.
  useEffect(() => {
    if (!open) return
    const onScroll = (e: Event) => {
      if (!popover.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
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
    const move: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -1, ArrowRight: 1 }
    const cell = e.target as HTMLElement
    if (move[e.key] === undefined || !cell.dataset.cell) return
    const cells = [...(cell.parentElement?.querySelectorAll<HTMLElement>('[data-cell]') ?? [])]
    const next = cells[cells.indexOf(cell) + move[e.key]]
    if (next) {
      e.preventDefault()
      next.focus()
      next.scrollIntoView({ block: 'nearest' })
    }
  }

  const commit = (hour24: number, minute: string) => onChange(`${two(hour24)}:${minute}`)
  const chooseHour = (h: number) => commit(h, mm || '00')
  const chooseMinute = (m: string) => commit(h24 ?? 9, m)
  // Only one Tab stop per column; the arrows do the rest.
  const stop = (chosen: boolean, cell: boolean, first: boolean) => (chosen ? cell : first)

  return (
    <div className={d.field}>
      <label className={cx(d.label, labelHidden && d.hidden)} htmlFor={id}>
        {label}
      </label>
      <div className={d.wrap} ref={wrap} onKeyDown={onKeyDown}>
        <button ref={trigger} id={id} type="button" className={d.trigger} aria-haspopup="dialog" aria-expanded={open} onClick={() => (open ? close(false) : show())}>
          <span className={value ? undefined : d.placeholder}>{value ? formatTime(value) : placeholder}</span>
          <Clock aria-hidden="true" />
        </button>

        {open && <div className={d.scrim} aria-hidden="true" onClick={() => close(false)} />}

        {open && (
          <div ref={popover} className={cx(d.popover, align === 'end' && d.end, up && d.up)} role="dialog" aria-label={`Choose ${label.toLowerCase()}`}>
            <div className={s.cols}>
              <div className={s.colWrap}>
                <div className={s.legend}>Hour</div>
                <div className={s.col} role="group" aria-label="Hour">
                  {hourCells.map((h, i) => (
                    <button
                      key={h}
                      type="button"
                      data-cell
                      tabIndex={stop(h24 !== undefined, h === h24, i === 0) ? 0 : -1}
                      aria-pressed={h === h24}
                      className={cx(s.cell, h === h24 && s.selected)}
                      onClick={() => chooseHour(h)}
                    >
                      {two(h)}
                    </button>
                  ))}
                </div>
              </div>
              <div className={s.colWrap}>
                <div className={s.legend}>Minute</div>
                <div className={s.col} role="group" aria-label="Minute">
                  {MINUTES.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      data-cell
                      tabIndex={stop(mm !== '', m === mm, i === 0) ? 0 : -1}
                      aria-pressed={m === mm}
                      className={cx(s.cell, m === mm && s.selected)}
                      onClick={() => chooseMinute(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
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
