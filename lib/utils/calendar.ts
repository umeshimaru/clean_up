import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { ja } from 'date-fns/locale'

export function getCalendarDays(date: Date): Date[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
}

export function formatMonthYear(date: Date): string {
  return format(date, 'yyyy年M月', { locale: ja })
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatDayNumber(date: Date): string {
  return format(date, 'd')
}

export function getNextMonth(date: Date): Date {
  return addMonths(date, 1)
}

export function getPrevMonth(date: Date): Date {
  return subMonths(date, 1)
}

export { isSameMonth, isSameDay, isToday }

export function getRotationMonth(date: Date): string {
  return format(date, 'yyyy-MM')
}

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
