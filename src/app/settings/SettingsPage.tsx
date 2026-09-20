import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { Button } from '../../components/Button/Button'
import { Card } from '../../components/Card/Card'
import { InlineMessage, Notice } from '../../components/Feedback/Feedback'
import { Dialog } from '../../components/Overlay/Overlay'
import { createBackup, DomainError, lastBackupAt, parseBackup, recordBackup, restoreBackup, toDateString } from '../../domain/index'
import type { Backup } from '../../domain/index'
import { dayFull } from '../../lib/dateFormat'
import t from '../../styles/typography.module.css'
import { ModalHost } from '../ModalHost'
import { useLive } from '../useLive'
import { useToast } from '../useToast'
import s from './SettingsPage.module.css'

/** After this many days the page gently mentions backing up. Nothing is sent or shown anywhere else. */
const REMINDER_DAYS = 30
const DAY_MS = 86_400_000

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function describe(b: Backup) {
  const d = b.data
  return [
    plural(d.tasks.length, 'task', 'tasks'),
    plural(d.openLoops.length, 'open loop', 'open loops'),
    plural(d.rituals.length, 'ritual', 'rituals'),
    plural(d.goals.length, 'goal', 'goals'),
    plural(d.reflections.length, 'reflection', 'reflections'),
  ].join(', ')
}

/** Settings (PRD 21): manual JSON backup and restore. The only preferences are the ones a backup needs. */
export function SettingsPage() {
  const toast = useToast()
  const last = useLive(async () => {
    const at = await lastBackupAt()
    return { at, days: at ? Math.floor((Date.now() - Date.parse(at)) / DAY_MS) : undefined }
  }, 'last-backup')
  const file = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState<{ name: string; backup: Backup } | null>(null)

  const lastAt = last?.at
  const suggest = last !== undefined && (lastAt === undefined || (last.days ?? 0) >= REMINDER_DAYS)

  const exportNow = async () => {
    setError(undefined)
    try {
      const backup = await createBackup()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `daybook-backup-${toDateString(new Date())}.json`
      document.body.append(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      await recordBackup()
      toast.show({ message: 'Backup saved' })
    } catch {
      setError("We couldn't make the backup. Your planner hasn't been changed.")
    }
  }

  const chooseFile = async (f: File | undefined) => {
    if (!f) return
    setError(undefined)
    try {
      setPending({ name: f.name, backup: parseBackup(await f.text()) })
    } catch (e) {
      setError(e instanceof DomainError ? e.message : "This backup couldn't be imported. Your current data hasn't been changed.")
    } finally {
      if (file.current) file.current.value = ''
    }
  }

  const replace = async () => {
    if (!pending) return
    try {
      await restoreBackup(pending.backup)
      setPending(null)
      toast.show({ message: 'Backup restored' })
    } catch (e) {
      setPending(null)
      setError(e instanceof DomainError ? e.message : "This backup couldn't be imported. Your current data hasn't been changed.")
    }
  }

  return (
    <section>
      <div className={t.typeCaption}>Backup, restore and preferences</div>
      <h1 className={s.title}>Settings</h1>

      <div className={s.grid}>
        <Card kind="flat">
          <div className={t.typeLabel}>Back up</div>
          <h2 className={s.head}>Save a copy of everything</h2>
          <p className={t.typeSmall}>
            Your planner lives only on this device. A backup file is how you keep a copy, or move to another device.
          </p>
          <p className={s.fact}>
            {lastAt ? `Last backup: ${dayFull(toDateString(new Date(lastAt)))}` : 'No backup has been saved from this device yet.'}
          </p>
          {suggest && (
            <Notice>
              {lastAt ? 'It has been a while since your last backup.' : 'You may want to save a first backup.'} Saving one keeps a copy of
              everything outside this browser.
            </Notice>
          )}
          <p className={s.warn}>The file holds all your private planner data. Keep it somewhere you trust.</p>
          <Button tone="primary" icon={<Download aria-hidden="true" />} onClick={() => void exportNow()}>
            Save backup
          </Button>
        </Card>

        <Card kind="flat">
          <div className={t.typeLabel}>Restore</div>
          <h2 className={s.head}>Bring a backup back</h2>
          <p className={t.typeSmall}>
            Restoring replaces what is in the planner now with what is in the file. Nothing is merged. The file is checked first, and if
            anything is wrong your current data stays exactly as it is.
          </p>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => void chooseFile(e.target.files?.[0])} />
          <Button icon={<Upload aria-hidden="true" />} onClick={() => file.current?.click()}>
            Choose backup file
          </Button>
          {error && (
            <div className={s.message}>
              <InlineMessage kind="error">{error}</InlineMessage>
            </div>
          )}
        </Card>
      </div>

      <ModalHost open={pending !== null} onClose={() => setPending(null)} label="Restore backup" className={s.width}>
        {pending && (
          <Dialog>
            <div className={t.typeLabel}>Restore</div>
            <h3>Replace your planner with this backup?</h3>
            <p>
              “{pending.name}” was saved {dayFull(toDateString(new Date(pending.backup.exportedAt)))} and holds {describe(pending.backup)}.
            </p>
            <p>Everything in the planner now will be replaced. Saving a backup first keeps a copy of it.</p>
            <div className={s.foot}>
              <Button tone="ghost" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button tone="primary" onClick={() => void replace()}>
                Replace my planner
              </Button>
            </div>
          </Dialog>
        )}
      </ModalHost>
    </section>
  )
}
