import { useState } from 'react'
import { Archive, RotateCcw } from 'lucide-react'
import { Button } from '../../components/Button/Button'
import { Field, Select } from '../../components/Field/Field'
import { InlineMessage } from '../../components/Feedback/Feedback'
import { Dialog } from '../../components/Overlay/Overlay'
import { WeekdayPicker } from '../../components/Weekday/WeekdayPicker'
import { archiveRitual, countRecordedDays, DomainError, restoreRitual, updateRitual } from '../../domain/index'
import type { Ritual, RitualFrequency } from '../../domain/index'
import t from '../../styles/typography.module.css'
import { ModalHost } from '../ModalHost'
import { useLive } from '../useLive'
import { useToast } from '../useToast'
import s from './Details.module.css'

type FrequencyType = RitualFrequency['type']

const CANT_SAVE = "We couldn't save that change. Your previous version is still here."
const messageFor = (e: unknown) => (e instanceof DomainError ? e.message : CANT_SAVE)

/**
 * Edit a Ritual and act on it (PRD 9): rename it, change how often it happens, archive it or bring it
 * back. There is no delete: archiving keeps the check-ins, which are a record of what was actually done.
 */
export function RitualDetailDialog({ ritual, onClose }: { ritual: Ritual | null; onClose: () => void }) {
  return (
    <ModalHost open={ritual !== null} onClose={onClose} label="Ritual" className={s.width}>
      {ritual && <RitualForm ritual={ritual} onClose={onClose} />}
    </ModalHost>
  )
}

function RitualForm({ ritual, onClose }: { ritual: Ritual; onClose: () => void }) {
  const toast = useToast()
  const [name, setName] = useState(ritual.name)
  const [frequency, setFrequency] = useState<FrequencyType>(ritual.frequency.type)
  const [days, setDays] = useState<number[]>(ritual.frequency.type === 'custom' ? ritual.frequency.days : [])
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const recorded = useLive(async () => ({ days: await countRecordedDays(ritual.id) }), ritual.id)
  const archived = ritual.archivedAt !== undefined

  const edit =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setError(undefined)
    }

  const canSave = name.trim() !== '' && (frequency !== 'custom' || days.length > 0)

  const save = async () => {
    if (!canSave || busy) return
    setBusy(true)
    try {
      await updateRitual(ritual.id, { name, frequency: frequency === 'custom' ? { type: 'custom', days } : { type: frequency } })
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

  const archive = act('Ritual archived', () => archiveRitual(ritual.id), () => restoreRitual(ritual.id))
  const restore = act('Ritual restored', () => restoreRitual(ritual.id), () => archiveRitual(ritual.id))

  return (
    <Dialog>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <div className={t.typeLabel}>{archived ? 'Archived ritual' : 'Ritual'}</div>
        <div className={s.fields}>
          <Field label="Name" value={name} onChange={(e) => edit(setName)(e.target.value)} data-autofocus />
          <Select label="Frequency" value={frequency} onChange={(e) => edit(setFrequency)(e.target.value as FrequencyType)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="weekends">Weekends</option>
            <option value="custom">Custom weekdays</option>
          </Select>
          {frequency === 'custom' && <WeekdayPicker label="Days" value={days} onChange={edit(setDays)} />}
        </div>

        {recorded && (
          <p className={t.typeSmall}>
            {recorded.days} recorded {recorded.days === 1 ? 'day' : 'days'}. Changing how often it happens leaves them exactly as they are.
          </p>
        )}

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
            {archived ? (
              <Button size="small" disabled={busy} icon={<RotateCcw aria-hidden="true" />} onClick={() => void restore()}>
                Bring it back
              </Button>
            ) : (
              <Button size="small" disabled={busy} icon={<Archive aria-hidden="true" />} onClick={() => void archive()}>
                Archive
              </Button>
            )}
          </div>
          <p className={t.typeSmall}>Archiving keeps every check-in. It can be brought back at any time.</p>
        </div>
      </form>
    </Dialog>
  )
}
