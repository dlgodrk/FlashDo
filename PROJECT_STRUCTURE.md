# FlashDo 프로젝트 구조

FlashDo는 루틴 인증 기반 목표 달성 앱입니다. 사용자는 목표를 설정하고, 루틴을 만들어 매일 인증하며, 익명으로 다른 사용자들과 기록을 공유할 수 있습니다.

## 기술 스택

- **프론트엔드**: React 18 + TypeScript + Vite
- **스타일링**: Tailwind CSS
- **백엔드**: Supabase (PostgreSQL + Auth + Storage)
- **아이콘**: lucide-react

## 프로젝트 구조

```
FlashDo/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── Onboarding.tsx   # 메인 온보딩 플로우 (목표 → 루틴 → 로그인 → 닉네임)
│   │   ├── NewOnboarding.tsx # 대체 온보딩 플로우
│   │   ├── AuthCallback.tsx # OAuth 콜백 처리
│   │   ├── Home.tsx         # 홈 화면 (루틴 목록 및 인증)
│   │   ├── Camera.tsx       # 카메라 인증 화면
│   │   ├── Feed.tsx         # 피드 화면 (다른 사용자 기록)
│   │   ├── Calendar.tsx     # 캘린더 화면 (내 기록)
│   │   ├── RecordCard.tsx   # 개별 기록 상세 보기
│   │   └── DevMenu.tsx      # 개발자 메뉴
│   ├── context/
│   │   └── AppContext.tsx   # 전역 상태 관리 (goals, routines)
│   ├── lib/
│   │   └── supabase.ts      # Supabase 클라이언트 및 타입 정의
│   ├── utils/
│   │   ├── storage.ts       # localStorage 유틸리티
│   │   └── upload.ts        # 파일 업로드 유틸리티
│   ├── App.tsx              # 메인 앱 컴포넌트 (라우팅)
│   ├── main.tsx             # React 엔트리 포인트
│   ├── types.ts             # TypeScript 타입 정의
│   └── index.css            # 글로벌 CSS
├── supabase/
│   └── schema.sql           # 데이터베이스 스키마
├── .env                     # 환경 변수 (Supabase URL, API 키)
├── package.json             # 프로젝트 의존성
├── tsconfig.json            # TypeScript 설정
├── vite.config.ts           # Vite 설정
└── tailwind.config.js       # Tailwind CSS 설정
```

## 주요 기능

### 1. 온보딩 플로우 (Onboarding.tsx)

사용자가 처음 앱을 실행할 때 진행되는 단계:

1. **목표 설정 (step: 'goal')**
   - 목표 이름 입력
   - 도전 기간 선택 (7/14/30/60/90일)
   - 목표 공개/비공개 설정

2. **루틴 생성 (step: 'routines')**
   - 최대 3개 루틴 생성
   - 루틴 이름, 인증 시간(±1시간), 요일 선택
   - localStorage에 임시 저장

3. **소셜 로그인 (step: 'login')**
   - Google, Kakao, Apple 로그인
   - OAuth 인증 후 콜백 처리

4. **닉네임 설정 (step: 'nickname')**
   - 랜덤 닉네임 생성 또는 직접 입력
   - Supabase에 프로필, 목표, 루틴 저장
   - localStorage 임시 데이터 삭제

### 2. 홈 화면 (Home.tsx)

- 현재 목표 및 진행 상황 표시
- 루틴 목록 및 인증 버튼
- 하단 네비게이션 (홈/피드/기록)

### 3. 인증 (Camera.tsx)

- 카메라로 사진/동영상 촬영
- Supabase Storage에 업로드
- verifications 테이블에 기록 저장
- 24시간 후 자동 삭제 (expires_at)

### 4. 피드 (Feed.tsx)

- 다른 사용자들의 최근 인증 기록 표시
- 익명 공개 (프로필 사진 없음)

### 5. 캘린더 (Calendar.tsx)

- 내 인증 기록 캘린더 뷰
- 특정 날짜 클릭 시 상세 보기

## 데이터베이스 스키마

### profiles
- 사용자 프로필 (닉네임)

### goals
- 사용자 목표
- user_id, name, period_days, start_date, end_date, is_active

### routines
- 목표에 속한 루틴
- goal_id, user_id, name, auth_time_start, auth_time_end, frequency

### verifications
- 루틴 인증 기록
- routine_id, user_id, media_url, media_type, is_late, expires_at
- 24시간 후 자동 삭제

## 환경 변수 (.env)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase 설정

1. **SQL Editor에서 schema.sql 실행**
   - 테이블 생성
   - Row Level Security (RLS) 정책 설정
   - Storage bucket 생성

2. **Google OAuth 설정**
   - Supabase Dashboard > Authentication > Providers > Google
   - Redirect URL: `your_domain/auth/callback`

3. **Vercel 환경 변수 설정**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 주요 버그 수정 내역

### 온보딩 화면 "다음" 버튼 버그 (2025-12-01)

**문제**: 루틴 추가 후 "다음" 버튼을 눌러도 로그인 화면으로 넘어가지 않음

**원인**: `Onboarding.tsx`에서 `routines` 단계 렌더링 코드가 조건문 없이 바로 return되어, 그 아래의 `login`과 `nickname` 단계 코드가 실행되지 않음

**수정**: `routines` 단계를 `if (step === 'routines')` 조건문으로 감싸서 각 단계가 올바르게 렌더링되도록 수정

**수정 파일**: `src/components/Onboarding.tsx:328`

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 배포

- Vercel 자동 배포
- 환경 변수를 Vercel 대시보드에서 설정
- `main` 브랜치 푸시 시 자동 배포

## 보안 고려사항

- .env 파일은 git에 커밋되지 않음 (.gitignore)
- Supabase Row Level Security (RLS) 활성화
- OAuth 인증을 통한 안전한 로그인
- 인증 기록은 24시간 후 자동 삭제
