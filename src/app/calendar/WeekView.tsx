import { useState } from 'react'
import { WeekGrid } from '../../components/Calendar/Calendar'
import type { WeekDay } from '../../components/Calendar/Calendar'
import { getCalendarPreview, moveTask, today, weekDays } from '../../domain/index'
import type { PreviewItem } from '../../domain/index'
import { dayLong, dayShort, formatTime, weekdayShort, weekTitle } from '../../lib/dateFormat'
import { GoalsSection } from '../goals/GoalsSection'
import { ReflectionSection } from '../reflection/ReflectionSection'
import { useCapture } from '../useCapture'
import { useLive } from '../useLive'
import { useToast } from '../useToast'
import { CalendarNav } from './CalendarNav'
import { dayPath } from './calendarPaths'
import { MoveTaskDialog } from './MoveTaskDialog'
import type { MoveTarget } from './MoveTaskDialog'
import { toneFor } from './previewItems'

/** About three to five items per day in the compact view (PRD 12). */
const SHOWN = 5

/** The small line under a title. Words, never colour alone, say what it is. */
const metaFor = (i: PreviewItem) =>
  i.kind === 'open-loop' ? 'on my mind' : [i.priority !== undefined && `P${i.priority}`, i.done && 'done', i.time && formatTime(i.time)].filter(Boolean).join(' · ') || 'task'

export function WeekView({ date }: { date: string }) {
  const days = weekDays(date)
  const start = days[0]
  const end = days[6]
  const preview = useLive(() => getCalendarPreview(start, end), `${start}|${end}`)
  const capture = useCapture()
  const toast = useToast()
  const [moving, setMoving] = useState<MoveTarget | null>(null)
  const now = today()

  /** Drag and drop (desktop). Every drag also has the Move button as a click alternative. */
  const drop = async (taskId: string, to: string) => {
    const from = days.find((d) => preview?.[d]?.some((i) => i.kind === 'task' && i.id === taskId))
    if (!from || from === to) return
    try {
      await moveTask(taskId, to)
      toast.show({ message: `Moved to ${dayShort(to)}`, actionLabel: 'Undo', onAction: () => void moveTask(taskId, from) })
    } catch {
      toast.show({ message: "We couldn't move that. It's still where it was." })
    }
  }

  const week: WeekDay[] = days.map((d) => {
    const items = preview?.[d] ?? []
    return {
      dow: weekdayShort(d),
      date: Number(d.slice(8)),
      today: d === now,
      selected: d === date,
      href: dayPath(d),
      more: Math.max(0, items.length - SHOWN),
      onAdd: () => capture.open({ tab: 'task', date: d }),
      addLabel: `Add a task on ${dayLong(d)}`,
      onDropTask: (id) => void drop(id, d),
      tasks: items.slice(0, SHOWN).map((i) => {
        const movable = i.kind === 'task' && !i.done
        return {
          key: `${i.kind}-${i.id}`,
          title: i.title,
          meta: metaFor(i),
          tone: toneFor(i),
          href: dayPath(d),
          done: i.done,
          dragId: movable ? i.id : undefined,
          onMove: movable ? () => setMoving({ id: i.id, title: i.title, date: d }) : undefined,
          moveLabel: `Move ${i.title} to another date`,
        }
      }),
    }
  })

  return (
    <>
      <CalendarNav view="week" date={date} caption="Week" title={weekTitle(start, end)} />
      <GoalsSection scope="week" date={date} variant="context" />
      <WeekGrid days={week} />
      <ReflectionSection type="week" date={date} />
      <MoveTaskDialog target={moving} onClose={() => setMoving(null)} />
    </>
  )
}
