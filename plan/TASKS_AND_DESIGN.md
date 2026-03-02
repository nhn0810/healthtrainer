# AI Edge Coach - 상세 개발 및 디자인 태스크 로드맵

이 문서는 PRD를 바탕으로 논리적인 개발 순서와 기술적 제약을 덜어주는 안정적인 개발 흐름을 유지하기 위한 태스크 모음입니다.

## 🎨 디자인 시스템 및 에셋 가이드 (Design System)

**핵심 가치**: 프리미엄(Premium), 초개인화(Hyper-Personalized), 방해 없는(Distraction-Free) 몰입

### 1. Color Palette (색상 기준)
PWA 특성상 OLED 화면 배터리 절약 및 프라이버시 효과를 위해 다크 모드를 기본권장(또는 손쉬운 전환)으로 디자인합니다.
- **Background**: 라이트 모드(`white` 또는 `#F9FAFB`), 다크 모드(`black` 또는 `#0A0A0A`)
- **Foregound (Text)**: 텍스트 대비 향상 (`#171717` ↔ `#EDEDED`)
- **Primary / 포인트 컬러**: 생동감 넘치고 하드코어한 동기부여를 위한 액센트 컬러 (예: 일렉트릭 블루 `#007BFF`, 네온 그린 `#39FF14`, 또는 번트 오렌지 `#FF5F1F`)를 원형 그래프, 중요 완료 버튼 등에 사용.
- **Surface / Cards**: 다크 모드 시 완전한 블랙 위에 살짝 떠 있는 그레이톤(`rgba(255,255,255, 0.05)`)의 **Glassmorphism**을 옅게 가미.

### 2. Typography (타이포그래피)
- **Family**: `Inter` (영문) / `Pretendard` 또는 `Noto Sans KR` (국문) 조합 (Google Fonts / next/font).
- **Style**: 모던하고 각진 Sans-Serif 형태. 두께 변화(Bold vs Regular)로만 시각 위계를 설정해 정보량을 덜어냅니다.

### 3. Motion & UX (Framer Motion)
앱과 동일한 네이티브 경험(Native-like Experience)에 초점을 맞춥니다.
- **Edge Sidebar**: 우측 스와이프 제스처 핸들링. 당길 때 화면 전체가 옅게 딤(Dim) 처리되고 스프링 탄성으로 메뉴가 돌출.
- **비밀 갤러리**: 눈바디 사진 노출은 기본 `CSS Blur` 필터 적용. 사용자가 '내 몸 보기' 버튼을 길게 누르거나 특정 스와이프 시 위에서 아래로(Slide-down) 명확해지는 애니메이션 구성.
- **피드백 인터랙션**: 세트 완료 체크 시 잔잔한 진동(Web Vibrate API 접근 시)과 함께 화면 내 가벼운 파티클 애니메이션 또는 Scale 튀어오름 효과.

---

## 📋 논리적 개발 태스크 순서 (Development Sequence)

의존성(Authentication ➔ Database ➔ UI 기초 ➔ AI 로직 ➔ 고도화)에 맞춘 순차적 리스트입니다.

### Phase 1: 기반 아키텍처 및 PWA 테마 초기화
1. [x] Next.js App Router 기초 폴더 셋업 (완료)
2. [x] Tailwind CSS 테마 및 pwa config 수립 (완료)
3. [ ] `app/globals.css` 에 Black/White CSS 변수(var) 완벽 적용.
4. [ ] `lucide-react`, `framer-motion` 패키지 설치 및 UI 유틸리티(`cn` 함수 등) 최적화.
5. [ ] **Edge Sidebar (삼성 엣지 스타일)** 제스처 및 레이아웃 구조체 구축.
6. [ ] PWA Manifest 최적화, 메타태그 설정 (단독 실행 모드 아이콘, 스플래시 화면 지정).

