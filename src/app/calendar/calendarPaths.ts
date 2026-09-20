export type CalendarViewName = 'year' | 'month' | 'week' | 'day'

export const CALENDAR_VIEWS: CalendarViewName[] = ['day', 'week', 'month', 'year']

export const calendarPath = (view: CalendarViewName, date: string) => `/calendar/${view}/${date}`
export const dayPath = (date: string) => calendarPath('day', date)
