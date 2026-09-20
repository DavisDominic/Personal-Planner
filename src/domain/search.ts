import { db, today } from './context'
import { assertDate, timestampToDate } from './dates'
import type { DateString, Goal, OpenLoop, Reflection, Ritual, Task, Timestamp } from './types'

export type SearchKind = 'task' | 'open-loop' | 'taken-care-of' | 'ritual' | 'goal' | 'reflection'

export type SearchFilters = {
  /** Limit to these kinds. Omit for everything. */
  kinds?: SearchKind[]
  /** Only records dated on or after this. */
  from?: DateString
  /** Only records dated on or before this. */
  to?: DateString
  /** "past" is before today, "upcoming" is today or later, "all" is no limit (the default). */
  time?: 'all' | 'past' | 'upcoming'
}

/** Why a result matched, in PRD 14's ranking order. "none" is a filter-only browse with no query. */
export type SearchMatch = 'exact' | 'title' | 'content' | 'none'

type Base = {
  id: string
  title: string
  match: SearchMatch
  /** For content matches: a short excerpt around the match. */
  snippet?: string
  /** The date the record belongs to (a task's date, when a loop was resolved, when a reflection is for...). */
  date: DateString
  at: Timestamp
}

export type SearchResult = Base &
  (
    | { kind: 'task'; record: Task }
    | { kind: 'open-loop'; record: OpenLoop }
    | { kind: 'taken-care-of'; record: OpenLoop }
    | { kind: 'ritual'; record: Ritual; recordedDays: number }
    | { kind: 'goal'; record: Goal }
    | { kind: 'reflection'; record: Reflection }
  )

const ORDER: Record<SearchMatch, number> = { exact: 0, title: 1, content: 2, none: 3 }

/** Case- and accent-insensitive, so "Cafe" finds "café". */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function snippetAround(text: string, term: string): string {
  const lower = text.toLowerCase()
  const i = Math.max(0, lower.indexOf(term.toLowerCase()))
  const start = Math.max(0, i - 40)
  const end = Math.min(text.length, i + term.length + 90)
  const flat = text.slice(start, end).replace(/\s+/g, ' ').trim()
  return `${start > 0 ? '…' : ''}${flat}${end < text.length ? '…' : ''}`
}

const goalDate = (g: Goal): DateString => (g.scope === 'year' ? `${g.period}-01-01` : g.scope === 'month' ? `${g.period}-01` : g.period)

/**
 * Finds things across the whole planner (PRD 14). Every word must appear somewhere in a record. Ranking is
 * exactly: an exact title match, then a title match, then a note or content match, and within each the more
 * recent record first. There is no AI ranking. With an empty query it lists everything the filters allow,
 * newest first, so a big list of open loops can be browsed by type.
 */
export async function searchPlanner(query: string, filters: SearchFilters = {}): Promise<SearchResult[]> {
  if (filters.from) assertDate(filters.from)
  if (filters.to) assertDate(filters.to)
  const whole = fold(query).trim()
  const terms = whole.split(/\s+/).filter(Boolean)
  const now = today()

  const [tasks, loops, rituals, goals, reflections, checkins] = await Promise.all([
    db().tasks.toArray(),
    db().openLoops.toArray(),
    db().rituals.toArray(),
    db().goals.toArray(),
    db().reflections.toArray(),
    db().checkins.toArray(),
  ])
  const recorded = new Map<string, number>()
  for (const c of checkins) recorded.set(c.ritualId, (recorded.get(c.ritualId) ?? 0) + 1)

  const candidates: { result: Omit<SearchResult, 'match' | 'snippet'>; title: string; body?: string }[] = []
  const add = (result: Omit<SearchResult, 'match' | 'snippet'>, title: string, body?: string) => candidates.push({ result, title, body })

  for (const t of tasks) add({ kind: 'task', record: t, id: t.id, title: t.title, date: t.date ?? timestampToDate(t.createdAt), at: t.updatedAt } as never, t.title, t.note)
  for (const l of loops) {
    if (l.status === 'taken-care-of') {
      add({ kind: 'taken-care-of', record: l, id: l.id, title: l.title, date: timestampToDate(l.resolvedAt ?? l.updatedAt), at: l.resolvedAt ?? l.updatedAt } as never, l.title, l.note)
    } else {
      add({ kind: 'open-loop', record: l, id: l.id, title: l.title, date: l.date ?? timestampToDate(l.createdAt), at: l.updatedAt } as never, l.title, l.note)
    }
  }
  for (const r of rituals) add({ kind: 'ritual', record: r, id: r.id, title: r.name, date: timestampToDate(r.createdAt), at: r.createdAt, recordedDays: recorded.get(r.id) ?? 0 } as never, r.name)
  for (const g of goals) add({ kind: 'goal', record: g, id: g.id, title: g.title, date: goalDate(g), at: g.updatedAt } as never, g.title, g.description)
  // A reflection has no title: it can only match on its content.
  for (const r of reflections) add({ kind: 'reflection', record: r, id: r.id, title: '', date: r.periodStart, at: r.updatedAt } as never, '', r.content)

  const results: SearchResult[] = []
  for (const { result, title, body } of candidates) {
    if (filters.kinds && !filters.kinds.includes(result.kind)) continue
    if (filters.from && result.date < filters.from) continue
    if (filters.to && result.date > filters.to) continue
    if (filters.time === 'past' && result.date >= now) continue
    if (filters.time === 'upcoming' && result.date < now) continue

    if (terms.length === 0) {
      results.push({ ...result, match: 'none' } as SearchResult)
      continue
    }
    const t = fold(title)
    const all = `${t} ${fold(body ?? '')}`
    if (!terms.every((term) => all.includes(term))) continue
    const inTitle = terms.every((term) => t.includes(term))
    const match: SearchMatch = t === whole ? 'exact' : inTitle ? 'title' : 'content'
    const snippet = match === 'content' && body ? snippetAround(body, terms.find((term) => fold(body).includes(term)) ?? terms[0]) : undefined
    results.push({ ...result, match, snippet } as SearchResult)
  }

  return results.sort((a, b) => ORDER[a.match] - ORDER[b.match] || b.date.localeCompare(a.date) || b.at.localeCompare(a.at))
}
