import { useState } from 'react'
import { CapturePanel, CaptureQuestion, CaptureRow } from '../components/Capture/Capture'
import type { CaptureTab } from '../components/Capture/captureTabs'
import { Button } from '../components/Button/Button'
import { DatePicker } from '../components/DatePicker/DatePicker'
import { Field, Select, TextArea } from '../components/Field/Field'
import { WeekdayPicker } from '../components/Weekday/WeekdayPicker'
import { DomainError, saveCapture, shouldConfirmPriority, today } from '../domain/index'
import type { CaptureInput, RitualFrequency } from '../domain/index'
import type { CapturePreset } from './captureContext'
import { useToast } from './useToast'

type FrequencyType = RitualFrequency['type']

const SAVED: Record<CaptureTab, string> = {
  'open-loop': 'Open loop saved',
  task: 'Task saved',
  ritual: 'Ritual saved',
}

/** P1 is the highest. P1–P5 is the recommended range (PRD 7); the domain allows more. */
const PRIORITY_CHOICES = [1, 2, 3, 4, 5]

/**
 * + Capture (PRD 6). The default type is Open Loop. Choosing Task or Ritual reveals only that type's
 * fields, and the user is never pushed through an Open Loop to Task funnel.
 */
export function CaptureForm({ preset, onClose }: { preset?: CapturePreset; onClose: () => void }) {
  const toast = useToast()
  const [tab, setTab] = useState<CaptureTab>(preset?.tab ?? 'open-loop')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [date, setDate] = useState(preset?.date ?? '')
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState('')
  const [frequency, setFrequency] = useState<FrequencyType>('daily')
  const [days, setDays] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [confirming, setConfirming] = useState(false)

  /** Any edit clears an error and withdraws a pending question. */
  const edit =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setError(undefined)
      setConfirming(false)
    }

  const canSave = title.trim() !== '' && (tab !== 'ritual' || frequency !== 'custom' || days.length > 0)

  const build = (): CaptureInput => {
    const trimmedNote = note.trim() || undefined
    if (tab === 'open-loop') return { type: 'open-loop', title, note: trimmedNote }
    if (tab === 'task') {
      return {
        type: 'task',
        title,
        note: trimmedNote,
        date: date || undefined,
        time: time || undefined,
        priority: priority ? Number(priority) : undefined,
      }
    }
    return { type: 'ritual', name: title, frequency: frequency === 'custom' ? { type: 'custom', days } : { type: frequency } }
  }

  const save = async (alreadyConfirmed = false) => {
    if (!canSave || busy) return
    setBusy(true)
    try {
      // Only the gentle question about a sixth priority; it never blocks (PRD 7).
      if (tab === 'task' && priority && !alreadyConfirmed && (await shouldConfirmPriority(date || today()))) {
        setConfirming(true)
        setBusy(false)
        return
      }
      await saveCapture(build())
      toast.show({ message: SAVED[tab] })
      onClose()
    } catch (e) {
      setError(e instanceof DomainError ? e.message : "We couldn't save that. Nothing has been changed.")
      setBusy(false)
    }
  }

  const noteField = showNote ? (
    <TextArea label="Note" value={note} onChange={(e) => edit(setNote)(e.target.value)} />
  ) : (
    <div>
      <Button tone="ghost" size="small" onClick={() => setShowNote(true)}>
        Add a note
      </Button>
    </div>
  )

  return (
    <CapturePanel
      tab={tab}
      onTabChange={edit(setTab)}
      onClose={onClose}
      onSubmit={() => save()}
      canSave={canSave}
      busy={busy}
      error={error}
      footer={
        confirming ? (
          <CaptureQuestion
            question="You've chosen five priorities already. Add this anyway?"
            backLabel="Go back"
            confirmLabel="Add anyway"
            busy={busy}
            onBack={() => setConfirming(false)}
            onConfirm={() => save(true)}
          />
        ) : undefined
      }
    >
      <Field
        label={tab === 'open-loop' ? "What's on your mind?" : tab === 'task' ? 'Task' : 'Ritual name'}
        value={title}
        onChange={(e) => edit(setTitle)(e.target.value)}
        placeholder={tab === 'task' ? 'What needs to happen…' : undefined}
        data-autofocus
      />

      {tab === 'open-loop' && noteField}

      {tab === 'task' && (
        <>
          <CaptureRow>
            <DatePicker label="Date" value={date} onChange={edit(setDate)} allowClear help="Leave empty to show it every day until it's done." />
            <Field label="Time" type="time" value={time} onChange={(e) => edit(setTime)(e.target.value)} />
          </CaptureRow>
          <Select label="Priority" value={priority} onChange={(e) => edit(setPriority)(e.target.value)}>
            <option value="">None</option>
            {PRIORITY_CHOICES.map((p) => (
              <option key={p} value={p}>
                P{p}
              </option>
            ))}
          </Select>
          {noteField}
        </>
      )}

      {tab === 'ritual' && (
        <>
          <Select label="Frequency" value={frequency} onChange={(e) => edit(setFrequency)(e.target.value as FrequencyType)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="weekends">Weekends</option>
            <option value="custom">Custom weekdays</option>
          </Select>
          {frequency === 'custom' && <WeekdayPicker label="Days" value={days} onChange={edit(setDays)} />}
        </>
      )}
    </CapturePanel>
  )
}
