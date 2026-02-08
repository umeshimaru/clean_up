'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types/database'

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function fetchUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .single()

      setUser(data)
      setLoading(false)
    }

    fetchUser()
  }, [])

  return { user, loading, isAdmin: user?.is_admin ?? false }
}
