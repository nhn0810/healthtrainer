-- 1. 프로필 테이블에 사용자 메모리(목적, 버킷 리스트, 부상 이력 등) 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exercise_purpose TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS body_target TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS injury_history TEXT;

-- 2. 운동 사전(딕셔너리) 테이블 개설 (AI가 긁어온 운동 방법 링크나 팁을 영구 보관)
CREATE TABLE IF NOT EXISTS exercise_dictionary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- "데드버그", "플랭크" 등 고유 이름
    description TEXT, -- 운동 설명 또는 요약
    reference_link TEXT, -- 유튜브나 구글 검색 링크
    type TEXT DEFAULT 'reps', -- 'reps' (횟수) 또는 'time' (시간)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 권한 설정: 읽기는 누구나, 생성은 인증 유저 누구나 가능 (위키 백과 방식)
ALTER TABLE exercise_dictionary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON exercise_dictionary FOR SELECT USING (true);
CREATE POLICY "Auth Insert Access" ON exercise_dictionary FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Access" ON exercise_dictionary FOR UPDATE USING (auth.role() = 'authenticated');
