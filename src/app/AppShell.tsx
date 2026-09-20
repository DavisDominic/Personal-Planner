import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useMatch, useNavigate } from 'react-router'
import { Menu, Plus, Search } from 'lucide-react'
import { IconButton } from '../components/Button/Button'
import { isDateString, today } from '../domain/index'
import { AppIcon } from '../components/Logo/Logo'
import { CaptureHost } from './CaptureHost'
import { MobileMenu } from './MobileMenu'
import { FirstLaunch } from './entry/FirstLaunch'
import { useEntry } from './entry/useEntry'
import { WelcomeBack } from './entry/WelcomeBack'
import { calendarPath } from './calendar/calendarPaths'
import { CaptureContext } from './captureContext'
import type { CapturePreset } from './captureContext'
import { PwaUpdates } from './PwaUpdates'
import { Sidebar } from './Sidebar'
import { ToastProvider } from './ToastProvider'
import s from './AppShell.module.css'

/**
 * The frame around every screen (PRD 4, 23; DECISIONS.md "Mobile navigation and capture").
 * Desktop: persistent sidebar. Phones and tablets: a header with a menu drawer and Search, and a
 * floating + Capture button at the bottom right. Which set shows is decided in CSS.
 */
export function AppShell() {
  const navigate = useNavigate()
  const entry = useEntry()
  const [captureOpen, setCaptureOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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

  const startToday = () => {
    void entry.finish().then(() => navigate(calendarPath('day', today()), { replace: true }))
  }

  // PRD 25: a brand new planner opens on a single Start screen, with no navigation around it.
  if (entry.state === 'first-launch') return <FirstLaunch onStart={startToday} />

  return (
    <ToastProvider>
    <CaptureContext.Provider value={capture}>
      <PwaUpdates />
      <a className={s.skip} href="#main">
        Skip to content
      </a>
      <div className={s.shell}>
        <Sidebar />
        <div>
          <header className={s.header}>
            <IconButton label="Menu" tone="plain" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <Menu aria-hidden="true" />
            </IconButton>
            <div className={s.brand}>
              <AppIcon />
              <span className={s.brandName}>Daybook</span>
            </div>
            <IconButton label="Search" tone="plain" onClick={() => navigate('/search')}>
              <Search aria-hidden="true" />
            </IconButton>
          </header>
          <main id="main" tabIndex={-1} className={s.main}>
            <div className={s.content}>
              {entry.state === 'welcome-back' ? (
                <WelcomeBack onDone={() => void entry.finish()} onStart={startToday} />
              ) : entry.state === 'loading' ? null : (
                <Outlet />
              )}
            </div>
          </main>
        </div>
      </div>
      <button type="button" className={s.fab} aria-label="Capture" aria-haspopup="dialog" onClick={() => open()}>
        <Plus aria-hidden="true" />
      </button>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <CaptureHost open={captureOpen} preset={preset} onClose={close} />
    </CaptureContext.Provider>
    </ToastProvider>
  )
}
