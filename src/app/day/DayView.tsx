import { useState } from 'react'
import { Brain, History, ListChecks, ListOrdered, Repeat } from 'lucide-react'
import { Button } from '../../components/Button/Button'
import { Card, CardHead } from '../../components/Card/Card'
import { TaskRow } from '../../components/Task/Task'
import {
  addDays, checkRitual, completeTask, getDayContents, moveTask, moveTaskToToday, reopenOpenLoop, reopenTask, resolveOpenLoop, today,
} from '../../domain/index'
import type { OpenLoop, Task } from '../../domain/index'
import t from '../../styles/typography.module.css'
import { CalendarNav } from '../calendar/CalendarNav'
import { dayShort, dayTitle, formatTime, weekdayLong } from '../../lib/dateFormat'
import { useCapture } from '../useCapture'
import { useLive } from '../useLive'
import { ReflectionSection } from '../reflection/ReflectionSection'
import { useToast } from '../useToast'
import s from './DayView.module.css'
import { OpenLoopDetailDialog } from './OpenLoopDetailDialog'
import { TaskDetailDialog } from './TaskDetailDialog'

/** Open loops and rituals show a few, then "+N more" (PRD 12: progressive disclosure). */
const LOOPS_SHOWN = 3
const RITUALS_SHOWN = 2

const CANT_SAVE = "We couldn't save that change. Your previous version is still here."

const join = (parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' · ') || undefined

const taskMeta = (task: Task) => join([task.priority !== undefined && `P${task.priority}`, task.date === undefined && 'every day', task.time && formatTime(task.time)])

export function DayView({ date }: { date: string }) {
  const day = useLive(() => getDayContents(date), date)
  const capture = useCapture()
  const toast = useToast()
  const [showDone, setShowDone] = useState(false)
  const [showLoops, setShowLoops] = useState(false)
  const [showTaken, setShowTaken] = useState(false)
  const [showRituals, setShowRituals] = useState(false)
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [openLoop, setOpenLoop] = useState<OpenLoop | null>(null)

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
      onOpen={() => setOpenTask(task)}
      onColor
    />
  )

  /** PRD 7 "Complete today": the task's date becomes today. It is not marked done. */
  const bringToToday = (task: Task) =>
    void safely(
      moveTaskToToday(task.id).then(() =>
        toast.show({ message: 'Moved to today', actionLabel: 'Undo', onAction: () => void moveTask(task.id, task.date!) }),
      ),
    )

  const earlierRow = (task: Task, showDate: boolean) => (
    <TaskRow
      key={task.id}
      title={task.title}
      meta={join([showDate && dayShort(task.date!), task.priority !== undefined && `P${task.priority}`, task.time && formatTime(task.time)])}
      note={task.note}
      done={false}
      onToggle={() => void safely(completeTask(task.id))}
      onOpen={() => setOpenTask(task)}
      actions={
        <Button size="small" onClick={() => bringToToday(task)}>
          Complete today
        </Button>
      }
      onColor
    />
  )

  const priorities = day?.priorities ?? []
  const tasks = day?.tasks ?? []
  const remaining = tasks.filter((x) => x.status !== 'completed')
  const completed = tasks.filter((x) => x.status === 'completed')
  const remainingCount = remaining.length + priorities.filter((x) => x.status !== 'completed').length
  const completedCount = completed.length + priorities.filter((x) => x.status === 'completed').length

  // Unfinished tasks from earlier days are surfaced on today's Day only, with neutral wording.
  const yesterday = addDays(date, -1)
  const earlier = isToday ? (day?.earlier ?? []) : []
  const fromYesterday = earlier.filter((x) => x.date === yesterday)
  const fromEarlier = earlier.filter((x) => x.date !== yesterday)

  const loops = day?.openLoops ?? []
  // Completed today: still on the day, ticked, so it can be undone or opened.
  const takenCareOf = day?.takenCareOf ?? []
  const shownLoops = showLoops ? loops : loops.slice(0, LOOPS_SHOWN)
  const rituals = day?.rituals ?? []
  const shownRituals = showRituals ? rituals : rituals.slice(0, RITUALS_SHOWN)

  return (
    <div>
      <CalendarNav view="day" date={date} caption={caption} title={dayTitle(date)} />

      <div className={s.summary}>
        <div className={`${t.typeSmall} ${s.counts}`}>{day && `${remainingCount} remaining · ${completedCount} completed`}</div>
      </div>

      <div className={s.grid}>
        {/* Doing: what to do today. */}
        <div className={s.col}>
          {day && (
            <>
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

          {fromYesterday.length > 0 && (
            <Card kind="color" tone="periwinkle">
              <CardHead kicker="FROM YESTERDAY" title={`From yesterday · ${fromYesterday.length}`} icon={<History aria-hidden="true" />} />
              {fromYesterday.map((task) => earlierRow(task, false))}
            </Card>
          )}

          {fromEarlier.length > 0 && (
            <Card kind="color" tone="periwinkle">
              <CardHead kicker="FROM EARLIER DAYS" title={`From earlier · ${fromEarlier.length}`} icon={<History aria-hidden="true" />} />
              {fromEarlier.map((task) => earlierRow(task, true))}
            </Card>
          )}
            </>
          )}
        </div>

        {/* Context: what is on my mind, my rituals, and the optional reflection. */}
        <div className={s.col}>
          {day && (
            <>
          {(loops.length > 0 || takenCareOf.length > 0) && (
            <Card tone="peach">
              <CardHead kicker="ON MY MIND" title={`${loops.length} Open ${loops.length === 1 ? 'Loop' : 'Loops'}`} icon={<Brain aria-hidden="true" />} />
              {shownLoops.map((loop) => (
                <TaskRow
                  key={loop.id}
                  title={loop.title}
                  note={loop.note}
                  checkLabel={`Completed: ${loop.title}`}
                  done={false}
                  onToggle={() =>
                    void safely(
                      resolveOpenLoop(loop.id).then(() =>
                        toast.show({ message: 'Completed', actionLabel: 'Undo', onAction: () => void reopenOpenLoop(loop.id) }),
                      ),
                    )
                  }
                  onOpen={() => setOpenLoop(loop)}
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
              {takenCareOf.length > 0 && (
                <>
                  <div className={s.disclose}>
                    <Button size="small" aria-expanded={showTaken} aria-controls="day-taken-care-of" onClick={() => setShowTaken((v) => !v)}>
                      Completed · {takenCareOf.length} — {showTaken ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  {showTaken && (
                    <div id="day-taken-care-of">
                      {takenCareOf.map((loop) => (
                        <TaskRow
                          key={loop.id}
                          title={loop.title}
                          note={loop.note}
                          checkLabel={`Back on my mind: ${loop.title}`}
                          done
                          onToggle={() =>
                            void safely(
                              reopenOpenLoop(loop.id).then(() =>
                                toast.show({ message: 'Back on my mind', actionLabel: 'Undo', onAction: () => void resolveOpenLoop(loop.id) }),
                              ),
                            )
                          }
                          onOpen={() => setOpenLoop(loop)}
                          onColor
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {rituals.length > 0 && (
            <Card tone="sage">
              <CardHead kicker="RITUALS" title={`${rituals.filter((r) => r.checked).length} of ${rituals.length} checked`} icon={<Repeat aria-hidden="true" />} />
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
            </>
          )}
          <ReflectionSection type="day" date={date} flush />
        </div>
      </div>

      <TaskDetailDialog task={openTask} onClose={() => setOpenTask(null)} />
      <OpenLoopDetailDialog loop={openLoop} day={date} onClose={() => setOpenLoop(null)} />
    </div>
  )
}
