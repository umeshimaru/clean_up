'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Department } from '@/lib/types/database'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', color: '#6366f1' })

  const supabase = createClient()

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .order('sort_order')
    setDepartments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await supabase.from('departments').update(formData).eq('id', editingId)
    } else {
      await supabase.from('departments').insert(formData)
    }
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', description: '', color: '#6366f1' })
    fetchDepartments()
  }

  const handleEdit = (dept: Department) => {
    setFormData({ name: dept.name, description: dept.description || '', color: dept.color })
    setEditingId(dept.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('この部署を削除しますか？関連するエリアやメンバーも削除されます。')) {
      await supabase.from('departments').delete().eq('id', id)
      fetchDepartments()
    }
  }

  if (loading) return <div>読み込み中...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">部署管理</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', description: '', color: '#6366f1' }) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新規作成
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? '部署を編集' : '部署を作成'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部署名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">カラー</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-10 border rounded-lg cursor-pointer"
              />
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">カラー</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">部署名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">説明</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {departments.map((dept) => (
              <tr key={dept.id}>
                <td className="px-6 py-4">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: dept.color }}></div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{dept.name}</td>
                <td className="px-6 py-4 text-gray-500">{dept.description || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(dept)} className="text-blue-600 hover:text-blue-800 mr-3">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(dept.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  部署がまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
