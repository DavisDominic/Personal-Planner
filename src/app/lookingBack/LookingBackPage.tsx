import { useState } from 'react'
import { Archive, NotebookPen } from 'lucide-react'
import { Button } from '../../components/Button/Button'
import { CalendarToolbar } from '../../components/Calendar/Calendar'
import { Card, CardHead, CardKicker, CardRule } from '../../components/Card/Card'
import { FilterChips } from '../../components/Search/Search'
import { TaskRow } from '../../components/Task/Task'
import { addDays, addMonths, getLookingBack, periodBounds, toDateString, today } from '../../domain/index'
import type { LookingBackRange, OpenLoop, Reflection, Task, TimelineEntry } from '../../domain/index'
import { dayRelative, dayShort, monthTitle, weekTitle } from '../../lib/dateFormat'
import t from '../../styles/typography.module.css'
import { OpenLoopDetailDialog } from '../day/OpenLoopDetailDialog'
import { TaskDetailDialog } from '../day/TaskDetailDialog'
import { ReflectionSection } from '../reflection/ReflectionSection'
import { useLive } from '../useLive'
import s from './LookingBackPage.module.css'

type Scope = 'recent' | 'week' | 'month' | 'year' | 'all'

const SCOPES: { id: Scope; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'all', label: 'All time' },
]

/** "Recent" is the last two weeks, ending today. */
const RECENT_DAYS = 14
const TASKS_SHOWN = 5
const TIMELINE_PAGE = 40

const PERIOD_WORD = { day: 'Day', week: 'Week', month: 'Month', year: 'Year' } as const

const excerpt = (text: string, max: number) => {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat
}

function reflectionLabel(r: Reflection) {
  if (r.periodType === 'day') return dayShort(r.periodStart)
  if (r.periodType === 'week') return weekTitle(r.periodStart, r.periodEnd)
  if (r.periodType === 'month') return monthTitle(r.periodStart)
  return r.periodStart.slice(0, 4)
}

const KIND_LABEL: Record<TimelineEntry['kind'], string> = {
  task: 'Task completed',
  ritual: 'Ritual check-in',
  loop: 'Taken care of',
  reflection: 'Reflection',
}

/**
 * Looking Back (PRD 13): an evidence timeline of what actually happened. It shows facts only: no score,
 * good or bad day, ranking or interpretation. Empty is valid, and a quiet period is just a quiet period.
 */
