'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, RefreshCw } from 'lucide-react'

export default function SchedulesPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  const handleGenerate = async () => {
    if (!confirm(`${year}年${month}月のスケジュールを生成しますか？既存のスケジュールは上書きされます。`)) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.rpc('generate_monthly_schedule', {
        p_year: year,
        p_month: month,
      })

      if (error) throw error

      setMessage({ type: 'success', text: `${year}年${month}月のスケジュールを生成しました。` })
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: 'スケジュールの生成に失敗しました。タスクとメンバーが登録されているか確認してください。' })
    } finally {
      setLoading(false)
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 1)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">スケジュール生成</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold">月別スケジュール生成</h2>
        </div>

        <p className="text-gray-600 mb-6">
          選択した月のスケジュールを自動生成します。各タスクは部署内のメンバーで日替わりローテーションされます。
        </p>

        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">年</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">月</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          {loading ? '生成中...' : 'スケジュールを生成'}
        </button>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">生成のしくみ</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>- 各タスクは担当エリアの部署に割り当て</li>
            <li>- 部署内メンバーで日替わりローテーション</li>
            <li>- 毎日・毎週・毎月タスクに対応</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
