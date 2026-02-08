'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, User, Play } from 'lucide-react'
import { dummyCurrentUser, dummySchedules, taskColors, getNextTaskForUser, formatDateJapanese } from '@/lib/data/dummy'
import CalendarView from '@/components/calendar/CalendarView'

function isToday(dateStr: string): boolean {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return dateStr === today
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'next' | 'calendar'>('next')

  const nextTask = getNextTaskForUser(dummyCurrentUser.id)

  const dummySchedulesForCalendar = dummySchedules.map(s => ({
    id: s.id,
    scheduled_date: s.date,
    task: {
      id: s.id,
      name: s.task,
      color: s.color,
      area: {
        id: '1',
        name: s.area,
        department: {
          id: '1',
          name: '総務部',
          color: s.color,
        },
      },
    },
    member: {
      id: s.memberId,
      name: s.memberName,
      avatar_url: null,
    },
    completion: null,
  }))

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            アドネスお掃除管理アプリ
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{dummyCurrentUser.name}</span>
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors">
              ログアウト
            </button>
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
            initialSchedules={dummySchedulesForCalendar}
            currentUser={{
              id: dummyCurrentUser.id,
              user_id: null,
              department_id: '1',
              name: dummyCurrentUser.name,
              email: null,
              avatar_url: null,
              is_active: true,
              is_admin: false,
              sort_order: 0,
              created_at: '',
              updated_at: '',
            }}
            taskColors={taskColors}
          />
        )}
      </div>
    </main>
  )
}
