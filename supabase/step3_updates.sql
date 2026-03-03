-- 3. 일일 진행 데이터 확장 (매일 저녁 식습관 평가 및 브리핑 요약)
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS daily_calories INTEGER;
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS diet_evaluation TEXT;
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2); -- 그날 측정한 체중

-- 4. 2주 플랜 기록 보관 (기존 workout_plans)
-- Workout plans 테이블에 2주 주기라는 명확한 속성과 해당 주기의 요약 브리핑 저장 컬럼 추가
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS biweekly_briefing TEXT; -- 2주 종료 시점 AI의 총평가
