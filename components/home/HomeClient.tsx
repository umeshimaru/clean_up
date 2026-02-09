'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, User, Play, Settings } from 'lucide-react'
import CalendarView from '@/components/calendar/CalendarView'
import type { User as AppUser, ScheduleWithDetails } from '@/lib/types/database'

interface NextTask {
  id: string
  date: string
  dayOfWeek: string
  area: string
}

interface HomeClientProps {
  currentUser: AppUser
  nextTask: NextTask | null
  schedulesForCalendar: ScheduleWithDetails[]
}

function isToday(dateStr: string): boolean {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return dateStr === today
}

function formatDateJapanese(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export default function HomeClient({
  currentUser,
  nextTask,
  schedulesForCalendar,
}: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<'next' | 'calendar'>('next')

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            アドネスお掃除管理アプリ
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <span className="text-sm text-gray-600">{currentUser.name}</span>
            </div>
            {currentUser.is_admin && (
              <Link
                href="/admin"
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                管理
              </Link>
            )}
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ログアウト
              </button>
            </form>
          </div>
        </header>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('next')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'next'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className="w-4 h-4" />
            次の担当
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            カレンダー
          </button>
        </div>

        {activeTab === 'next' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            {nextTask ? (
              <div className="text-center">
                <p className="text-gray-500 mb-4">次のあなたの担当:</p>
                <div className="space-y-3">
                  <p className="text-2xl font-bold text-gray-800">
                    {formatDateJapanese(nextTask.date)}（{nextTask.dayOfWeek}）
                  </p>
                  <p className="text-xl text-blue-600">
                    {nextTask.area}
                  </p>
                  {isToday(nextTask.date) && (
                    <Link
                      href={`/cleaning/${nextTask.id}`}
                      className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <Play className="w-5 h-5" />
                      スタート
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>担当予定はありません</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            initialSchedules={schedulesForCalendar}
            currentUser={currentUser}
          />
        )}
      </div>
    </main>
  )
}
