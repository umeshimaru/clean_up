export const dummyCurrentUser = {
  id: '1',
  name: '山田太郎',
}

// 掃除場所ごとの色設定
export const taskColors: Record<string, string> = {
  'トイレ掃除': '#FEF08A',    // 黄色
  'キッチン掃除': '#BBF7D0',  // 緑
  'ゴミ出し': '#BFDBFE',      // 青
  '床掃除': '#DDD6FE',        // 紫
  '窓拭き': '#FECACA',        // 赤
}

export interface DummySchedule {
  id: string
  date: string
  dayOfWeek: string
  task: string
  area: string
  memberId: string
  memberName: string
  color: string
}

export const dummySchedules: DummySchedule[] = [
  {
    id: '1',
    date: '2026-02-09',
    dayOfWeek: '月',
    task: 'トイレ掃除',
    area: '1階',
    memberId: '1',
    memberName: '山田太郎',
    color: taskColors['トイレ掃除'],
  },
  {
    id: '2',
    date: '2026-02-12',
    dayOfWeek: '木',
    task: 'ゴミ出し',
    area: '共有エリア',
    memberId: '2',
    memberName: '佐藤花子',
    color: taskColors['ゴミ出し'],
  },
  {
    id: '3',
    date: '2026-02-15',
    dayOfWeek: '日',
    task: '床掃除',
    area: '2階',
    memberId: '1',
    memberName: '山田太郎',
    color: taskColors['床掃除'],
  },
  {
    id: '4',
    date: '2026-02-18',
    dayOfWeek: '水',
    task: 'キッチン掃除',
    area: '1階',
    memberId: '3',
    memberName: '田中一郎',
    color: taskColors['キッチン掃除'],
  },
  {
    id: '5',
    date: '2026-02-20',
    dayOfWeek: '金',
    task: '窓拭き',
    area: '全館',
    memberId: '1',
    memberName: '山田太郎',
    color: taskColors['窓拭き'],
  },
]

export function getNextTaskForUser(userId: string): DummySchedule | null {
  const today = new Date().toISOString().split('T')[0]
  const userTasks = dummySchedules
    .filter(s => s.memberId === userId && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  return userTasks[0] || null
}

export function formatDateJapanese(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}