export function LookingBackPage() {
  const now = today()
  const [scope, setScope] = useState<Scope>('recent')
  const [anchor, setAnchor] = useState(now)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [timelineCount, setTimelineCount] = useState(TIMELINE_PAGE)
  // History is a record of real things: opening one leads to the usual actions (reopen, delete).
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [openLoop, setOpenLoop] = useState<OpenLoop | null>(null)

  const periodType = scope === 'week' || scope === 'month' || scope === 'year' ? scope : undefined
  const bounds = periodType ? periodBounds(periodType, anchor) : undefined
  const range: LookingBackRange =
    scope === 'all' ? null : scope === 'recent' ? { start: addDays(now, -(RECENT_DAYS - 1)), end: now } : bounds!

  const data = useLive(() => getLookingBack(range), `${scope}|${range?.start}|${range?.end}`)

  const changeScope = (label: string) => {
    setScope(SCOPES.find((x) => x.label === label)!.id)
    setAnchor(now)
    setShowAllTasks(false)
    setTimelineCount(TIMELINE_PAGE)
  }
  const step = (dir: 1 | -1) => setAnchor(scope === 'year' ? addMonths(anchor, dir * 12) : scope === 'month' ? addMonths(anchor, dir) : addDays(anchor, dir * 7))
  const title = scope === 'week' ? weekTitle(bounds!.start, bounds!.end) : scope === 'month' ? monthTitle(anchor) : anchor.slice(0, 4)
  const isCurrent = !!bounds && now >= bounds.start && now <= bounds.end

  const dateOf = (iso: string) => toDateString(new Date(iso))
  const tasks = data?.tasksDone ?? []
  const shownTasks = showAllTasks ? tasks : tasks.slice(0, TASKS_SHOWN)
  /** Tasks and open loops open their own dialog; a check-in or a reflection has nothing to open. */
  const openEntry = (e: TimelineEntry) => {
    if (e.kind === 'task') {
      const task = data?.tasksDone.find((x) => x.id === e.id)
      return task && (() => setOpenTask(task))
    }
    if (e.kind === 'loop') {
      const loop = data?.resolvedLoops.find((x) => x.id === e.id)
      return loop && (() => setOpenLoop(loop))
    }
    return undefined
  }
  const empty = !!data && data.timeline.length === 0
  const facts = data && data.recordedDays > 0

  return (
    <section>
      <div className={t.typeCaption}>What happened</div>
      <h1 className={s.title}>Looking Back</h1>

      <FilterChips label="Time scope" items={SCOPES.map((x) => x.label)} value={SCOPES.find((x) => x.id === scope)!.label} onChange={changeScope} />

      {periodType && (
        <div className={s.period}>
          <CalendarToolbar
            heading="h2"
            caption={periodType}
            title={title}
            previousLabel={`Previous ${periodType}`}
            nextLabel={`Next ${periodType}`}
            onPrevious={() => step(-1)}
            onNext={() => step(1)}
          >
            <Button tone="lemon" disabled={isCurrent} onClick={() => setAnchor(now)}>
              Show this {periodType}
            </Button>
          </CalendarToolbar>
        </div>
      )}

      <p className={`${t.typeCaption} ${s.facts}`}>
        {scope === 'recent' && `Last ${RECENT_DAYS} days`}
        {scope === 'all' && 'All time'}
        {facts && `${scope === 'recent' || scope === 'all' ? ' · ' : ''}${data!.recordedDays} recorded ${data!.recordedDays === 1 ? 'day' : 'days'}`}
        {data?.recordBegins && ` · Your record begins ${dayRelative(data.recordBegins)}`}
      </p>

      {empty && <p className={t.typeSmall}>Nothing recorded for this period.</p>}

      {data && !empty && (
        <div className={s.grid}>
          <div className={s.col}>
            {tasks.length > 0 && (
              <Card kind="color" tone="periwinkle">
                <CardKicker>THINGS I DID</CardKicker>
                <div className={`${t.typeH1} ${s.big}`}>{tasks.length}</div>
                <div className={t.typeSmall}>completed {tasks.length === 1 ? 'task' : 'tasks'}</div>
                {data.prioritiesDone > 0 && (
                  <div className={`${t.typeSmall} ${s.sub}`}>
                    {data.prioritiesDone} {data.prioritiesDone === 1 ? 'was a priority' : 'were priorities'}
                  </div>
                )}
                <CardRule />
                {shownTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    title={task.title}
                    meta={[dayRelative(dateOf(task.completedAt!)), task.priority !== undefined && `P${task.priority}`].filter(Boolean).join(' · ')}
                    note={task.note}
                    bare
                    quiet
                    onColor
                    onOpen={() => setOpenTask(task)}
                  />
                ))}
                {tasks.length > TASKS_SHOWN && (
                  <div className={s.more}>
                    <Button size="small" aria-expanded={showAllTasks} onClick={() => setShowAllTasks((v) => !v)}>
                      {showAllTasks ? 'Show fewer' : `+${tasks.length - TASKS_SHOWN} more — Show`}
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {data.rituals.length > 0 && (
              <Card kind="color" tone="periwinkle">
                <CardKicker>THINGS I KEPT DOING</CardKicker>
                <div className={`${t.typeH1} ${s.big}`}>{data.checkinCount}</div>
                <div className={t.typeSmall}>ritual {data.checkinCount === 1 ? 'check-in' : 'check-ins'}</div>
                <CardRule />
                {data.rituals.map((r) => (
                  <TaskRow
                    key={r.ritualId}
                    title={r.name}
                    meta={`${r.checkins} ${r.checkins === 1 ? 'check-in' : 'check-ins'}`}
                    bare
                    quiet
                    onColor
                  />
                ))}
              </Card>
            )}

            {data.resolvedLoops.length > 0 && (
              <Card kind="color" tone="periwinkle">
                <CardKicker>TAKEN CARE OF</CardKicker>
                <div className={`${t.typeH1} ${s.big}`}>{data.resolvedLoops.length}</div>
                <div className={t.typeSmall}>open {data.resolvedLoops.length === 1 ? 'loop' : 'loops'} taken care of</div>
                <CardRule />
                {data.resolvedLoops.map((loop) => (
                  <TaskRow
                    key={loop.id}
                    title={loop.title}
                    meta={dayRelative(dateOf(loop.resolvedAt!))}
                    note={loop.note}
                    bare
                    quiet
                    onColor
                    onOpen={() => setOpenLoop(loop)}
                  />
                ))}
              </Card>
            )}
          </div>

          <div className={s.col}>
            <Card>
              <CardHead kicker="TIMELINE" title="What was recorded" icon={<Archive aria-hidden="true" />} />
              {data.timeline.slice(0, timelineCount).map((e, i) => (
                <TaskRow
                  key={`${e.kind}-${e.id}-${i}`}
                  title={e.kind === 'reflection' ? excerpt(e.title, 90) : e.title}
                  meta={`${e.kind === 'reflection' ? `${PERIOD_WORD[e.periodType!]} reflection` : KIND_LABEL[e.kind]} · ${dayRelative(e.date)}${e.priority !== undefined ? ` · P${e.priority}` : ''}`}
                  bare
                  quiet
                  onOpen={openEntry(e)}
                />
              ))}
              {data.timeline.length > timelineCount && (
                <div className={s.more}>
                  <Button size="small" onClick={() => setTimelineCount((n) => n + TIMELINE_PAGE)}>
                    Show more
                  </Button>
                </div>
              )}
            </Card>

            {data.reflections.length > 0 && (
              <Card>
                <CardHead kicker="REFLECTIONS" title={`${data.reflections.length} written`} icon={<NotebookPen aria-hidden="true" />} />
                {data.reflections.map((r) => (
                  <TaskRow
                    key={r.id}
                    title={reflectionLabel(r)}
                    meta={`${PERIOD_WORD[r.periodType]} reflection`}
                    note={excerpt(r.content, 220)}
                    bare
                    quiet
                  />
                ))}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* The Year's reflection lives here, not on the Year view (PRD 12 keeps that to three things). */}
      {scope === 'year' && <ReflectionSection type="year" date={anchor} />}

      <TaskDetailDialog task={openTask} onClose={() => setOpenTask(null)} />
      <OpenLoopDetailDialog loop={openLoop} day={now} onClose={() => setOpenLoop(null)} />
    </section>
  )
}
