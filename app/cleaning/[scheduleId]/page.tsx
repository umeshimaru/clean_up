'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Check, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { dummySchedules, formatDateJapanese } from '@/lib/data/dummy'
import { getTaskItemsByType } from '@/lib/data/taskItems'

interface CheckedState {
  [itemId: string]: boolean
}

export default function CleaningTaskPage() {
  const params = useParams()
  const scheduleId = params.scheduleId as string

  const schedule = dummySchedules.find(s => s.id === scheduleId)
  const taskItems = schedule ? getTaskItemsByType(schedule.task) : []

  const [checkedItems, setCheckedItems] = useState<CheckedState>({})

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const allCompleted = taskItems.length > 0 &&
    taskItems.every(item => checkedItems[item.id])

  if (!schedule) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-500">担当が見つかりません</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            ホームに戻る
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">掃除タスク</h1>
        </header>

        <div
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
          style={{ borderLeft: `4px solid ${schedule.color}` }}
        >
          <div className="space-y-2">
            <p className="text-lg font-bold text-gray-800">{schedule.task}</p>
            <p className="text-gray-600">{schedule.area}</p>
            <p className="text-sm text-gray-500">
              {formatDateJapanese(schedule.date)}（{schedule.dayOfWeek}）
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">やることリスト</h2>
          <ul className="space-y-3">
            {taskItems.map((item) => (
              <li key={item.id}>
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checkedItems[item.id] || false}
                    onChange={() => toggleItem(item.id)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`flex-1 ${checkedItems[item.id] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  {checkedItems[item.id] && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </label>
              </li>
            ))}
          </ul>

          {allCompleted && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <p className="text-green-800 font-medium">
                全てのタスクが完了しました！
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
