export interface Department {
  id: string
  name: string
  description: string | null
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  user_id: string | null
  department_id: string
  name: string
  email: string | null
  avatar_url: string | null
  is_active: boolean
  is_admin: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CleaningArea {
  id: string
  department_id: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CleaningTask {
  id: string
  area_id: string
  name: string
  description: string | null
  frequency: 'daily' | 'weekly' | 'monthly'
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  task_id: string
  member_id: string
  scheduled_date: string
  rotation_month: string
  created_at: string
  updated_at: string
}

export interface Completion {
  id: string
  schedule_id: string
  completed_by: string
  completed_at: string
  notes: string | null
}

// 結合された型（UI表示用）
export interface ScheduleWithDetails {
  id: string
  scheduled_date: string
  task: {
    id: string
    name: string
    color: string
    area: {
      id: string
      name: string
      department: {
        id: string
        name: string
        color: string
      }
    }
  }
  member: {
    id: string
    name: string
    avatar_url: string | null
  }
  completion: {
    id: string
    completed_at: string
    completed_by: string
  } | null
}

export interface UserWithDepartment extends User {
  department: Department
}
