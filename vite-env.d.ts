/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // 필요한 다른 환경 변수들을 여기에 추가하세요
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
