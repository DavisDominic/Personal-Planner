import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../../components/Button/Button'
import { Field, TextArea } from '../../components/Field/Field'
import { InlineMessage } from '../../components/Feedback/Feedback'
import { Dialog } from '../../components/Overlay/Overlay'
import {
  DomainError, archiveGoal, createGoal, discardGoal, restoreDiscardedGoal, restoreGoalFromArchive, updateGoal,
} from '../../domain/index'
import type { Goal, GoalScope } from '../../domain/index'
import t from '../../styles/typography.module.css'
import { ModalHost } from '../ModalHost'
import { goalDate, periodLabel } from './goalLabels'
import { useToast } from '../useToast'
import s from './GoalDialog.module.css'

const CANT_SAVE = "We couldn't save that change. Your previous version is still here."
const messageFor = (e: unknown) => (e instanceof DomainError ? e.message : CANT_SAVE)

export type GoalTarget = { kind: 'new'; scope: GoalScope; date: string } | { kind: 'edit'; goal: Goal }

/** Add or edit a goal (PRD 10). Just a title and an optional description. */
export function GoalDialog({ target, onClose }: { target: GoalTarget | null; onClose: () => void }) {
  return (
    <ModalHost open={target !== null} onClose={onClose} label="Goal" className={s.width}>
      {target && <GoalForm target={target} onClose={onClose} />}
    </ModalHost>
  )
}

function GoalForm({ target, onClose }: { target: GoalTarget; onClose: () => void }) {
  const toast = useToast()
  const goal = target.kind === 'edit' ? target.goal : undefined
  const scope = goal ? goal.scope : (target as { scope: GoalScope }).scope
  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
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
      if (goal) {
        await updateGoal(goal.id, { title, description: description.trim() || null })
      } else if (target.kind === 'new') {
        await createGoal({ title, description: description.trim() || undefined, scope, forDate: target.date })
        toast.show({ message: 'Goal saved' })
      }
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

  const archived = goal?.status === 'archived'
  const archive = goal && act('Goal archived', () => archiveGoal(goal.id), () => restoreGoalFromArchive(goal.id))
  const restore = goal && act('Goal restored', () => restoreGoalFromArchive(goal.id), () => archiveGoal(goal.id))
  const remove = goal && act('Goal deleted', () => discardGoal(goal.id), () => restoreDiscardedGoal(goal))

  return (
    <Dialog>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <div className={t.typeLabel}>{`${periodLabel(scope, goal ? goalDate(goal) : (target as { date: string }).date)} goal`}</div>
        <div className={s.fields}>
          <Field
            label="Goal"
            value={title}
            onChange={(e) => edit(setTitle)(e.target.value)}
            help={scope === 'week' ? 'Something I want this week to be about.' : undefined}
            data-autofocus
          />
          <TextArea label="Description" value={description} onChange={(e) => edit(setDescription)(e.target.value)} />
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

        {goal && (
          <div className={s.actions}>
            <div className={t.typeLabel}>Actions</div>
            <div className={s.actionRow}>
              {archived ? (
                <Button size="small" disabled={busy} onClick={() => void restore?.()}>
                  Restore
                </Button>
              ) : (
                <Button size="small" disabled={busy} onClick={() => void archive?.()}>
                  Archive
                </Button>
              )}
              <Button size="small" disabled={busy} icon={<Trash2 aria-hidden="true" />} onClick={() => void remove?.()}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </form>
    </Dialog>
  )
}
