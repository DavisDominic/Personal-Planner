import { Archive, CalendarDays, Search, Settings, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AppNavItem = { label: string; to: string; icon: LucideIcon }

/** Primary places (PRD 4). */
export const PRIMARY_NAV: AppNavItem[] = [
  { label: 'Calendar', to: '/calendar', icon: CalendarDays },
  { label: 'Looking Back', to: '/looking-back', icon: Archive },
  { label: 'Goals', to: '/goals', icon: Target },
]

/** Utility layers: Search and Settings. */
export const SEARCH_NAV: AppNavItem = { label: 'Search', to: '/search', icon: Search }
export const SETTINGS_NAV: AppNavItem = { label: 'Settings', to: '/settings', icon: Settings }
