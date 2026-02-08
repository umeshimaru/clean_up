'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import type { CleaningArea } from '@/lib/types/database'

export default function AreasPage() {
  const { user, loading: userLoading } = useCurrentUser()
  const [areas, setAreas] = useState<CleaningArea[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  const supabase = createClient()

  const fetchData = async () => {
    if (!user?.department_id) return

    const { data } = await supabase
      .from('cleaning_areas')
      .select('*')
      .eq('department_id', user.department_id)
      .order('sort_order')

    setAreas(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (user?.department_id) {
      fetchData()
    }
  }, [user?.department_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.department_id) return

    if (editingId) {
      await supabase.from('cleaning_areas').update(formData).eq('id', editingId)
    } else {
      await supabase.from('cleaning_areas').insert({
        ...formData,
        department_id: user.department_id,
      })
    }
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', description: '' })
    fetchData()
  }

  const handleEdit = (area: CleaningArea) => {
    setFormData({ name: area.name, description: area.description || '' })
    setEditingId(area.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('このエリアを削除しますか？関連するタスクも削除されます。')) {
      await supabase.from('cleaning_areas').delete().eq('id', id)
      fetchData()
    }
  }

  if (userLoading || loading) return <div>読み込み中...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">エリア管理</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', description: '' }) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新規作成
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'エリアを編集' : 'エリアを作成'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">エリア名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                placeholder="例: 1階トイレ、2階キッチン"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">エリア名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">説明</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {areas.map((area) => (
              <tr key={area.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{area.name}</td>
                <td className="px-6 py-4 text-gray-500">{area.description || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(area)} className="text-blue-600 hover:text-blue-800 mr-3">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(area.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {areas.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  エリアがまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
