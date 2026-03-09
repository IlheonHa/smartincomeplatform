-- ==========================================
-- Smart Insure Lab OS - Database Schema
-- ==========================================

-- 0) 권한 및 보안 설정 초기화 (Security & Permissions Reset)
-- 이 부분은 RLS로 인한 저장 오류를 해결하기 위해 모든 보안 정책을 비활성화합니다.
-- Supabase SQL Editor에서 실행 시 가장 먼저 처리됩니다.

DO $$ 
BEGIN
    -- 모든 테이블의 RLS 비활성화
    ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.leads DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.calendar_events DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.system_settings DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.dashboard_data DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.form_configs DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.landing_pages DISABLE ROW LEVEL SECURITY;

    -- 모든 테이블에 대한 권한 부여
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
END $$;

-- 1) 시스템관리 (System Settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    auto_approve_new_members BOOLEAN DEFAULT false,
    default_monthly_fee NUMERIC DEFAULT 100000,
    sync_dashboard_with_member_fees BOOLEAN DEFAULT true,
    maintenance_mode BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2) 회원관리 & 3) 설정 (Users & Personal Settings)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    login_id TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'PARTNER',
    grade TEXT DEFAULT 'SILVER',
    subscription_status TEXT DEFAULT 'TRIAL',
    monthly_fee NUMERIC DEFAULT 0,
    next_payment_date DATE,
    leads_count INTEGER DEFAULT 0,
    active_consultations_count INTEGER DEFAULT 0,
    content_gen_count INTEGER DEFAULT 0,
    insurance_design_count INTEGER DEFAULT 0,
    golden_system_count INTEGER DEFAULT 0,
    revenue_generated NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_active BOOLEAN DEFAULT false,
    api_keys JSONB DEFAULT '{}'::jsonb,
    solapi_config JSONB DEFAULT '{}'::jsonb,
    profile_image TEXT
);

-- 4) & 5) 일정관리 (Calendar Events)
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    time TEXT,
    content TEXT,
    location TEXT,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6) 가망고객 수집 (Form Configs & Landing Pages)
CREATE TABLE IF NOT EXISTS public.form_configs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB DEFAULT '[]'::jsonb,
    theme JSONB DEFAULT '{}'::jsonb,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.landing_pages (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}'::jsonb,
    form_id TEXT REFERENCES public.form_configs(id) ON DELETE SET NULL,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7) 가망고객관리 (Leads)
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'NEW',
    priority TEXT DEFAULT 'MEDIUM',
    source TEXT,
    notes TEXT,
    created_at DATE DEFAULT CURRENT_DATE,
    submitted_at TEXT,
    last_contact_date TEXT,
    next_follow_up_date TEXT,
    estimated_value NUMERIC DEFAULT 0,
    form_data JSONB DEFAULT '{}'::jsonb
);

-- 8) 대시보드 (Dashboard Data)
CREATE TABLE IF NOT EXISTS public.dashboard_data (
    id INTEGER PRIMARY KEY DEFAULT 1,
    stats JSONB DEFAULT '{}'::jsonb,
    chart_data JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Notifications (알림 관리)
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'INFO',
    title TEXT NOT NULL,
    message TEXT,
    target_user_id TEXT,
    target_user_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- Initial Data Seeding
-- ==========================================

-- Initial Data for System Settings
INSERT INTO public.system_settings (id, auto_approve_new_members, default_monthly_fee, sync_dashboard_with_member_fees, maintenance_mode)
VALUES (1, false, 100000, true, false)
ON CONFLICT (id) DO NOTHING;

-- Initial Data for Dashboard
INSERT INTO public.dashboard_data (id, stats, chart_data)
VALUES (1, '{
  "contentGenCount": "1,284",
  "insuranceDesignCount": "856",
  "goldenSystemCount": "432",
  "totalLeads": "2,450",
  "activeConsultations": "158",
  "contentGenTrend": "+12%",
  "insuranceDesignTrend": "+8%",
  "goldenSystemTrend": "+15%",
  "totalLeadsTrend": "+24%",
  "activeConsultationsTrend": "+5%"
}', '[
  {"name": "1월", "leads": 400, "revenue": 2400},
  {"name": "2월", "leads": 300, "revenue": 1398},
  {"name": "3월", "leads": 200, "revenue": 9800},
  {"name": "4월", "leads": 278, "revenue": 3908},
  {"name": "5월", "leads": 189, "revenue": 4800},
  {"name": "6월", "leads": 239, "revenue": 3800},
  {"name": "7월", "leads": 349, "revenue": 4300}
]')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- Final Security Check (마지막 보안 확인)
-- ==========================================

-- 모든 테이블의 RLS를 다시 한번 확실히 비활성화합니다.
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dashboard_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.form_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.landing_pages DISABLE ROW LEVEL SECURITY;

-- 모든 정책 삭제 (혹시 남아있을 수 있는 정책 제거)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.users;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.users;

-- 권한 재확인
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
