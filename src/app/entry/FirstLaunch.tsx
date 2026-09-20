import { Button } from '../../components/Button/Button'
import { Logo } from '../../components/Logo/Logo'
import t from '../../styles/typography.module.css'
import s from './Entry.module.css'

/** PRD 25: no questionnaire and no setup. One line about the planner and a Start button that leads to Today. */
export function FirstLaunch({ onStart }: { onStart: () => void }) {
  return (
    <main className={s.first} id="main">
      <Logo className={s.logo} />
      <h1 className={s.firstTitle}>Your planner</h1>
      <p className={s.firstText}>A place to keep what&rsquo;s on your mind, plan your days, and see what actually happened.</p>
      <Button tone="primary" size="large" onClick={onStart} autoFocus>
        Start
      </Button>
      <p className={t.typeCaption}>Everything stays on this device</p>
    </main>
  )
}
