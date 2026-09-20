import { Fragment, useDeferredValue, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/Button/Button'
import { Card } from '../../components/Card/Card'
import { DatePicker } from '../../components/DatePicker/DatePicker'
import { FilterChips, SearchBar } from '../../components/Search/Search'
import { reopenOpenLoop, resolveOpenLoop, searchPlanner, today } from '../../domain/index'
import type { SearchFilters, SearchKind, SearchMatch, SearchResult } from '../../domain/index'
import { cx } from '../../lib/cx'
import { dayRelative } from '../../lib/dateFormat'
import t from '../../styles/typography.module.css'
import { calendarPath } from '../calendar/calendarPaths'
import { OpenLoopDetailDialog } from '../day/OpenLoopDetailDialog'
import { TaskDetailDialog } from '../day/TaskDetailDialog'
import { GoalDialog } from '../goals/GoalDialog'
import type { GoalTarget } from '../goals/GoalDialog'
import { goalDate, periodLabel } from '../goals/goalLabels'
import { useLive } from '../useLive'
import { useToast } from '../useToast'
import type { OpenLoop, Task } from '../../domain/index'
import s from './SearchPage.module.css'

const KIND_FILTERS: { label: string; kinds?: SearchKind[] }[] = [
  { label: 'All' },
  { label: 'Tasks', kinds: ['task'] },
  { label: 'Open loops', kinds: ['open-loop'] },
  { label: 'Taken care of', kinds: ['taken-care-of'] },
  { label: 'Rituals', kinds: ['ritual'] },
  { label: 'Goals', kinds: ['goal'] },
  { label: 'Reflections', kinds: ['reflection'] },
]
const TIME_FILTERS = [
  { label: 'All time', time: 'all' as const },
  { label: 'Past', time: 'past' as const },
  { label: 'Upcoming', time: 'upcoming' as const },
]

const PAGE = 30

const MATCH_LABEL: Record<SearchMatch, string> = { exact: 'EXACT MATCH', title: 'TITLE MATCH', content: 'CONTENT MATCH', none: '' }
const KIND_WORD: Record<SearchKind, string> = {
  task: 'Task', 'open-loop': 'Open loop', 'taken-care-of': 'Taken care of', ritual: 'Ritual', goal: 'Goal', reflection: 'Reflection',
}
const PERIOD_WORD = { day: 'Day', week: 'Week', month: 'Month', year: 'Year' } as const

/** Bolds the words that were searched for. Purely visual; the ranking is done in the domain. */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>
  const escaped = terms.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'))
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className={s.mark}>
            {p}
          </mark>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}

function metaFor(r: SearchResult): string {
  const base = KIND_WORD[r.kind]
  switch (r.kind) {
    case 'task': {
      const extra = [
        r.record.date === undefined ? 'every day' : dayRelative(r.date),
        r.record.status === 'completed' ? 'done' : r.record.status === 'no-longer-relevant' ? 'no longer relevant' : undefined,
        r.record.priority !== undefined ? `P${r.record.priority}` : undefined,
      ]
      return [base, ...extra].filter(Boolean).join(' · ')
    }
    case 'ritual':
      return `${base} · ${r.recordedDays} recorded ${r.recordedDays === 1 ? 'day' : 'days'}${r.record.archivedAt ? ' · archived' : ''}`
    case 'goal':
      return `${r.record.scope.charAt(0).toUpperCase()}${r.record.scope.slice(1)} goal · ${periodLabel(r.record.scope, goalDate(r.record))}${r.record.status === 'archived' ? ' · archived' : ''}`
    case 'reflection':
      return `${PERIOD_WORD[r.record.periodType]} reflection · ${dayRelative(r.date)}`
    default:
      return `${base} · ${dayRelative(r.date)}`
  }
}

/** Where a reflection lives: its own period's view (a Year reflection is written in Looking Back). */
const reflectionPath = (r: Extract<SearchResult, { kind: 'reflection' }>) =>
  r.record.periodType === 'year' ? '/looking-back' : calendarPath(r.record.periodType, r.record.periodStart)

/**
 * Search (PRD 14): the safety net for hundreds of open loops and years of history. Results are ranked exactly:
 * exact title, then title, then note or content, then more recent. Choosing only a type (no words) browses
 * everything of that type.
 */
