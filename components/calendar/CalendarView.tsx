'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getNextMonth, getPrevMonth, getRotationMonth } from '@/lib/utils/calendar'
import type { ScheduleWithDetails, User } from '@/lib/types/database'
import CalendarHeader from './CalendarHeader'
import CalendarGrid from './CalendarGrid'

interface CalendarViewProps {
  initialSchedules: ScheduleWithDetails[]
  currentUser: User | null
  taskColors?: Record<string, string>
}

export default function CalendarView({
  initialSchedules,
  currentUser,
  taskColors,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>(initialSchedules)
  const [loading, setLoading] = useState(false)

  const fetchSchedules = useCallback(async (date: Date) => {
    setLoading(true)
    const supabase = createClient()
    const rotationMonth = getRotationMonth(date)

    const { data } = await supabase
      .from('schedules')
      .select(`
        id,
        scheduled_date,
        task:cleaning_tasks!inner (
          id,
          name,
          area:cleaning_areas!inner (
            id,
            name,
            department:departments!inner (
              id,
              name,
              color
            )
          )
        ),
        member:users!inner (
          id,
          name,
          avatar_url
        ),
        completion:completions (
          id,
          completed_at,
          completed_by
        )
      `)
      .eq('rotation_month', rotationMonth)
      .order('scheduled_date')

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformed = data.map((item: any) => ({
        id: item.id,
        scheduled_date: item.scheduled_date,
        task: {
          id: item.task.id,
          name: item.task.name,
          color: item.task.area.department.color,
          area: {
            id: item.task.area.id,
            name: item.task.area.name,
            department: {
              id: item.task.area.department.id,
              name: item.task.area.department.name,
              color: item.task.area.department.color,
            },
          },
        },
        member: {
          id: item.member.id,
          name: item.member.name,
          avatar_url: item.member.avatar_url,
        },
        completion: item.completion?.[0] || null,
      })) as ScheduleWithDetails[]
      setSchedules(transformed)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('completions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'completions' },
        () => {
          fetchSchedules(currentDate)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentDate, fetchSchedules])

  const handlePrevMonth = () => {
    const prevMonth = getPrevMonth(currentDate)
    setCurrentDate(prevMonth)
    fetchSchedules(prevMonth)
  }

  const handleNextMonth = () => {
    const nextMonth = getNextMonth(currentDate)
    setCurrentDate(nextMonth)
    fetchSchedules(nextMonth)
  }

  const handleComplete = async (scheduleId: string) => {
    if (!currentUser) return

    const supabase = createClient()
    const { error } = await supabase.from('completions').insert({
      schedule_id: scheduleId,
      completed_by: currentUser.id,
    })

    if (!error) {
      fetchSchedules(currentDate)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {taskColors && (
        <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap gap-3">
          {Object.entries(taskColors).map(([task, color]) => (
            <div key={task} className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600">{task}</span>
            </div>
          ))}
        </div>
      )}
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      ) : (
        <CalendarGrid
          currentDate={currentDate}
          schedules={schedules}
          currentMemberId={currentUser?.id || null}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}
