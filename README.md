# FlashDo

**무거운 목표는 가슴에 품고, 가벼운 행동만 익명으로 증명하자**

압박 없는 목표 달성을 위한 휘발성 인증 SNS

## 프로젝트 소개

FlashDo는 사용자가 목표를 설정하고 일상적인 루틴을 통해 달성해 나가는 과정을 돕는 앱입니다.
기록에 대한 압박 없이, 오늘의 실행에만 집중할 수 있도록 설계되었습니다.

### 핵심 특징

- **초심플 목표 설정**: 목표명과 기간만으로 빠르게 시작
- **오늘의 루틴 집중**: 오늘 해야 할 루틴만 표시
- **휘발성 인증**: 12-24시간 후 자동 삭제되는 인증 스토리
- **블라인드 상호작용**: 내가 인증해야 다른 사람의 인증을 볼 수 있음
- **기록 카드**: 목표 종료 시 자동 생성되는 요약 카드만 영구 보관

### 디자인 참고

- **토스 (Toss)**: 심플하고 명확한 UI, 높은 대비와 여백 활용
- **비리얼 (BeReal)**: 카메라 중심의 빠른 접근, 휘발성 콘텐츠
- **데이들리오 (Daylio)**: 미니멀한 데이터 시각화

## 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Lucide React** - 아이콘
- **Supabase** - 백엔드 (Auth, Database, Storage)
- **Vercel** - 배포 플랫폼

## 시작하기

### 필수 요구사항

- Node.js 20 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 Supabase 프로젝트 정보 입력

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### Supabase 설정

#### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 회원가입 및 프로젝트 생성
2. Project Settings > API에서 URL과 anon key 확인
3. `.env` 파일에 정보 입력:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 2. 데이터베이스 설정

Supabase Dashboard > SQL Editor에서 `supabase/schema.sql` 파일 실행

주요 테이블:
- `profiles`: 사용자 프로필 (닉네임)
- `goals`: 목표 정보
- `routines`: 루틴 정보
- `verifications`: 인증 기록 (12시간 후 자동 삭제)

#### 3. 소셜 로그인 설정

Authentication > Providers에서 설정:
- **Google**: OAuth 앱 생성 및 Client ID/Secret 입력
- **Kakao**: Kakao Developers에서 앱 생성 후 설정
- **Apple**: Apple Developer에서 설정

Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

#### 4. Storage 설정

SQL 스키마 실행 시 자동 생성되지만, 수동 확인:
- Storage > `verifications` 버킷 확인
- Public 설정 확인

## 프로젝트 구조

```
flashdo/
├── src/
│   ├── components/
│   │   ├── NewOnboarding.tsx  # 4단계 소셜 로그인 온보딩
│   │   ├── Onboarding.tsx     # 루틴 설정
│   │   ├── Home.tsx           # 홈 화면 (오늘의 루틴)
│   │   ├── Camera.tsx         # 미디어 업로드 (이미지/동영상)
│   │   ├── DevMenu.tsx        # 개발자 메뉴
│   │   ├── Feed.tsx           # 소셜 피드
│   │   ├── Calendar.tsx       # 캘린더 및 기록
│   │   └── RecordCard.tsx     # 기록 카드
│   ├── lib/
│   │   └── supabase.ts        # Supabase 클라이언트
│   ├── utils/
│   │   ├── upload.ts          # 미디어 업로드 함수
│   │   └── storage.ts         # 로컬 스토리지
│   ├── context/
│   │   └── AppContext.tsx     # 글로벌 상태 관리
│   ├── types.ts               # TypeScript 타입
│   ├── App.tsx                # 메인 앱 컴포넌트
│   └── main.tsx               # 진입점
├── supabase/
│   └── schema.sql             # DB 스키마
├── .env.example               # 환경 변수 예시
├── vercel.json                # Vercel 배포 설정
└── README.md
```

## 주요 기능

### 1. 회원가입 온보딩 (4단계)
1. **목표 입력**: 목표 이름, 도전 기간 (7/21/30일 또는 직접 입력)
2. **소셜 로그인**: Kakao, Google, Apple 로그인
3. **닉네임 설정**: 자동 생성 ("갓생러-XXXX") 또는 직접 입력
4. **루틴 생성** (기존 온보딩)
   - 루틴 이름
   - 시간대 (아침/오후/저녁)
   - 요일 선택 (최대 3개)

### 2. 홈 화면
- 현재 목표 진행 상황 표시
- 오늘의 루틴 목록
- 시간대별 루틴 필터링
- 인증 버튼 (고대비 컬러)
- 개발자 메뉴 (개발 환경에서만 표시)

### 3. 인증
- 이미지/동영상 업로드 (최대 50MB)
  - 지원 형식: JPG, PNG, GIF, WebP, MP4, MOV, WebM
- 선택적 텍스트 입력 (최대 100자)
- Supabase Storage에 자동 업로드
- 12시간 후 자동 삭제

### 4. 피드
- 블라인드 피드 (인증 전에는 블러 처리)
- 인증 후 다른 사람들의 스토리 확인
- 제한된 이모지 반응 (🔥, ⚡, ❤️)
- 12시간 후 자동 삭제 표시

### 5. 기록
- 현재 목표 통계 (완료율, 연속 일수, 달성 일수)
- 월별 캘린더 뷰
- 과거 목표 기록 목록

### 6. 기록 카드
- 목표 요약 정보
- 주간 진행도 차트
- 달성 뱃지

### 7. 개발자 메뉴 (개발 환경 전용)

**위치**: 홈 화면 오른쪽 상단 톱니바퀴 아이콘

**데이터 관리**:
- 내 데이터 초기화: 목표, 루틴, 인증 삭제 (계정 유지)
- 로그아웃
- 계정 완전 삭제
- 전체 DB 초기화 (모든 테스트 데이터)

**시간 조작**:
- 현재 시간 오버라이드 (특정 시간 설정)
- +1시간 / -1시간 이동
- 시간 리셋 (실제 시간 복귀)

**테스트 시나리오**:
- 온보딩 다시 보기

## Vercel 배포

### 1. Vercel 프로젝트 연결

```bash
# Vercel CLI 설치 (선택)
npm i -g vercel

# 배포
vercel
```

또는 [Vercel Dashboard](https://vercel.com)에서:
1. New Project
2. GitHub 저장소 연결
3. Framework Preset: Vite
4. Environment Variables 추가

### 2. 환경 변수 설정

Vercel Dashboard > Settings > Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. 자동 배포

- `main` 브랜치에 push → 자동 배포
- PR 생성 → Preview 배포

## MVP 목표

이 프로젝트는 다음 MVP 요구사항을 충족합니다:

- ✅ 초고속 목표 생성
- ✅ 빠르고 간결한 목표 설정
- ✅ 루틴 생성 및 관리
- ✅ 행동 유도 극대화 (홈 화면)
- ✅ 휘발성 인증 스토리
- ✅ 익명성 기반 동기 부여
- ✅ 영구적인 결과만 보관
- ✅ 소셜 로그인 (Kakao, Google, Apple)
- ✅ 이미지/동영상 업로드
- ✅ 개발자 도구

## 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 참고 문서

- [디자인 참고 문서](./docs/design_refference_1.txt)
- [Figma 디자인](./docs/figma_design_1/)
