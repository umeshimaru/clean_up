'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface NextSchedule {
  id: string
  date: string
  dayOfWeek: string
  task: string
  area: string
  memberId: string
  memberName: string
}

const dayOfWeekMap = ['日', '月', '火', '水', '木', '金', '土']

export function useNextSchedule(userId: string | undefined) {
  const [nextSchedule, setNextSchedule] = useState<NextSchedule | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    async function fetchNextSchedule() {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('schedules')
        .select(`
          id,
          scheduled_date,
          member_id,
          cleaning_tasks (
            id,
            name,
            cleaning_areas (
              id,
              name
            )
          ),
          users (
            id,
            name
          )
        `)
        .eq('member_id', userId)
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .single()

      if (error || !data) {
        setNextSchedule(null)
        setLoading(false)
        return
      }

      const date = new Date(data.scheduled_date)
      const dayOfWeek = dayOfWeekMap[date.getDay()]

      const task = data.cleaning_tasks as unknown as { id: string; name: string; cleaning_areas: { id: string; name: string } } | null
      const member = data.users as unknown as { id: string; name: string } | null

      if (!task || !member) {
        setNextSchedule(null)
        setLoading(false)
        return
      }

      setNextSchedule({
        id: data.id,
        date: data.scheduled_date,
        dayOfWeek,
        task: task.name,
        area: task.cleaning_areas.name,
        memberId: member.id,
        memberName: member.name,
      })
      setLoading(false)
    }

    fetchNextSchedule()
  }, [userId])

  return { nextSchedule, loading }
}
