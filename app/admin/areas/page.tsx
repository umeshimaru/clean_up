'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import type { CleaningArea, CleaningTask } from '@/lib/types/database'

interface TodoItemFormData {
  id?: string
  name: string
  warning?: string
  _deleted?: boolean
}

export default function AreasPage() {
  const { user, loading: userLoading } = useCurrentUser()
  const [areas, setAreas] = useState<CleaningArea[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [todoItems, setTodoItems] = useState<TodoItemFormData[]>([])

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

    let areaId = editingId

    if (editingId) {
      await supabase.from('cleaning_areas').update(formData).eq('id', editingId)
    } else {
      // sort_orderを連番で設定
      const nextSortOrder = areas.length + 1
      const { data: newArea } = await supabase.from('cleaning_areas').insert({
        ...formData,
        department_id: user.department_id,
        sort_order: nextSortOrder,
      }).select().single()
      areaId = newArea?.id
    }

    if (areaId) {
      // やることの保存
      for (const item of todoItems) {
        if (item._deleted && item.id) {
          // 既存アイテムの削除（非アクティブ化）
          await supabase.from('cleaning_tasks').update({ is_active: false }).eq('id', item.id)
        } else if (item.id && !item._deleted) {
          // 既存アイテムの更新
          await supabase.from('cleaning_tasks').update({
            name: item.name,
            warning: item.warning || null,
          }).eq('id', item.id)
        } else if (!item.id && !item._deleted) {
          // 新規アイテムの作成
          const existingTasks = await supabase
            .from('cleaning_tasks')
            .select('id')
            .eq('area_id', areaId)
          const nextSortOrder = (existingTasks.data?.length || 0) + 1
          await supabase.from('cleaning_tasks').insert({
            area_id: areaId,
            name: item.name,
            warning: item.warning || null,
            sort_order: nextSortOrder,
          })
        }
      }
    }

    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', description: '' })
    setTodoItems([])
    fetchData()
  }

  const handleEdit = async (area: CleaningArea) => {
    setFormData({ name: area.name, description: area.description || '' })
    setEditingId(area.id)

    // エリアに紐付くやることを取得
    const { data: tasks } = await supabase
      .from('cleaning_tasks')
      .select('*')
      .eq('area_id', area.id)
      .eq('is_active', true)
      .order('sort_order')

    setTodoItems((tasks || []).map((t: CleaningTask) => ({
      id: t.id,
      name: t.name,
      warning: t.warning || '',
    })))
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
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', description: '' }); setTodoItems([]) }}
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

            {/* やることセクション */}
            <div className="border-t pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">やること</label>
              <div className="space-y-2">
                {todoItems.map((item, index) => {
                  if (item._deleted) return null
                  return (
                    <div key={index} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...todoItems]
                            newItems[index] = { ...newItems[index], name: e.target.value }
                            setTodoItems(newItems)
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="やることの名前"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...todoItems]
                            if (item.id) {
                              // 既存アイテムは削除フラグを立てる
                              newItems[index] = { ...newItems[index], _deleted: true }
                            } else {
                              // 新規アイテムは配列から削除
                              newItems.splice(index, 1)
                            }
                            setTodoItems(newItems)
                          }}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.warning || ''}
                        onChange={(e) => {
                          const newItems = [...todoItems]
                          newItems[index] = { ...newItems[index], warning: e.target.value }
                          setTodoItems(newItems)
                        }}
                        className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder="警告メッセージ（任意）"
                      />
                    </div>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setTodoItems([...todoItems, { name: '', warning: '' }])}
                className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-4 h-4" />
                やることを追加
              </button>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                保存
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setTodoItems([]) }}
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
