-- ============================================
-- 掃除当番管理アプリ - データベーススキーマ
-- ============================================
-- このSQLをSupabase SQL Editorで実行してください

-- 1. departments（部署）テーブル
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. users（ユーザー）テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- 3. cleaning_areas（掃除エリア）テーブル
CREATE TABLE cleaning_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cleaning_areas_department_id ON cleaning_areas(department_id);

-- 4. cleaning_tasks（掃除タスク）テーブル
CREATE TABLE cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES cleaning_areas(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  frequency VARCHAR(20) DEFAULT 'daily',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cleaning_tasks_area_id ON cleaning_tasks(area_id);
CREATE INDEX idx_cleaning_tasks_is_active ON cleaning_tasks(is_active);

-- 5. schedules（スケジュール）テーブル
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES cleaning_tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  rotation_month VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, scheduled_date)
);

CREATE INDEX idx_schedules_task_id ON schedules(task_id);
CREATE INDEX idx_schedules_member_id ON schedules(member_id);
CREATE INDEX idx_schedules_scheduled_date ON schedules(scheduled_date);
CREATE INDEX idx_schedules_rotation_month ON schedules(rotation_month);

-- 6. completions（完了記録）テーブル
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(schedule_id)
);

CREATE INDEX idx_completions_schedule_id ON completions(schedule_id);
CREATE INDEX idx_completions_completed_by ON completions(completed_by);

-- ============================================
-- RLS (Row Level Security) 設定
-- ============================================

-- RLSを有効化
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数: 現在のユーザーIDを取得
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ヘルパー関数: 管理者かどうかを確認
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM users
    WHERE user_id = auth.uid() AND is_admin = true AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- departments: 認証済みユーザーは読み取り可、管理者のみ書き込み可
CREATE POLICY "departments_select" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_insert" ON departments FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "departments_update" ON departments FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "departments_delete" ON departments FOR DELETE TO authenticated USING (is_admin());

-- users: 認証済みユーザーは読み取り可、管理者のみ書き込み可
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "users_delete" ON users FOR DELETE TO authenticated USING (is_admin());

-- cleaning_areas: 認証済みユーザーは読み取り可、管理者のみ書き込み可
CREATE POLICY "cleaning_areas_select" ON cleaning_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "cleaning_areas_insert" ON cleaning_areas FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "cleaning_areas_update" ON cleaning_areas FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "cleaning_areas_delete" ON cleaning_areas FOR DELETE TO authenticated USING (is_admin());

-- cleaning_tasks: 認証済みユーザーは読み取り可、管理者のみ書き込み可
CREATE POLICY "cleaning_tasks_select" ON cleaning_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "cleaning_tasks_insert" ON cleaning_tasks FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "cleaning_tasks_update" ON cleaning_tasks FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "cleaning_tasks_delete" ON cleaning_tasks FOR DELETE TO authenticated USING (is_admin());

-- schedules: 認証済みユーザーは読み取り可、管理者のみ書き込み可
CREATE POLICY "schedules_select" ON schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "schedules_insert" ON schedules FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "schedules_update" ON schedules FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "schedules_delete" ON schedules FOR DELETE TO authenticated USING (is_admin());

-- completions: 認証済みユーザーは読み取り可、自分の担当タスクのみ完了マーク可
CREATE POLICY "completions_select" ON completions FOR SELECT TO authenticated USING (true);
CREATE POLICY "completions_insert" ON completions FOR INSERT TO authenticated
  WITH CHECK (
    completed_by = get_current_user_id()
    AND EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id AND s.member_id = get_current_user_id()
    )
  );
CREATE POLICY "completions_delete" ON completions FOR DELETE TO authenticated
  USING (completed_by = get_current_user_id() OR is_admin());

-- ============================================
-- スケジュール生成関数
-- ============================================

CREATE OR REPLACE FUNCTION generate_monthly_schedule(
  p_year INTEGER,
  p_month INTEGER
)
RETURNS void AS $$
DECLARE
  v_rotation_month VARCHAR(7);
  v_start_date DATE;
  v_end_date DATE;
  v_current_date DATE;
  v_task RECORD;
  v_member_ids UUID[];
  v_member_count INTEGER;
  v_day_index INTEGER;
BEGIN
  v_rotation_month := p_year || '-' || LPAD(p_month::TEXT, 2, '0');
  v_start_date := MAKE_DATE(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  DELETE FROM schedules WHERE rotation_month = v_rotation_month;

  FOR v_task IN
    SELECT
      ct.id AS task_id,
      ct.frequency,
      ca.department_id
    FROM cleaning_tasks ct
    JOIN cleaning_areas ca ON ct.area_id = ca.id
    WHERE ct.is_active = true
  LOOP
    SELECT ARRAY_AGG(id ORDER BY created_at)
    INTO v_member_ids
    FROM users
    WHERE department_id = v_task.department_id AND is_active = true;

    v_member_count := COALESCE(array_length(v_member_ids, 1), 0);

    IF v_member_count > 0 THEN
      v_day_index := 0;
      v_current_date := v_start_date;

      WHILE v_current_date <= v_end_date LOOP
        IF v_task.frequency = 'daily'
           OR (v_task.frequency = 'weekly' AND EXTRACT(DOW FROM v_current_date) = 1)
           OR (v_task.frequency = 'monthly' AND EXTRACT(DAY FROM v_current_date) = 1)
        THEN
          INSERT INTO schedules (task_id, member_id, scheduled_date, rotation_month)
          VALUES (
            v_task.task_id,
            v_member_ids[(v_day_index % v_member_count) + 1],
            v_current_date,
            v_rotation_month
          )
          ON CONFLICT (task_id, scheduled_date) DO UPDATE
          SET member_id = EXCLUDED.member_id, updated_at = NOW();

          v_day_index := v_day_index + 1;
        END IF;

        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
