'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { CleaningArea, CleaningTask } from '@/lib/types/database'

interface AreaWithDepartment extends CleaningArea {
  department: { id: string; name: string; color: string }
}

interface TaskWithArea extends CleaningTask {
  area: AreaWithDepartment
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithArea[]>([])
  const [areas, setAreas] = useState<AreaWithDepartment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    area_id: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
  })

  const supabase = createClient()

  const fetchData = async () => {
    const [tasksRes, areasRes] = await Promise.all([
      supabase.from('cleaning_tasks').select('*, area:cleaning_areas(*, department:departments(*))').eq('is_active', true).order('sort_order'),
      supabase.from('cleaning_areas').select('*, department:departments(*)').order('sort_order'),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTasks((tasksRes.data || []).map((t: any) => ({ ...t, area: t.area })))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAreas((areasRes.data || []).map((a: any) => ({ ...a, department: a.department })))
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await supabase.from('cleaning_tasks').update(formData).eq('id', editingId)
    } else {
      await supabase.from('cleaning_tasks').insert(formData)
    }
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', description: '', area_id: '', frequency: 'daily' })
    fetchData()
  }

  const handleEdit = (task: TaskWithArea) => {
    setFormData({
      name: task.name,
      description: task.description || '',
      area_id: task.area_id,
      frequency: task.frequency,
    })
    setEditingId(task.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('このタスクを非アクティブにしますか？')) {
      await supabase.from('cleaning_tasks').update({ is_active: false }).eq('id', id)
      fetchData()
    }
  }

  const frequencyLabels = { daily: '毎日', weekly: '毎週', monthly: '毎月' }

  if (loading) return <div>読み込み中...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">タスク管理</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', description: '', area_id: areas[0]?.id || '', frequency: 'daily' }) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={areas.length === 0}
        >
          <Plus className="w-4 h-4" />
          新規作成
        </button>
      </div>

      {areas.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">先にエリアを作成してください。</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'タスクを編集' : 'タスクを作成'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">タスク名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                placeholder="例: 床掃除、ゴミ捨て"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">エリア</label>
              <select
                value={formData.area_id}
                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>{area.department.name} - {area.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">頻度</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">毎日</option>
                <option value="weekly">毎週（月曜日）</option>
                <option value="monthly">毎月（1日）</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                保存
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タスク名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">エリア</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">部署</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">頻度</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{task.name}</td>
                <td className="px-6 py-4 text-gray-500">{task.area.name}</td>
                <td className="px-6 py-4">
                  <span
                    className="px-2 py-1 text-xs rounded-full text-white"
                    style={{ backgroundColor: task.area.department.color }}
                  >
                    {task.area.department.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{frequencyLabels[task.frequency]}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(task)} className="text-blue-600 hover:text-blue-800 mr-3">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  タスクがまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
