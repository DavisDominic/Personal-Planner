import { useState } from 'react'
import { Brain, ListChecks, ListOrdered, Repeat } from 'lucide-react'
import { Button } from '../../components/Button/Button'
import { Card, CardHead } from '../../components/Card/Card'
import { TaskRow } from '../../components/Task/Task'
import { checkRitual, completeTask, getDayContents, reopenOpenLoop, reopenTask, resolveOpenLoop, today } from '../../domain/index'
import type { Task } from '../../domain/index'
import t from '../../styles/typography.module.css'
import { CalendarNav } from '../calendar/CalendarNav'
import { dayTitle, weekdayLong } from '../dateFormat'
import { useCapture } from '../useCapture'
import { useLive } from '../useLive'
import { useToast } from '../useToast'
import s from './DayView.module.css'

/** Open loops and rituals show a few, then "+N more" (PRD 12: progressive disclosure). */
const LOOPS_SHOWN = 3
const RITUALS_SHOWN = 2

const CANT_SAVE = "We couldn't save that change. Your previous version is still here."

const taskMeta = (task: Task) => [task.priority !== undefined && `P${task.priority}`, task.date === undefined ? 'every day' : undefined, task.time].filter(Boolean).join(' · ') || undefined

export function DayView({ date }: { date: string }) {
  const day = useLive(() => getDayContents(date), date)
  const capture = useCapture()
  const toast = useToast()
  const [showDone, setShowDone] = useState(false)
  const [showLoops, setShowLoops] = useState(false)
  const [showRituals, setShowRituals] = useState(false)

  const isToday = date === today()
  const caption = `${isToday ? 'Today / ' : ''}${weekdayLong(date)}`

  const safely = (action: Promise<unknown>) => action.catch(() => toast.show({ message: CANT_SAVE }))

  const taskRow = (task: Task) => (
    <TaskRow
      key={task.id}
      title={task.title}
      meta={taskMeta(task)}
      note={task.note}
      done={task.status === 'completed'}
      onToggle={(done) => void safely(done ? completeTask(task.id) : reopenTask(task.id))}
      onColor
    />
  )

  const priorities = day?.priorities ?? []
  const tasks = day?.tasks ?? []
  const remaining = tasks.filter((x) => x.status !== 'completed')
  const completed = tasks.filter((x) => x.status === 'completed')
  const remainingCount = remaining.length + priorities.filter((x) => x.status !== 'completed').length
  const completedCount = completed.length + priorities.filter((x) => x.status === 'completed').length

  const loops = day?.openLoops ?? []
  const shownLoops = showLoops ? loops : loops.slice(0, LOOPS_SHOWN)
  const rituals = day?.rituals ?? []
  const shownRituals = showRituals ? rituals : rituals.slice(0, RITUALS_SHOWN)

  return (
    <div>
      <CalendarNav view="day" date={date} caption={caption} title={dayTitle(date)} />

      <div className={s.summary}>
        <div className={`${t.typeSmall} ${s.counts}`}>{day && `${remainingCount} remaining · ${completedCount} completed`}</div>
        <Button tone="lemon" onClick={() => capture.open({ date })}>
          + Capture
        </Button>
      </div>

      {day && (
        <div className={s.grid}>
          {priorities.length > 0 && (
            <Card tone="lemon">
              <CardHead kicker="IN THIS ORDER" title="Priorities" icon={<ListOrdered aria-hidden="true" />} />
              {priorities.map(taskRow)}
            </Card>
          )}

          <Card kind="color" tone="coral">
            <CardHead kicker="TASKS" title={`Remaining · ${remaining.length}`} icon={<ListChecks aria-hidden="true" />} />
            {remaining.map(taskRow)}
            {tasks.length === 0 && priorities.length === 0 && (
              <div className={s.empty}>
                <Button size="small" onClick={() => capture.open({ tab: 'task', date })}>
                  + Add a task
                </Button>
              </div>
            )}
            {completed.length > 0 && (
              <>
                <div className={s.disclose}>
                  <Button size="small" aria-expanded={showDone} aria-controls="day-completed" onClick={() => setShowDone((v) => !v)}>
                    Completed · {completed.length} — {showDone ? 'Hide' : 'Show'}
                  </Button>
                </div>
                {showDone && <div id="day-completed">{completed.map(taskRow)}</div>}
              </>
            )}
          </Card>

          {loops.length > 0 && (
            <Card tone="peach">
              <CardHead kicker="ON MY MIND" title={`${loops.length} Open ${loops.length === 1 ? 'Loop' : 'Loops'}`} icon={<Brain aria-hidden="true" />} />
              {shownLoops.map((loop) => (
                <TaskRow
                  key={loop.id}
                  title={loop.title}
                  note={loop.note}
                  checkLabel={`Taken care of: ${loop.title}`}
                  done={false}
                  onToggle={() =>
                    void safely(
                      resolveOpenLoop(loop.id).then(() =>
                        toast.show({ message: 'Taken care of', actionLabel: 'Undo', onAction: () => void reopenOpenLoop(loop.id) }),
                      ),
                    )
                  }
                  onColor
                />
              ))}
              {loops.length > LOOPS_SHOWN && (
                <div className={s.disclose}>
                  <Button size="small" aria-expanded={showLoops} onClick={() => setShowLoops((v) => !v)}>
                    {showLoops ? 'Show fewer' : `+${loops.length - LOOPS_SHOWN} more — Show`}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {rituals.length > 0 && (
            <Card tone="sage">
              <CardHead
                kicker="RITUALS"
                title={`${rituals.filter((r) => r.checked).length} of ${rituals.length} checked`}
                icon={<Repeat aria-hidden="true" />}
              />
              {shownRituals.map(({ ritual, checked, recordedDays }) => (
                <TaskRow
                  key={ritual.id}
                  title={ritual.name}
                  meta={`${recordedDays} recorded ${recordedDays === 1 ? 'day' : 'days'}`}
                  done={checked}
                  strikeWhenDone={false}
                  onToggle={() => void safely(checkRitual(ritual.id, date))}
                  onColor
                />
              ))}
              {rituals.length > RITUALS_SHOWN && (
                <div className={s.disclose}>
                  <Button size="small" aria-expanded={showRituals} onClick={() => setShowRituals((v) => !v)}>
                    {showRituals ? 'Show fewer' : `+${rituals.length - RITUALS_SHOWN} more — Show`}
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
