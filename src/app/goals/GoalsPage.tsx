import { today } from '../../domain/index'
import t from '../../styles/typography.module.css'
import { GoalsSection } from './GoalsSection'
import s from './GoalsPage.module.css'

/**
 * Goals (PRD 4): "What direction I'm choosing". The goals for the current year, month and week, with
 * archived ones behind a disclosure. Each card has arrows to browse to any other year, month or week.
 */
export function GoalsPage() {
  const now = today()
  return (
    <section>
      <div className={t.typeCaption}>What direction I'm choosing</div>
      <h1 className={s.title}>Goals</h1>
      <div className={s.grid}>
        <GoalsSection scope="year" date={now} showArchived navigable />
        <GoalsSection scope="month" date={now} showArchived navigable />
        <GoalsSection scope="week" date={now} showArchived navigable />
      </div>
    </section>
  )
}
