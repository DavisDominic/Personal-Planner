import { useState } from 'react'
import { Button } from '../../components/Button/Button'
import { Field } from '../../components/Field/Field'
import { InlineMessage } from '../../components/Feedback/Feedback'
import { Dialog } from '../../components/Overlay/Overlay'
import t from '../../styles/typography.module.css'
import { DomainError, moveTask } from '../../domain/index'
import { dayShort } from '../dateFormat'
import { ModalHost } from '../ModalHost'
import { useToast } from '../useToast'
import s from './MoveTaskDialog.module.css'

export type MoveTarget = { id: string; title: string; date?: string }

/**
 * "Choose a date": the click alternative to dragging a task to another day (design system, Modal &
 * sheet patterns). The task leaves its current date and appears on the chosen one.
 */
export function MoveTaskDialog({ target, onClose }: { target: MoveTarget | null; onClose: () => void }) {
  return (
    <ModalHost open={target !== null} onClose={onClose} label="Move task" className={s.width}>
      {target && <MoveForm target={target} onClose={onClose} />}
    </ModalHost>
  )
}

function MoveForm({ target, onClose }: { target: MoveTarget; onClose: () => void }) {
  const toast = useToast()
  const [date, setDate] = useState(target.date ?? '')
  const [error, setError] = useState<string>()

  const move = async () => {
    if (!date) return
    try {
      const from = target.date
      await moveTask(target.id, date)
      toast.show({
        message: `Moved to ${dayShort(date)}`,
        actionLabel: from ? 'Undo' : undefined,
        onAction: from ? () => void moveTask(target.id, from) : undefined,
      })
      onClose()
    } catch (e) {
      setError(e instanceof DomainError ? e.message : "We couldn't move that. It's still where it was.")
    }
  }

  return (
    <Dialog>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void move()
        }}
      >
        <div className={t.typeLabel}>Move task</div>
        <h3>Choose a date</h3>
        <p>
          “{target.title}” will leave its current date and appear on the date you choose.
        </p>
        <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} data-autofocus />
        {error && (
          <div className={s.message}>
            <InlineMessage kind="error">{error}</InlineMessage>
          </div>
        )}
        <div className={s.foot}>
          <Button tone="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button tone="primary" type="submit" disabled={!date || date === target.date}>
            Move
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
