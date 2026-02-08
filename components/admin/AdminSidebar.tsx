'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Users, MapPin, ClipboardList, Calendar, Home } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/admin', label: 'ダッシュボード', icon: Home },
  { href: '/admin/departments', label: '部署', icon: Building2 },
  { href: '/admin/users', label: 'ユーザー', icon: Users },
  { href: '/admin/areas', label: 'エリア', icon: MapPin },
  { href: '/admin/tasks', label: 'タスク', icon: ClipboardList },
  { href: '/admin/schedules', label: 'スケジュール', icon: Calendar },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-8">
        <Link href="/" className="text-lg font-bold hover:text-gray-300 transition-colors">
          お掃除管理アプリ
        </Link>
        <p className="text-xs text-gray-400 mt-1">管理画面</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
