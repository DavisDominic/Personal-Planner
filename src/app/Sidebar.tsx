import { NavLink } from 'react-router'
import { Plus } from 'lucide-react'
import { Button } from '../components/Button/Button'
import { cx } from '../lib/cx'
import { PRIMARY_NAV, SEARCH_NAV, SETTINGS_NAV } from './navItems'
import type { AppNavItem } from './navItems'
import { useCapture } from './useCapture'
import s from './Sidebar.module.css'

const isApple = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
const SEARCH_SHORTCUT = isApple ? '⌘ K' : 'Ctrl K'

function Item({ item, hint }: { item: AppNavItem; hint?: string }) {
  const Icon = item.icon
  return (
    <NavLink to={item.to} className={({ isActive }) => cx(s.link, isActive && s.active)}>
      <Icon aria-hidden="true" />
      {item.label}
      {hint && <span className={s.hint}>{hint}</span>}
    </NavLink>
  )
}

/** Desktop navigation (PRD 23): persistent sidebar with Capture on top and Search / Settings as utilities. */
export function Sidebar() {
  const capture = useCapture()
  return (
    <aside className={s.sidebar}>
      <div className={s.brand}>
        <span className={s.brandDot} aria-hidden="true" />
        <span className={s.brandName}>Planner</span>
      </div>
      <Button tone="lemon" className={s.capture} icon={<Plus aria-hidden="true" />} aria-haspopup="dialog" onClick={() => capture.open()}>
        Capture
      </Button>
      <nav className={s.nav} aria-label="Primary">
        {PRIMARY_NAV.map((item) => (
          <Item key={item.to} item={item} />
        ))}
      </nav>
      <nav className={cx(s.nav, s.utilities)} aria-label="Utilities">
        <Item item={SEARCH_NAV} hint={SEARCH_SHORTCUT} />
        <Item item={SETTINGS_NAV} />
      </nav>
    </aside>
  )
}
