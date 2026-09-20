import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../../components/Button/Button'
import { DatePicker } from '../../components/DatePicker/DatePicker'
import { Field, TextArea } from '../../components/Field/Field'
import { InlineMessage } from '../../components/Feedback/Feedback'
import { Dialog } from '../../components/Overlay/Overlay'
import {
  DomainError, convertOpenLoopToTask, deleteOpenLoop, deleteTask, reopenOpenLoop, resolveOpenLoop, restoreOpenLoop, updateOpenLoop,
} from '../../domain/index'
import type { OpenLoop } from '../../domain/index'
import t from '../../styles/typography.module.css'
import { ModalHost } from '../ModalHost'
import { useToast } from '../useToast'
import s from './Details.module.css'

const CANT_SAVE = "We couldn't save that change. Your previous version is still here."
const messageFor = (e: unknown) => (e instanceof DomainError ? e.message : CANT_SAVE)

type Props = {
  loop: OpenLoop | null
  /** The Day it was opened from. A loop turned into a task lands on that day unless it already has a date. */
  day: string
  onClose: () => void
}

/** Edit an Open Loop and act on it (PRD 8): taken care of, turn it into a task, or delete it. */
export function OpenLoopDetailDialog({ loop, day, onClose }: Props) {
  return (
    <ModalHost open={loop !== null} onClose={onClose} label="Open loop" className={s.width}>
      {loop && <LoopForm loop={loop} day={day} onClose={onClose} />}
    </ModalHost>
  )
}

function LoopForm({ loop, day, onClose }: { loop: OpenLoop; day: string; onClose: () => void }) {
  const toast = useToast()
  const [title, setTitle] = useState(loop.title)
  const [note, setNote] = useState(loop.note ?? '')
  const [date, setDate] = useState(loop.date ?? '')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const edit =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setError(undefined)
    }

  const canSave = title.trim() !== ''

  const save = async () => {
    if (!canSave || busy) return
    setBusy(true)
    try {
      await updateOpenLoop(loop.id, { title, note: note.trim() || null, date: date || null })
      onClose()
    } catch (e) {
      setError(messageFor(e))
      setBusy(false)
    }
  }

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

  const takenCare = act('Taken care of', () => resolveOpenLoop(loop.id), () => reopenOpenLoop(loop.id))
  const backOnMyMind = act('Back on my mind', () => reopenOpenLoop(loop.id), () => resolveOpenLoop(loop.id))
  const resolved = loop.status === 'taken-care-of'
  const remove = act('Open loop deleted', () => deleteOpenLoop(loop.id), () => restoreOpenLoop(loop))

  /** Becomes a task (the open loop ceases to exist); Undo turns it back. */
  const makeTask = async () => {
    setBusy(true)
    try {
      const task = await convertOpenLoopToTask(loop.id, { date: loop.date ?? day })
      toast.show({
        message: 'Now a task',
        actionLabel: 'Undo',
        onAction: () => void deleteTask(task.id).then(() => restoreOpenLoop(loop)).catch(() => toast.show({ message: CANT_SAVE })),
      })
      onClose()
    } catch (e) {
      setError(messageFor(e))
      setBusy(false)
    }
  }

  return (
    <Dialog>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <div className={t.typeLabel}>{resolved ? 'Taken care of' : 'On my mind'}</div>
        <div className={s.fields}>
          <Field label="What's on your mind?" value={title} onChange={(e) => edit(setTitle)(e.target.value)} data-autofocus />
          <TextArea label="Note" value={note} onChange={(e) => edit(setNote)(e.target.value)} />
          <DatePicker label="Date" value={date} onChange={edit(setDate)} allowClear help="Optional. A date doesn't turn this into a task." />
        </div>

        {error && (
          <div className={s.message}>
            <InlineMessage kind="error">{error}</InlineMessage>
          </div>
        )}

        <div className={s.foot}>
          <Button tone="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button tone="primary" type="submit" disabled={!canSave || busy}>
            Save
          </Button>
        </div>

        <div className={s.actions}>
          <div className={t.typeLabel}>Actions</div>
          <div className={s.actionRow}>
            {resolved ? (
              <Button size="small" disabled={busy} onClick={() => void backOnMyMind()}>
                Back on my mind
              </Button>
            ) : (
              <Button size="small" disabled={busy} onClick={() => void takenCare()}>
                Taken care of
              </Button>
            )}
            <Button size="small" disabled={busy} onClick={() => void makeTask()}>
              Turn into a task
            </Button>
            <Button size="small" disabled={busy} icon={<Trash2 aria-hidden="true" />} onClick={() => void remove()}>
              Delete
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
