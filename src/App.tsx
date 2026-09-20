import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from './app/AppShell'
import { CalendarView } from './app/calendar/CalendarView'
import { calendarPath } from './app/calendar/calendarPaths'
import { GoalsPage } from './app/goals/GoalsPage'
import { PagePlaceholder } from './app/PagePlaceholder'
import { today } from './domain/index'
import Gallery from './gallery/Gallery'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Opening the app lands on today's Day (PRD 25); the Calendar link opens the month. */}
          <Route index element={<Navigate to={calendarPath('day', today())} replace />} />
          <Route path="calendar" element={<Navigate to={calendarPath('month', today())} replace />} />
          <Route path="calendar/:view" element={<CalendarView />} />
          <Route path="calendar/:view/:date" element={<CalendarView />} />
          <Route path="looking-back" element={<PagePlaceholder kicker="What happened" title="Looking Back" />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="search" element={<PagePlaceholder kicker="Find anything" title="Search" />} />
          <Route path="settings" element={<PagePlaceholder kicker="Backup, restore and preferences" title="Settings" />} />
          <Route path="*" element={<Navigate to={calendarPath('day', today())} replace />} />
        </Route>
        <Route path="gallery" element={<Gallery />} />
      </Routes>
    </BrowserRouter>
  )
}
