'use client'

import { Check } from 'lucide-react'
import clsx from 'clsx'
import type { ScheduleWithDetails } from '@/lib/types/database'

interface TaskCardProps {
  schedule: ScheduleWithDetails
  currentMemberId: string | null
  onComplete: (scheduleId: string) => void
}

export default function TaskCard({
  schedule,
  currentMemberId,
  onComplete,
}: TaskCardProps) {
  const isCompleted = !!schedule.completion
  const isMyTask = schedule.member.id === currentMemberId
  const canComplete = isMyTask && !isCompleted

  return (
    <div
      className={clsx(
        'text-xs p-1 rounded mb-1',
        isCompleted && 'opacity-60',
        isMyTask && !isCompleted && 'ring-1 ring-blue-400'
      )}
      style={{ backgroundColor: schedule.task.color }}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-800 truncate">
            {schedule.member.name}
          </div>
        </div>

        {canComplete && (
          <button
            onClick={() => onComplete(schedule.id)}
            className="shrink-0 w-4 h-4 flex items-center justify-center rounded border border-gray-400 bg-white hover:bg-blue-50 transition-colors"
            title="完了にする"
          >
            <Check className="w-3 h-3 text-gray-400" />
          </button>
        )}

        {isCompleted && (
          <div className="shrink-0 w-4 h-4 flex items-center justify-center rounded bg-green-600">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}
