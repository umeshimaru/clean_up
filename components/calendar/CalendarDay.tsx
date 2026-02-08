'use client'

import clsx from 'clsx'
import { formatDayNumber, isSameMonth, isToday } from '@/lib/utils/calendar'
import type { ScheduleWithDetails } from '@/lib/types/database'
import TaskCard from './TaskCard'

interface CalendarDayProps {
  date: Date
  currentMonth: Date
  schedules: ScheduleWithDetails[]
  currentMemberId: string | null
  onComplete: (scheduleId: string) => void
}

export default function CalendarDay({
  date,
  currentMonth,
  schedules,
  currentMemberId,
  onComplete,
}: CalendarDayProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth)
  const isCurrentDay = isToday(date)
  const dayNumber = formatDayNumber(date)
  const dayOfWeek = date.getDay()
  const isSunday = dayOfWeek === 0
  const isSaturday = dayOfWeek === 6

  return (
    <div
      className={clsx(
        'min-h-[120px] p-1 border-b border-r',
        !isCurrentMonth && 'bg-gray-50'
      )}
    >
      <div
        className={clsx(
          'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
          isCurrentDay && 'bg-blue-600 text-white',
          !isCurrentDay && isSunday && 'text-red-500',
          !isCurrentDay && isSaturday && 'text-blue-500',
          !isCurrentDay && !isSunday && !isSaturday && 'text-gray-700',
          !isCurrentMonth && !isCurrentDay && 'opacity-40'
        )}
      >
        {dayNumber}
      </div>

      <div className="space-y-1">
        {schedules.map((schedule) => (
          <TaskCard
            key={schedule.id}
            schedule={schedule}
            currentMemberId={currentMemberId}
            onComplete={onComplete}
          />
        ))}
      </div>
    </div>
  )
}
