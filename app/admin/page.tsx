import { createClient } from "@/lib/supabase/server"
import { Building2, Users, MapPin, ClipboardList } from 'lucide-react'

async function getStats() {
  const supabase = await createClient()

  const [departments, users, areas, tasks] = await Promise.all([
    supabase.from('departments').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('cleaning_areas').select('id', { count: 'exact', head: true }),
    supabase.from('cleaning_tasks').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  return {
    departments: departments.count || 0,
    users: users.count || 0,
    areas: areas.count || 0,
    tasks: tasks.count || 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    { label: '部署', count: stats.departments, icon: Building2, href: '/admin/departments' },
    { label: 'ユーザー', count: stats.users, icon: Users, href: '/admin/users' },
    { label: 'エリア', count: stats.areas, icon: MapPin, href: '/admin/areas' },
    { label: 'タスク', count: stats.tasks, icon: ClipboardList, href: '/admin/tasks' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-8">管理ダッシュボード</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <a
              key={card.label}
              href={card.href}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.count}</p>
                </div>
              </div>
            </a>
          )
        })}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">クイックスタート</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>まず<a href="/admin/departments" className="text-blue-600 hover:underline">部署</a>を作成</li>
          <li>次に<a href="/admin/users" className="text-blue-600 hover:underline">ユーザー</a>を登録</li>
          <li><a href="/admin/areas" className="text-blue-600 hover:underline">掃除エリア</a>を設定</li>
          <li>各エリアに<a href="/admin/tasks" className="text-blue-600 hover:underline">タスク</a>を追加</li>
          <li>最後に<a href="/admin/schedules" className="text-blue-600 hover:underline">スケジュール</a>を生成</li>
        </ol>
      </div>
    </div>
  )
}
