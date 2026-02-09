import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { endOfMonth, addDays, differenceInDays } from 'date-fns'
import { formatDate, getRotationMonth } from '@/lib/utils/calendar'

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
    return
  }

  // 新規登録されたユーザーのIDを取得してスケジュールを割り当て
  const { data: newUser } = await adminClient
    .from('users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (newUser && department) {
    await assignInitialSchedule(adminClient, newUser.id, department.id)
  }
}

const SCHEDULE_RETRY_COUNT = 3

/**
 * 新規ユーザーに初期スケジュールを割り当てる
 * エラーが発生してもユーザー登録には影響しない
 */
async function assignInitialSchedule(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  departmentId: string
): Promise<void> {
  try {
    // 1. まず部署に紐づくエリアIDを取得
    const { data: areas, error: areasError } = await adminClient
      .from('cleaning_areas')
      .select('id')
      .eq('department_id', departmentId)

    console.log('Areas for department:', departmentId, areas, areasError)

    if (areasError) {
      console.error('Failed to fetch areas:', areasError)
      return
    }

    if (!areas || areas.length === 0) {
      console.log('No cleaning areas found for department:', departmentId)
      return
    }

    const areaIds = areas.map(a => a.id)

    // 2. エリアに紐づくアクティブなタスクを取得
    const { data: tasks, error: tasksError } = await adminClient
      .from('cleaning_tasks')
      .select('id')
      .eq('is_active', true)
      .in('area_id', areaIds)

    console.log('Tasks found:', tasks, tasksError)

    if (tasksError) {
      console.error('Failed to fetch tasks:', tasksError)
      return
    }

    if (!tasks || tasks.length === 0) {
      console.log('No active tasks found for department:', departmentId)
      return
    }

    // 2. 当月の残り日数を計算
    const today = new Date()
    const monthEnd = endOfMonth(today)
    const remainingDays = differenceInDays(monthEnd, today) + 1

    if (remainingDays <= 0) {
      console.log('No remaining days in current month')
      return
    }

    const rotationMonth = getRotationMonth(today)

    // 3. リトライロジック付きでスケジュールを登録
    for (let attempt = 0; attempt < SCHEDULE_RETRY_COUNT; attempt++) {
      // ランダムなタスクを選択
      const randomTaskIndex = Math.floor(Math.random() * tasks.length)
      const selectedTask = tasks[randomTaskIndex]

      // ランダムな日付を選択（今日から月末まで）
      const randomDayOffset = Math.floor(Math.random() * remainingDays)
      const scheduledDate = addDays(today, randomDayOffset)
      const scheduledDateStr = formatDate(scheduledDate)

      // 重複チェック
      const { data: existing } = await adminClient
        .from('schedules')
        .select('id')
        .eq('task_id', selectedTask.id)
        .eq('scheduled_date', scheduledDateStr)
        .single()

      if (existing) {
        console.log(`Schedule already exists for task ${selectedTask.id} on ${scheduledDateStr}, retrying...`)
        continue
      }

      // スケジュールを登録
      const { error: insertError } = await adminClient
        .from('schedules')
        .insert({
          task_id: selectedTask.id,
          member_id: userId,
          scheduled_date: scheduledDateStr,
          rotation_month: rotationMonth,
        })

      if (!insertError) {
        console.log('Initial schedule created:', scheduledDateStr, 'for task:', selectedTask.id)
        return
      }

      console.error('Failed to insert schedule:', insertError)
    }

    console.log('Could not create initial schedule after retries')
  } catch (error) {
    console.error('Failed to assign initial schedule:', error)
  }
}
