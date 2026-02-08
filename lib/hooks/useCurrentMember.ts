'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Member } from '@/lib/types/database'

export function useCurrentMember() {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function fetchMember() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      setMember(data)
      setLoading(false)
    }

    fetchMember()
  }, [])

  return { member, loading, isAdmin: member?.is_admin ?? false }
}
