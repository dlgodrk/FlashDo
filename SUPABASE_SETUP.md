# Supabase 설정 가이드

## 문제 해결: Vercel 배포 후 Google 로그인 시 localhost로 리다이렉트되는 문제

Vercel에 배포된 앱에서 Google 로그인 시 `localhost:3000`으로 리다이렉트되어 "사이트에 연결할 수 없음" 에러가 발생하는 경우, Supabase Dashboard에서 Redirect URL을 추가해야 합니다.

---

## 1. Supabase Dashboard 로그인

1. https://supabase.com 접속
2. 로그인 후 FlashDo 프로젝트 선택

---

## 2. Redirect URLs 설정

### 2-1. Authentication > URL Configuration 메뉴로 이동

1. 왼쪽 사이드바에서 **Authentication** 클릭
2. **URL Configuration** 탭 클릭

### 2-2. Redirect URLs 추가

**Redirect URLs** 섹션에 다음 URL들을 추가하세요:

```
http://localhost:3000/auth/callback
https://your-vercel-domain.vercel.app/auth/callback
```

**중요**: `your-vercel-domain`을 실제 Vercel 도메인으로 교체하세요!

#### 예시:
```
http://localhost:3000/auth/callback
https://flashdo.vercel.app/auth/callback
https://flashdo-git-main-yourname.vercel.app/auth/callback
```

### 2-3. Site URL 설정

**Site URL** 섹션에 프로덕션 도메인을 설정하세요:

```
https://your-vercel-domain.vercel.app
```

### 2-4. 저장

**Save** 버튼 클릭하여 변경사항 저장

---

## 3. Google OAuth 설정 확인

### 3-1. Google Provider 활성화

1. **Authentication > Providers** 메뉴로 이동
2. **Google** 찾기
3. **Enabled** 토글 켜기

### 3-2. Google OAuth Credentials 설정

Google Cloud Console에서 발급받은 클라이언트 ID와 시크릿을 입력하세요.

만약 아직 발급받지 않았다면:

1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services > Credentials** 메뉴로 이동
4. **Create Credentials > OAuth 2.0 Client ID** 클릭
5. Application type: **Web application**
6. **Authorized redirect URIs** 추가:
   ```
   https://lmbgwwubescgmpxzilie.supabase.co/auth/v1/callback
   ```
7. Client ID와 Client Secret을 복사하여 Supabase에 입력

---

## 4. 데이터베이스 스키마 실행

### 4-1. SQL Editor로 이동

1. 왼쪽 사이드바에서 **SQL Editor** 클릭

### 4-2. 스키마 실행

1. **+ New query** 클릭
2. `supabase/schema.sql` 파일 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭하여 실행

### 4-3. 실행 확인

에러 없이 실행되었는지 확인:
- **Table Editor**에서 `profiles`, `goals`, `routines`, `verifications` 테이블이 생성되었는지 확인
- **Storage**에서 `verifications` 버킷이 생성되었는지 확인

---

## 5. Vercel 환경 변수 설정

### 5-1. Vercel Dashboard 로그인

1. https://vercel.com 접속
2. FlashDo 프로젝트 선택

### 5-2. 환경 변수 추가

1. **Settings > Environment Variables** 메뉴로 이동
2. 다음 변수들을 추가:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://lmbgwwubescgmpxzilie.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (전체 키) |

**중요**: Environment는 **Production, Preview, Development** 모두 선택하세요!

### 5-3. 재배포

1. **Deployments** 탭으로 이동
2. 최신 배포를 찾아서 **Redeploy** 클릭
3. 또는 Git에 커밋 & 푸시하여 자동 배포 트리거

---

## 6. 테스트

### 6-1. Vercel 배포 URL 접속

배포된 URL로 접속 (예: `https://your-app.vercel.app`)

### 6-2. 온보딩 플로우 테스트

1. 목표 입력
2. 루틴 추가
3. **"다음"** 버튼 클릭
4. **Google로 시작하기** 버튼 클릭
5. Google 계정 선택 및 로그인
6. ✅ **Vercel URL로 리다이렉트되는지 확인** (localhost가 아닌!)
7. 닉네임 설정
8. 홈 화면 진입 확인

### 6-3. 개발자 도구로 에러 확인

브라우저에서 **F12 > Console** 탭 열기
- 빨간색 에러 메시지가 있는지 확인
- 에러가 있으면 메시지를 복사하여 공유

---

## 자주 발생하는 문제

### 문제 1: "Invalid Redirect URL" 에러

**원인**: Supabase Redirect URLs에 해당 도메인이 등록되지 않음

**해결**:
1. Supabase Dashboard > Authentication > URL Configuration
2. Redirect URLs에 `https://your-vercel-domain.vercel.app/auth/callback` 추가

### 문제 2: "Missing Supabase environment variables" 에러

**원인**: Vercel 환경 변수가 설정되지 않음

**해결**:
1. Vercel Dashboard > Settings > Environment Variables
2. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가
3. 재배포

### 문제 3: 로그인 후 빈 화면

**원인**: 데이터베이스 테이블이 생성되지 않음

**해결**:
1. Supabase Dashboard > SQL Editor
2. `supabase/schema.sql` 실행

### 문제 4: "relation profiles does not exist" 에러

**원인**: 데이터베이스 스키마 미실행

**해결**:
1. Supabase Dashboard > SQL Editor
2. `supabase/schema.sql` 전체 실행
3. 에러가 있으면 하나씩 확인

---

## 체크리스트

배포 전 모든 항목을 확인하세요:

- [ ] Supabase에서 `supabase/schema.sql` 실행
- [ ] Supabase Authentication > URL Configuration에서 Redirect URLs 추가
- [ ] Supabase Authentication > Providers에서 Google 활성화
- [ ] Google Cloud Console에서 OAuth Credentials 발급 및 설정
- [ ] Vercel에서 환경 변수 설정 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Vercel 재배포
- [ ] 실제 배포 URL에서 전체 플로우 테스트

---

## 현재 Vercel 도메인 확인 방법

Vercel 도메인을 모르는 경우:

1. Vercel Dashboard 로그인
2. FlashDo 프로젝트 클릭
3. 상단에 표시된 **Domains** 확인
4. 기본 도메인: `https://프로젝트명.vercel.app`
5. 또는 **Visit** 버튼 클릭하여 URL 확인

---

**다음 단계**: 위 가이드를 따라 Supabase와 Vercel을 설정한 후, 실제 배포 URL에서 다시 테스트해보세요!
