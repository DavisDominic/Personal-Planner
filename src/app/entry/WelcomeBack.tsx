import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { Button } from '../../components/Button/Button'
import { Card } from '../../components/Card/Card'
import { TaskRow } from '../../components/Task/Task'
import { completeTask, getUnfinishedFromEarlier, getWaitingSummary, moveTask, moveTaskToToday, today } from '../../domain/index'
import type { Task } from '../../domain/index'
import { dayLong, dayShort } from '../../lib/dateFormat'
import t from '../../styles/typography.module.css'
import { TaskDetailDialog } from '../day/TaskDetailDialog'
import { useLive } from '../useLive'
import { useToast } from '../useToast'
import s from './Entry.module.css'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * PRD 15: after 3 or more days away. Says what is waiting, factually, and offers Review or Start today. Nothing here
 * counts days, apologises or escalates, and Review never blocks starting today. Moving to any other screen also ends it.
 */
export function WelcomeBack({ onDone, onStart }: { onDone: () => void; onStart: () => void }) {
  const [reviewing, setReviewing] = useState(false)
  const summary = useLive(getWaitingSummary, 'waiting')

  // Choosing anything else in the navigation means the user is on their way; the state ends quietly.
  const { pathname } = useLocation()
  const first = useRef(pathname)
  useEffect(() => {
    if (pathname !== first.current) onDone()
  }, [pathname, onDone])

  if (reviewing) return <Review onStart={onStart} />
  if (!summary) return null

  const waiting = summary.unfinishedTasks + summary.openLoops > 0
  return (
    <section>
      <Card kind="flat" className={s.welcome}>
        <div className={t.typeLabel}>WELCOME BACK</div>
        <h1 className={s.welcomeTitle}>Welcome back.</h1>
        <p className={s.today}>Today is {dayLong(today())}.</p>
        {waiting && (
          <>
            <p className={s.lead}>A few things are waiting for you.</p>
            <ul className={s.facts}>
              {summary.unfinishedTasks > 0 && <li>{plural(summary.unfinishedTasks, 'unfinished task', 'unfinished tasks')}</li>}
              {summary.openLoops > 0 && <li>{plural(summary.openLoops, 'open loop', 'open loops')}</li>}
            </ul>
          </>
        )}
        <div className={s.actions}>
          {summary.unfinishedTasks > 0 && <Button onClick={() => setReviewing(true)}>Review</Button>}
          <Button tone="primary" onClick={onStart} autoFocus>
            Start today
          </Button>
        </div>
      </Card>
    </section>
  )
}

/** Unfinished tasks one by one, each with the same actions as anywhere else. Can be left at any point. */
function Review({ onStart }: { onStart: () => void }) {
  const toast = useToast()
  const tasks = useLive(() => getUnfinishedFromEarlier(today()), 'review')
  const [open, setOpen] = useState<Task | null>(null)

  const safely = (p: Promise<unknown>) => p.catch(() => toast.show({ message: "We couldn't save that change. Your previous version is still here." }))
  const bring = (task: Task) =>
    void safely(moveTaskToToday(task.id).then(() => toast.show({ message: 'Moved to today', actionLabel: 'Undo', onAction: () => void moveTask(task.id, task.date!) })))

  return (
    <section>
      <div className={t.typeCaption}>Welcome back</div>
      <h1 className={s.welcomeTitle}>Unfinished tasks</h1>
      <p className={s.lead}>Take them one at a time, or leave whenever you like.</p>
      <div className={s.list}>
        {tasks?.map((task) => (
          <Card key={task.id} kind="note">
            <TaskRow
              title={task.title}
              meta={[dayShort(task.date!), task.priority !== undefined && `P${task.priority}`, task.time].filter(Boolean).join(' · ')}
              note={task.note}
              done={false}
              onToggle={() => void safely(completeTask(task.id))}
              onOpen={() => setOpen(task)}
              actions={
                <Button size="small" onClick={() => bring(task)}>
                  Complete today
                </Button>
              }
            />
          </Card>
        ))}
        {tasks?.length === 0 && <p className={t.typeSmall}>That&rsquo;s all of them.</p>}
      </div>
      <div className={s.actions}>
        <Button tone="primary" onClick={onStart}>
          Start today
        </Button>
      </div>
      <TaskDetailDialog task={open} onClose={() => setOpen(null)} />
    </section>
  )
}
