import { NavLink } from 'react-router'
import { X } from 'lucide-react'
import { IconButton } from '../components/Button/Button'
import { AppIcon } from '../components/Logo/Logo'
import { cx } from '../lib/cx'
import { ModalHost } from './ModalHost'
import { PRIMARY_NAV, SEARCH_NAV, SETTINGS_NAV } from './navItems'
import type { AppNavItem } from './navItems'
import s from './MobileMenu.module.css'

/**
 * Phone and tablet navigation: a drawer behind the menu button in the header (DECISIONS.md
 * "Mobile navigation"). Choosing a place closes it; Escape and a tap outside close it too.
 */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const item = (nav: AppNavItem) => {
    const Icon = nav.icon
    return (
      <NavLink key={nav.to} to={nav.to} className={({ isActive }) => cx(s.link, isActive && s.active)} onClick={onClose}>
        <Icon aria-hidden="true" />
        {nav.label}
      </NavLink>
    )
  }

  return (
    <ModalHost open={open} onClose={onClose} label="Menu" placement="drawer">
      <div className={s.panel}>
        <div className={s.head}>
          <AppIcon />
          <span className={s.brandName}>Daybook</span>
          <IconButton label="Close menu" tone="plain" className={s.close} onClick={onClose} data-autofocus>
            <X aria-hidden="true" />
          </IconButton>
        </div>
        <nav className={s.nav} aria-label="Primary">
          {PRIMARY_NAV.map(item)}
        </nav>
        <nav className={cx(s.nav, s.utilities)} aria-label="Utilities">
          {[SEARCH_NAV, SETTINGS_NAV].map(item)}
        </nav>
      </div>
    </ModalHost>
  )
}
