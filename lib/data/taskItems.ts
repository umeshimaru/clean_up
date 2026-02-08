export interface TaskItem {
  id: string
  taskType: string
  label: string
  order: number
}

export const taskItems: Record<string, TaskItem[]> = {
  'トイレ掃除': [
    { id: 't1', taskType: 'トイレ掃除', label: '便器を洗剤で磨く', order: 1 },
    { id: 't2', taskType: 'トイレ掃除', label: '便座を拭く', order: 2 },
    { id: 't3', taskType: 'トイレ掃除', label: '床を拭く', order: 3 },
    { id: 't4', taskType: 'トイレ掃除', label: 'トイレットペーパーを補充する', order: 4 },
    { id: 't5', taskType: 'トイレ掃除', label: 'ゴミ箱を空にする', order: 5 },
  ],
  'キッチン掃除': [
    { id: 'k1', taskType: 'キッチン掃除', label: 'シンクを洗う', order: 1 },
    { id: 'k2', taskType: 'キッチン掃除', label: 'コンロ周りを拭く', order: 2 },
    { id: 'k3', taskType: 'キッチン掃除', label: '調理台を拭く', order: 3 },
    { id: 'k4', taskType: 'キッチン掃除', label: '食器を片付ける', order: 4 },
  ],
  'ゴミ出し': [
    { id: 'g1', taskType: 'ゴミ出し', label: '各フロアのゴミ箱を回収する', order: 1 },
    { id: 'g2', taskType: 'ゴミ出し', label: 'ゴミを分別する', order: 2 },
    { id: 'g3', taskType: 'ゴミ出し', label: '指定場所にゴミを出す', order: 3 },
    { id: 'g4', taskType: 'ゴミ出し', label: '新しいゴミ袋をセットする', order: 4 },
  ],
  '床掃除': [
    { id: 'f1', taskType: '床掃除', label: '掃除機をかける', order: 1 },
    { id: 'f2', taskType: '床掃除', label: 'モップで拭く', order: 2 },
    { id: 'f3', taskType: '床掃除', label: '角や隅を確認する', order: 3 },
  ],
  '窓拭き': [
    { id: 'w1', taskType: '窓拭き', label: '窓ガラスを拭く', order: 1 },
    { id: 'w2', taskType: '窓拭き', label: '窓枠を拭く', order: 2 },
    { id: 'w3', taskType: '窓拭き', label: '網戸をチェックする', order: 3 },
  ],
}

export function getTaskItemsByType(taskType: string): TaskItem[] {
  return taskItems[taskType] || []
}
