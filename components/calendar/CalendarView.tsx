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
}

// エリアごとに異なる色を割り当てるパレット（12色）
const colorPalette = [
  '#BFDBFE', // 青
  '#BBF7D0', // 緑
  '#FECACA', // 赤
  '#FEF08A', // 黄色
  '#DDD6FE', // 紫
  '#FBCFE8', // ピンク
  '#FED7AA', // オレンジ
  '#A5F3FC', // シアン
  '#D9F99D', // ライム
  '#E9D5FF', // ラベンダー
  '#FECDD3', // ローズ
  '#C7D2FE', // インディゴ
]

// エリア名の色を管理するマップ（動的に割り当て）
const areaColorCache = new Map<string, string>()
let colorIndex = 0

// エリア名に基づいて色を取得（各エリアに固有の色を割り当て）
const getAreaColor = (areaName: string): string => {
  if (!areaColorCache.has(areaName)) {
    areaColorCache.set(areaName, colorPalette[colorIndex % colorPalette.length])
    colorIndex++
  }
  return areaColorCache.get(areaName)!
}

export default function CalendarView({
  initialSchedules,
  currentUser,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>(initialSchedules)
  const [loading, setLoading] = useState(true)

  const fetchSchedules = useCallback(async (date: Date) => {
    setLoading(true)
    const supabase = createClient()
    const rotationMonth = getRotationMonth(date)

    const { data } = await supabase
      .from('schedules')
      .select(`
        id,
        scheduled_date,
        cleaning_tasks (
          id,
          name,
          cleaning_areas (
            id,
            name,
            department_id
          )
        ),
        users (
          id,
          name,
          avatar_url
        ),
        completions (
          id,
          completed_at,
          completed_by
        )
      `)
      .eq('rotation_month', rotationMonth)
      .order('scheduled_date')

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformed = data.map((item: any) => {
        const task = item.cleaning_tasks as { id: string; name: string; cleaning_areas: { id: string; name: string; department_id: string } } | null
        const member = item.users as { id: string; name: string; avatar_url: string | null } | null
        const completion = item.completions as { id: string; completed_at: string; completed_by: string }[] | null

        if (!task || !member) return null

        const taskColor = getAreaColor(task.cleaning_areas.name)

        return {
          id: item.id,
          scheduled_date: item.scheduled_date,
          task: {
            id: task.id,
            name: task.name,
            color: taskColor,
            area: {
              id: task.cleaning_areas.id,
              name: task.cleaning_areas.name,
              department: {
                id: task.cleaning_areas.department_id,
                name: '',
                color: taskColor,
              },
            },
          },
          member: {
            id: member.id,
            name: member.name,
            avatar_url: member.avatar_url,
          },
          completion: completion?.[0] || null,
        }
      }).filter(Boolean) as ScheduleWithDetails[]
      setSchedules(transformed)
    }
    setLoading(false)
  }, [])

  // 初回マウント時にデータを取得
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      const supabase = createClient()
      const rotationMonth = getRotationMonth(currentDate)

      const { data } = await supabase
        .from('schedules')
        .select(`
          id,
          scheduled_date,
          cleaning_tasks (
            id,
            name,
            cleaning_areas (
              id,
              name,
              department_id
            )
          ),
          users (
            id,
            name,
            avatar_url
          ),
          completions (
            id,
            completed_at,
            completed_by
          )
        `)
        .eq('rotation_month', rotationMonth)
        .order('scheduled_date')

      if (!isMounted) return

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformed = data.map((item: any) => {
          const task = item.cleaning_tasks as { id: string; name: string; cleaning_areas: { id: string; name: string; department_id: string } } | null
          const member = item.users as { id: string; name: string; avatar_url: string | null } | null
          const completion = item.completions as { id: string; completed_at: string; completed_by: string }[] | null

          if (!task || !member) return null

          const taskColor = getAreaColor(task.cleaning_areas.name)

          return {
            id: item.id,
            scheduled_date: item.scheduled_date,
            task: {
              id: task.id,
              name: task.name,
              color: taskColor,
              area: {
                id: task.cleaning_areas.id,
                name: task.cleaning_areas.name,
                department: {
                  id: task.cleaning_areas.department_id,
                  name: '',
                  color: taskColor,
                },
              },
            },
            member: {
              id: member.id,
              name: member.name,
              avatar_url: member.avatar_url,
            },
            completion: completion?.[0] || null,
          }
        }).filter(Boolean) as ScheduleWithDetails[]
        setSchedules(transformed)
      }
      setLoading(false)
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // スケジュールからユニークなエリア名と色を取得
  const uniqueAreas = Array.from(
    new Map(schedules.map(s => [s.task.area.name, s.task.color])).entries()
  )

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {uniqueAreas.length > 0 && (
        <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap gap-3">
          {uniqueAreas.map(([areaName, color]) => (
            <div key={areaName} className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600">{areaName}</span>
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
