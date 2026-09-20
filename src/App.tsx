import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from './app/AppShell'
import { PagePlaceholder } from './app/PagePlaceholder'
import Gallery from './gallery/Gallery'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<PagePlaceholder kicker="Where I am / where I'm going" title="Calendar" />} />
          <Route path="looking-back" element={<PagePlaceholder kicker="What happened" title="Looking Back" />} />
          <Route path="goals" element={<PagePlaceholder kicker="What direction I'm choosing" title="Goals" />} />
          <Route path="search" element={<PagePlaceholder kicker="Find anything" title="Search" />} />
          <Route path="settings" element={<PagePlaceholder kicker="Backup, restore and preferences" title="Settings" />} />
          <Route path="*" element={<Navigate to="/calendar" replace />} />
        </Route>
        <Route path="gallery" element={<Gallery />} />
      </Routes>
    </BrowserRouter>
  )
}
