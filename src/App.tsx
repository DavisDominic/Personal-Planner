import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from './app/AppShell'
import { CalendarView } from './app/calendar/CalendarView'
import { calendarPath } from './app/calendar/calendarPaths'
import { GoalsPage } from './app/goals/GoalsPage'
import { LookingBackPage } from './app/lookingBack/LookingBackPage'
import { SearchPage } from './app/search/SearchPage'
import { SettingsPage } from './app/settings/SettingsPage'
import { today } from './domain/index'
import Gallery from './gallery/Gallery'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Opening the app, and the Today link, both land on today's Day (PRD 4, 25). */}
          <Route index element={<Navigate to={calendarPath('day', today())} replace />} />
          <Route path="calendar" element={<Navigate to={calendarPath('day', today())} replace />} />
          <Route path="calendar/:view" element={<CalendarView />} />
          <Route path="calendar/:view/:date" element={<CalendarView />} />
          <Route path="looking-back" element={<LookingBackPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to={calendarPath('day', today())} replace />} />
        </Route>
        <Route path="gallery" element={<Gallery />} />
      </Routes>
    </BrowserRouter>
  )
}
