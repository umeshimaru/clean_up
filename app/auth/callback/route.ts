import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const DEFAULT_DEPARTMENT_NAME = '開発'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await ensureUserRegistered(user)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}

async function ensureUserRegistered(user: { id: string; email?: string; user_metadata?: { full_name?: string; avatar_url?: string } }) {
  console.log('=== ensureUserRegistered called ===')
  console.log('User:', JSON.stringify(user, null, 2))

  const adminClient = createAdminClient()

  // 既にusersテーブルに登録されているか確認
  const { data: existingUser, error: selectError } = await adminClient
    .from('users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existingUser) {
    // 既に登録済み
    return
  }

  // デフォルト部署を取得または作成
  let { data: department } = await adminClient
    .from('departments')
    .select('id')
    .eq('name', DEFAULT_DEPARTMENT_NAME)
    .single()

  if (!department) {
    // 部署が存在しない場合は作成
    const { data: newDepartment } = await adminClient
      .from('departments')
      .insert({ name: DEFAULT_DEPARTMENT_NAME })
      .select('id')
      .single()
    department = newDepartment
  }

  if (!department) {
    console.error('Failed to get or create default department')
    return
  }

  // 初期ユーザーかどうか確認（usersテーブルにレコードがあるか）
  const { count } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })

  const isFirstUser = count === 0

  // ユーザーをusersテーブルに登録
  const { error: insertError } = await adminClient
    .from('users')
    .insert({
      user_id: user.id,
      department_id: department.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url,
      is_admin: isFirstUser, // 初期ユーザーのみ管理者
      is_active: true,
    })

  if (insertError) {
    console.error('Failed to register user:', insertError)
  }
}
