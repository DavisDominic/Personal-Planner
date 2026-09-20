import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button/Button'
import { InlineMessage } from '../../components/Feedback/Feedback'
import { ReflectionCollapsed, ReflectionEditor } from '../../components/Reflection/ReflectionEditor'
import { deleteReflection, getReflection, periodBounds, restoreReflection, saveReflection } from '../../domain/index'
import type { ReflectionPeriodType } from '../../domain/index'
import { dayLong, monthTitle, weekTitle } from '../../lib/dateFormat'
import { useToast } from '../useToast'
import s from './ReflectionSection.module.css'

/** Saves shortly after the user stops typing ("save changes immediately when practical", PRD 17). */
const AUTOSAVE_MS = 600

const CANT_SAVE = "We couldn't save that change. Your previous version is still here."

const LABEL: Record<ReflectionPeriodType, string> = {
  day: 'REFLECTION / OPTIONAL',
  week: 'WEEK REFLECTION / OPTIONAL',
  month: 'MONTH REFLECTION / OPTIONAL',
  year: 'YEAR REFLECTION / OPTIONAL',
}

/** The Day's optional prompts (PRD 11). Tapping one only starts the text; nothing is required. */
const DAY_PROMPTS = ['What moved forward today?', 'Today counts because…', 'What do I want to carry into tomorrow?']

function describe(type: ReflectionPeriodType, date: string) {
  const { start, end } = periodBounds(type, date)
  if (type === 'day') return dayLong(date)
  if (type === 'week') return `the week of ${weekTitle(start, end)}`
  if (type === 'month') return monthTitle(date)
  return date.slice(0, 4)
}

/**
 * The one optional Reflection for a Day, Week, Month or Year (PRD 11). It stays a small "+ Add something"
 * until the user chooses to write, saves as they type, and never creates a record from an empty editor.
 */
export function ReflectionSection({ type, date }: { type: ReflectionPeriodType; date: string }) {
  // A new period starts fresh, so unsaved text can never land on the wrong date.
  return (
    <div className={s.wrap}>
      <ReflectionBody key={`${type}-${periodBounds(type, date).start}`} type={type} date={date} />
    </div>
  )
}

function ReflectionBody({ type, date }: { type: ReflectionPeriodType; date: string }) {
  const toast = useToast()
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(false)
  const [exists, setExists] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string>()
  const latest = useRef('')
  const timer = useRef<number>(undefined)
  const area = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let alive = true
    getReflection(type, date)
      .then((r) => {
        if (!alive) return
        latest.current = r?.content ?? ''
        setText(latest.current)
        setExists(r !== undefined)
        setEditing(r !== undefined)
        setLoaded(true)
      })
      .catch(() => alive && setError(CANT_SAVE))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Leaving with a save still pending: write it rather than lose it.
  useEffect(
    () => () => {
      if (timer.current !== undefined) {
        window.clearTimeout(timer.current)
        void saveReflection(type, date, latest.current)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const flush = () => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    return saveReflection(type, date, latest.current)
      .then((result) => {
        setExists(result.status === 'saved')
        setSaved(result.status === 'saved')
        setError(undefined)
      })
      .catch(() => setError(CANT_SAVE))
  }

  const change = (value: string) => {
    latest.current = value
    setText(value)
    setSaved(false)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void flush(), AUTOSAVE_MS)
  }

  const blur = () => {
    const pending = timer.current !== undefined
    void (pending ? flush() : Promise.resolve()).then(() => {
      // An abandoned empty editor goes back to the quiet "+ Add something".
      if (latest.current.trim() === '') setEditing(false)
    })
  }

  const remove = async () => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    try {
      const removed = await deleteReflection(type, date)
      latest.current = ''
      setText('')
      setEditing(false)
      setExists(false)
      setSaved(false)
      if (removed) {
        toast.show({
          message: 'Reflection deleted',
          actionLabel: 'Undo',
          onAction: () =>
            void restoreReflection(removed).then(() => {
              latest.current = removed.content
              setText(removed.content)
              setExists(true)
              setEditing(true)
            }),
        })
      }
    } catch {
      setError(CANT_SAVE)
    }
  }

  const startWith = (prompt: string) => {
    change(latest.current ? `${latest.current}\n\n${prompt} ` : `${prompt} `)
    area.current?.focus()
  }

  if (!loaded) return null

  if (!editing) {
    return (
      <ReflectionCollapsed
        label={LABEL[type]}
        onAdd={() => {
          setEditing(true)
          requestAnimationFrame(() => area.current?.focus())
        }}
      />
    )
  }

  return (
    <ReflectionEditor
      label={LABEL[type]}
      ariaLabel={`Reflection for ${describe(type, date)}`}
      value={text}
      onChange={change}
      onBlur={blur}
      textareaRef={area}
      status={saved ? 'Saved' : undefined}
      message={error ? <InlineMessage kind="error">{error}</InlineMessage> : undefined}
      prompts={
        type === 'day'
          ? DAY_PROMPTS.map((p) => (
              <Button key={p} tone="ghost" size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => startWith(p)}>
                {p}
              </Button>
            ))
          : undefined
      }
      actions={
        exists ? (
          <Button tone="ghost" size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => void remove()}>
            Delete
          </Button>
        ) : undefined
      }
    />
  )
}