### Phase 2: Supabase (Auth & DB) 스키마 연결
1. [ ] Supabase 프로젝트 생성 후 데이터베이스 스키마(표 5개) 작성. (-> `profiles`, `weight_logs`, `food_logs`, `workout_plans`, `daily_progress`)
2. [ ] RLS(Row Level Security) 설정 및 사용자 전용 정책 셋업.
3. [ ] `@supabase/ssr` 를 활용한 SSR 기반 로그인/회원가입/로그아웃 페이지 개발. (Phase 1의 UI 적용)

### Phase 3: 온보딩 및 Gemini API 플랜 생성 (핵심 기능)
1. [ ] 신규 가입 사용자를 위한 다단계 온보딩 뷰(Step-by-step) 개발. (키, 체중, 감량목표, 장비, 환경)
2. [ ] Vercel 환경변수에 `GEMINI_API_KEY` 탑재 및 Next.js SSR 환경에서 API 호출 인프라 구축.
3. [ ] 수집된 온보딩 데이터를 JSON/프롬프트 화 하여 Gemini (Pro) 에게 전달.
4. [ ] 응답으로 수령한 '1차 운동 및 식단 가이드라인' 파싱 후 Supabase에 영속성 저장 로직.

### Phase 4: 대시보드 및 일일 운동 수행 모드 구현
1. [ ] 진입 팝업 모달 생명주기 제어 (최초 접속 시 '어제/오늘 완료 여부' 확인).
2. [ ] 대시보드 상단에 위치할 SVG 활용 **원형 퍼센트 (Progress Circle)** 컴포넌트 프레이머 모션 적용.
3. [ ] API로 저장한 `workout_plans` 데이터를 기반으로 "오늘의 할일 운동 리스트" 렌더링.
4. [ ] 세트/종목별 '완료' 처리를 위한 토글 버튼과 낙관적 업데이트(Optimistic Update) 적용. (`daily_progress` 업데이트)

### Phase 5: 멀티모달 식단 기록소 (Gemini Flash Vision)
1. [ ] 카메라 접근 및 파일 업로드 UI 생성 (접근 권한 획득).
2. [ ] 사진 업로드 직전 클라이언트 사이드 변환 (`browser-image-compression` 활용 WebP / <500KB 압축).
3. [ ] Supabase Storage 업로드 로직 작성 (저장된 URL 추출).
4. [ ] Gemini Flash 모델을 호출해 해당 이미지의 영양소 분해 및 자동 DB화 로직 작성.

### Phase 6: 내 몸 변화 & 비밀 갤러리 
1. [ ] `recharts` 혹은 `chart.js`를 이용한 체중 변화 시계열 그래프 UI 적용.
2. [ ] Supabase의 `weight_logs` 를 바탕으로 "예상 달성일" 알고리즘 실시간 업데이트 연산 함수.
3. [ ] 비밀 갤러리 뷰 구현: 프라이버시 우선 모드로써, 상단 버튼 토글 시에만 DOM에 이미지가 노출되도록 생명주기 제어.

### Phase 7: 실시간 채팅 상담소 (AI Chat)
1. [ ] 프론트엔드 채팅 레이아웃 뷰 구성 (본인 말풍선 우측, AI 트레이너 좌측).
2. [ ] Vercel AI SDK (또는 자체 Fetch 스트리밍)을 이용해 Gemini와 실시간 텍스트 상담 구축.
3. [ ] 사용자 히스토리 프롬프트를 컨텍스트에 담아서, 부상 및 상황 변경에 따른 '기존 플랜 업데이트 요청 파이프라인' 구성.

### Phase 8: 리포트 자동화 기능 및 QA
1. [ ] "저녁 9시 기준" 등 정해진 트리거 또는 매뉴얼로 하루를 총평하는 리포트 생성 로직 점검 (Serverless Function 활용 고민).
2. [ ] Auth/기능 종속 모듈 에러 수정.
3. [ ] 라이트하우스(Lighthouse) 모바일 기준 PWA 평가 지표 PWA 체크 및 UI 인터랙션 프레임 드랍 최적화.
