-- =============================================
-- Supabase 마이그레이션 SQL
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- =============================================

-- 1. 기존 recipes 테이블에 device_id 컬럼 추가 (개인화용)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS device_id TEXT;

-- 2. device_id 인덱스 추가 (검색 속도 향상)
CREATE INDEX IF NOT EXISTS idx_recipes_device_id ON recipes(device_id);

-- 3. RLS 비활성화 유지 확인
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;

-- 확인용 쿼리 (실행 후 device_id 컬럼이 보이면 성공)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'recipes';
