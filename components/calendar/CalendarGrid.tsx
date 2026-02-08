'use client'

import { getCalendarDays, formatDate, WEEKDAYS } from '@/lib/utils/calendar'
import type { ScheduleWithDetails } from '@/lib/types/database'
import CalendarDay from './CalendarDay'

interface CalendarGridProps {
  currentDate: Date
  schedules: ScheduleWithDetails[]
  currentMemberId: string | null
  onComplete: (scheduleId: string) => void
}

export default function CalendarGrid({
  currentDate,
  schedules,
  currentMemberId,
  onComplete,
}: CalendarGridProps) {
  const days = getCalendarDays(currentDate)

  const schedulesByDate = schedules.reduce((acc, schedule) => {
    const date = schedule.scheduled_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(schedule)
    return acc
  }, {} as Record<string, ScheduleWithDetails[]>)

  return (
    <div>
      <div className="grid grid-cols-7 border-l border-t">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`py-2 text-center text-sm font-medium border-b border-r ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l">
        {days.map((day) => {
          const dateStr = formatDate(day)
          return (
            <CalendarDay
              key={dateStr}
              date={day}
              currentMonth={currentDate}
              schedules={schedulesByDate[dateStr] || []}
              currentMemberId={currentMemberId}
              onComplete={onComplete}
            />
          )
        })}
      </div>
    </div>
  )
}
