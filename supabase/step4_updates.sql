-- 사용자 프로필 테이블에 최종 목표 달성일 (target_date) 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_date DATE;
