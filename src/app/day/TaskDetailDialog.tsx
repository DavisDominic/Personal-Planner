import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../../components/Button/Button'
import { CaptureQuestion } from '../../components/Capture/Capture'
import { DatePicker } from '../../components/DatePicker/DatePicker'
import { TimePicker } from '../../components/TimePicker/TimePicker'
import { Field, Select, TextArea } from '../../components/Field/Field'
import { InlineMessage } from '../../components/Feedback/Feedback'
import { Dialog } from '../../components/Overlay/Overlay'
import {
  DomainError, completeTask, deleteTask, markTaskNoLongerRelevant, moveTask, moveTaskToToday, reopenTask, restoreTask, shouldConfirmPriority, today, updateTask,
} from '../../domain/index'
import type { Task } from '../../domain/index'
import t from '../../styles/typography.module.css'
import { ModalHost } from '../ModalHost'
import { useToast } from '../useToast'
import s from './Details.module.css'

const CANT_SAVE = "We couldn't save that change. Your previous version is still here."
const messageFor = (e: unknown) => (e instanceof DomainError ? e.message : CANT_SAVE)

/** P1 is the highest. P1–P5 is the recommended range; a task already above P5 keeps its level. */
const priorityChoices = (current?: number) => Array.from({ length: Math.max(5, current ?? 0) }, (_, i) => i + 1)

/** Edit a task and act on it (PRD 7): change details, move it, mark it no longer relevant, or delete it. */
export function TaskDetailDialog({ task, onClose }: { task: Task | null; onClose: () => void }) {
  return (
    <ModalHost open={task !== null} onClose={onClose} label="Task" className={s.width}>
      {task && <TaskForm task={task} onClose={onClose} />}
    </ModalHost>
  )
}

function TaskForm({ task, onClose }: { task: Task; onClose: () => void }) {
  const toast = useToast()
  const [title, setTitle] = useState(task.title)
  const [note, setNote] = useState(task.note ?? '')
  const [date, setDate] = useState(task.date ?? '')
  const [time, setTime] = useState(task.time ?? '')
  const [priority, setPriority] = useState(task.priority ? String(task.priority) : '')
  const [error, setError] = useState<string>()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const edit =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setError(undefined)
      setConfirming(false)
    }

  const canSave = title.trim() !== ''
  const active = task.status === 'active'
  const canComplete = active && task.date !== undefined && task.date !== today()

  const save = async (alreadyConfirmed = false) => {
    if (!canSave || busy) return
    setBusy(true)
    try {
      const level = priority ? Number(priority) : undefined
      // The gentle question only when a priority is newly set or changed (PRD 7), never on a move.
      if (level !== undefined && level !== task.priority && !alreadyConfirmed && (await shouldConfirmPriority(date || today(), task.id))) {
        setConfirming(true)
        setBusy(false)
        return
      }
      await updateTask(task.id, { title, note: note.trim() || null, date: date || null, time: time || null, priority: level ?? null })
      onClose()
    } catch (e) {
      setError(messageFor(e))
      setBusy(false)
    }
  }

  /** Runs an action, then offers Undo. */
  const act = (message: string, action: () => Promise<unknown>, undo: () => Promise<unknown>) => async () => {
    setBusy(true)
    try {
      await action()
      toast.show({ message, actionLabel: 'Undo', onAction: () => void undo().catch(() => toast.show({ message: CANT_SAVE })) })
      onClose()
    } catch (e) {
      setError(messageFor(e))
      setBusy(false)
    }
  }

  const original = task.date
  const completeToday = act('Moved to today', () => moveTaskToToday(task.id), () => (original ? moveTask(task.id, original) : updateTask(task.id, { date: null })))
  const noLongerRelevant = act('Marked no longer relevant', () => markTaskNoLongerRelevant(task.id), () => reopenTask(task.id))
  const reopen = act('Reopened', () => reopenTask(task.id), () => completeTask(task.id))
  const remove = act('Task deleted', () => deleteTask(task.id), () => restoreTask(task))

  return (
    <Dialog>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <div className={t.typeLabel}>Task</div>
        <div className={s.fields}>
          <Field label="Title" value={title} onChange={(e) => edit(setTitle)(e.target.value)} data-autofocus />
          <TextArea label="Note" value={note} onChange={(e) => edit(setNote)(e.target.value)} />
          <div className={s.row}>
            <DatePicker label="Date" value={date} onChange={edit(setDate)} allowClear help="Leave empty to show it every day until it's done." />
            <TimePicker label="Time" value={time} onChange={edit(setTime)} allowClear align="end" />
          </div>
          <Select label="Priority" value={priority} onChange={(e) => edit(setPriority)(e.target.value)}>
            <option value="">None</option>
            {priorityChoices(task.priority).map((p) => (
              <option key={p} value={p}>
                P{p}
              </option>
            ))}
          </Select>
        </div>

        {error && (
          <div className={s.message}>
            <InlineMessage kind="error">{error}</InlineMessage>
          </div>
        )}

        {confirming ? (
          <CaptureQuestion
            question="You've chosen five priorities already. Add this anyway?"
            backLabel="Go back"
            confirmLabel="Add anyway"
            busy={busy}
            onBack={() => setConfirming(false)}
            onConfirm={() => void save(true)}
          />
        ) : (
          <div className={s.foot}>
            <Button tone="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button tone="primary" type="submit" disabled={!canSave || busy}>
              Save
            </Button>
          </div>
        )}

        <div className={s.actions}>
          <div className={t.typeLabel}>Actions</div>
          <div className={s.actionRow}>
            {canComplete && (
              <Button size="small" disabled={busy} onClick={() => void completeToday()}>
                Complete today
              </Button>
            )}
            {active && (
              <Button size="small" disabled={busy} onClick={() => void noLongerRelevant()}>
                No longer relevant
              </Button>
            )}
            {task.status === 'completed' && (
              <Button size="small" disabled={busy} onClick={() => void reopen()}>
                Reopen
              </Button>
            )}
            <Button size="small" disabled={busy} icon={<Trash2 aria-hidden="true" />} onClick={() => void remove()}>
              Delete
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
