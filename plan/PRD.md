# AI Edge Coach - PRD

## 1. 프로젝트 개요
목표: 제미나이 API를 두뇌로 활용하여, 사용자의 신체 상태, 환경, 장비에 맞춘 초개인화된 운동 및 식단 관리를 제공하는 PWA 앱 개발.
핵심 가치: "나보다 나를 더 잘 아는 AI 트레이너".
주요 타겟: 전문 지식 없이 맨몸 운동과 식단 관리를 통해 체중 감량 및 근력을 키우려는 개인 사용자.

## 2. 기술 스택 (Tech Stack)
- Frontend: Next.js 14+ (App Router), Tailwind CSS, Framer Motion (애니메이션), Lucide React (아이콘).
- Backend/BaaS: Supabase (Auth, Database, Storage).
- AI Engine: 
  - Gemini 3 Flash (Vision): 실시간 식단 분석, 실시간 채팅 응답, 운동 세트 가이드.
  - Gemini 3.1 Pro: 주간/월간 리포트 생성, 중장기 운동 및 식단 플랜 수립.
- Deployment: Vercel (PWA 지원).

## 3. 상세 기능 요구 사항
### 3.1. 온보딩 및 초기 설정
- 질문 리스트: 키, 현재 체중, 목표 체중, 운동 환경, 보유 장비, 목표 기간 선택.
- AI 플랜 수립: 온보딩 데이터를 Gemini 3.1 Pro에 전달하여 1차 가이드라인 생성 후 DB 저장.

### 3.2. 삼성 엣지 스타일 UI/UX
- 사이드바 메뉴: 우측 끝 핸들을 왼쪽으로 스와이프 시 노출.
- 테마: 블랙 & 화이트 모드 전환 기능 (CSS Variables 기반).
- PWA 특화: '홈 화면 추가' 유도 버튼 활성화. 독립 실행 모드 강제.

### 3.3. 매일매일 운동 리포트 & 수행
- 메인 배너: 진척도를 원형 퍼센트 그래프 표시.
- 진행 관리: 세트별 '완료' 버튼 등. 야외 활동 포함.

### 3.4. 식단 기록 및 피드백
- 멀티모달 기록: 사진 업로드 시 Gemini Flash가 영양소 자동 계산.
- 데일리 리포트: 저녁 9시 하루 총평 제공.

### 3.5. 내 몸 변화 기록
- 비밀 갤러리: '내 몸 보기' 버튼 클릭 시에만 노출.
- 예상 달성일: 실시간 업데이트.

### 3.6. AI 트레이너 상담
- 채팅 인터페이스: 실시간 상담 및 플랜 수정.

## 4. 데이터베이스 스키마
- profiles, weight_logs, food_logs, workout_plans, daily_progress.

## 5. 보안 및 성능
- 이미지 최적화: `browser-image-compression`. 500KB 이하 WebP 변환.
- 보안: Supabase RLS, Vercel 환경 변수 등 API Route를 통한 호출.
