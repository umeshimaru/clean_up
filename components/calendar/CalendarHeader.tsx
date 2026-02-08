'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthYear } from '@/lib/utils/calendar'

interface CalendarHeaderProps {
  currentDate: Date
  onPrevMonth: () => void
  onNextMonth: () => void
}

export default function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <button
        onClick={onPrevMonth}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="前月"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      <h2 className="text-xl font-semibold text-gray-800">
        {formatMonthYear(currentDate)}
      </h2>

      <button
        onClick={onNextMonth}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="翌月"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  )
}
