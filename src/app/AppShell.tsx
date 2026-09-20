import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useMatch, useNavigate } from 'react-router'
import { Plus, Search } from 'lucide-react'
import { IconButton } from '../components/Button/Button'
import { isDateString } from '../domain/index'
import { MobileNav } from '../components/Nav/Nav'
import type { NavItem } from '../components/Nav/Nav'
import { CaptureHost } from './CaptureHost'
import { CaptureContext } from './captureContext'
import type { CapturePreset } from './captureContext'
import { PRIMARY_NAV, SETTINGS_NAV } from './navItems'
import { Sidebar } from './Sidebar'
import { ToastProvider } from './ToastProvider'
import s from './AppShell.module.css'

const MOBILE_ITEMS: NavItem[] = [...PRIMARY_NAV, SETTINGS_NAV].map(({ label, to, icon: Icon }) => ({
  label,
  to,
  icon: <Icon aria-hidden="true" />,
}))

/**
 * The frame around every screen (PRD 4, 23; DECISIONS.md "Mobile navigation and capture").
 * Desktop: persistent sidebar. Phones and tablets: header with Search, bottom nav, and a
 * floating + Capture button at the bottom right. Which set shows is decided in CSS.
 */
export function AppShell() {
  const navigate = useNavigate()
  const [captureOpen, setCaptureOpen] = useState(false)
  const [preset, setPreset] = useState<CapturePreset>()
  // Capturing while looking at a Day gives a task that Day's date (PRD 7: "created from a Day context").
  const viewedDay = useMatch('/calendar/day/:date')?.params.date
  const contextDate = viewedDay && isDateString(viewedDay) ? viewedDay : undefined
  const open = useCallback(
    (p?: CapturePreset) => {
      setPreset({ date: contextDate, ...p })
      setCaptureOpen(true)
    },
    [contextDate],
  )
  const close = useCallback(() => setCaptureOpen(false), [])
  const capture = useMemo(() => ({ isOpen: captureOpen, open, close }), [captureOpen, open, close])

  // Ctrl/Cmd + K opens Search (not while the capture modal is open).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!captureOpen && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        navigate('/search')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, captureOpen])

  return (
    <ToastProvider>
    <CaptureContext.Provider value={capture}>
      <a className={s.skip} href="#main">
        Skip to content
      </a>
      <div className={s.shell}>
        <Sidebar />
        <div>
          <header className={s.header}>
            <div className={s.brand}>
              <span className={s.brandDot} aria-hidden="true" />
              <span className={s.brandName}>Planner</span>
            </div>
            <IconButton label="Search" onClick={() => navigate('/search')}>
              <Search aria-hidden="true" />
            </IconButton>
          </header>
          <main id="main" tabIndex={-1} className={s.main}>
            <div className={s.content}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <div className={s.bottom}>
        <MobileNav items={MOBILE_ITEMS} />
      </div>
      <button type="button" className={s.fab} aria-label="Capture" aria-haspopup="dialog" onClick={() => open()}>
        <Plus aria-hidden="true" />
      </button>
      <CaptureHost open={captureOpen} preset={preset} onClose={close} />
    </CaptureContext.Provider>
    </ToastProvider>
  )
}