export function SearchPage() {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [kindLabel, setKindLabel] = useState('All')
  const [timeLabel, setTimeLabel] = useState('All time')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [count, setCount] = useState(PAGE)
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [openLoop, setOpenLoop] = useState<OpenLoop | null>(null)
  const [goal, setGoal] = useState<GoalTarget | null>(null)
  const input = useRef<HTMLInputElement>(null)

  // Ctrl/Cmd + K while already here just focuses the box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') input.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const q = useDeferredValue(query)
  const filters: SearchFilters = {
    kinds: KIND_FILTERS.find((k) => k.label === kindLabel)?.kinds,
    time: TIME_FILTERS.find((x) => x.label === timeLabel)?.time,
    from: from || undefined,
    to: to || undefined,
  }
  const filtered = kindLabel !== 'All' || timeLabel !== 'All time' || !!from || !!to
  const browsing = q.trim() !== '' || filtered
  const key = JSON.stringify([q, filters])
  const results = useLive(() => (browsing ? searchPlanner(q, filters) : Promise.resolve([] as SearchResult[])), key)
  const terms = q.split(/\s+/).filter(Boolean)

  const clearFilters = () => {
    setKindLabel('All')
    setTimeLabel('All time')
    setFrom('')
    setTo('')
  }
  const reset = () => setCount(PAGE)

  const reopen = (r: Extract<SearchResult, { kind: 'taken-care-of' }>) =>
    void reopenOpenLoop(r.id).then(() => toast.show({ message: 'Reopened', actionLabel: 'Undo', onAction: () => void resolveOpenLoop(r.id) }))

  const titleFor = (r: SearchResult) => {
    const text = r.kind === 'reflection' ? `${PERIOD_WORD[r.record.periodType]} reflection` : r.title
    const node = <Highlight text={text} terms={r.kind === 'reflection' ? [] : terms} />
    const open =
      r.kind === 'task' ? () => setOpenTask(r.record)
      : r.kind === 'open-loop' ? () => setOpenLoop(r.record)
      : r.kind === 'goal' ? () => setGoal({ kind: 'edit', goal: r.record })
      : undefined
    if (open) {
      return (
        <button type="button" className={s.titleButton} onClick={open}>
          {node}
        </button>
      )
    }
    if (r.kind === 'reflection') {
      return (
        <Link to={reflectionPath(r)} className={s.titleLink}>
          {node}
        </Link>
      )
    }
    return node
  }

  const shown = (results ?? []).slice(0, count)

  return (
    <section>
      <div className={t.typeCaption}>Find anything</div>
      <h1 className={s.title}>Search</h1>

      <SearchBar
        placeholder="Search tasks, open loops, goals, reflections and notes…"
        value={query}
        onChange={(v) => {
          setQuery(v)
          reset()
        }}
        autoFocus
        inputRef={input}
      />

      <div className={s.filters}>
        <div className={s.row}>
          <div className={t.typeCaption}>Type</div>
          <div className={s.control}>
<FilterChips label="Type" items={KIND_FILTERS.map((k) => k.label)} value={kindLabel} onChange={(v) => { setKindLabel(v); reset() }} />
</div>
        </div>
        <div className={s.row}>
          <div className={t.typeCaption}>Time</div>
          <div className={s.control}>
<FilterChips label="Time scope" variant="segmented" items={TIME_FILTERS.map((x) => x.label)} value={timeLabel} onChange={(v) => { setTimeLabel(v); reset() }} />
</div>
        </div>
        <div className={s.row}>
          <div className={t.typeCaption}>Between</div>
          <div className={cx(s.control, s.range)}>
            <DatePicker label="From" labelHidden allowClear placeholder="From" value={from} onChange={(v) => { setFrom(v); reset() }} />
            <DatePicker label="To" labelHidden allowClear placeholder="To" value={to} onChange={(v) => { setTo(v); reset() }} />
            {filtered && (
              <Button tone="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {!browsing && (
        <p className={t.typeSmall}>Type to search, or pick a type above to browse everything of that kind.</p>
      )}

      {browsing && results && (
        <>
          <p className={cx(t.typeCaption, s.count)} role="status">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
          {results.length === 0 && (
            <p className={t.typeSmall}>
              Nothing found{q.trim() ? ` for “${q.trim()}”` : ''}.{filtered ? ' Filters are on; clearing them may show more.' : ''}
            </p>
          )}
          <div className={s.results}>
            {shown.map((r) => (
              <Card as="article" key={`${r.kind}-${r.id}`}>
                <div className={t.typeLabel}>{MATCH_LABEL[r.match] || KIND_WORD[r.kind].toUpperCase()}</div>
                <div className={cx(t.typeH3, s.resultTitle)}>{titleFor(r)}</div>
                <div className={cx(t.typeSmall, s.meta)}>{metaFor(r)}</div>
                {r.snippet && (
                  <div className={cx(t.typeSmall, s.snippet)}>
                    <Highlight text={r.snippet} terms={terms} />
                  </div>
                )}
                {r.kind === 'taken-care-of' && (
                  <div className={s.actions}>
                    <Button size="small" onClick={() => reopen(r)}>
                      Reopen
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
          {results.length > count && (
            <div className={s.more}>
              <Button onClick={() => setCount((n) => n + PAGE)}>Show more</Button>
            </div>
          )}
        </>
      )}

      <TaskDetailDialog task={openTask} onClose={() => setOpenTask(null)} />
      <OpenLoopDetailDialog loop={openLoop} day={today()} onClose={() => setOpenLoop(null)} />
      <GoalDialog target={goal} onClose={() => setGoal(null)} />
    </section>
  )
}
