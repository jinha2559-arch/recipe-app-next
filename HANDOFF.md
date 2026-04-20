# 냉장고 레시피 앱 Next.js 버전 — 핸드오프 문서

## 앱 주소

| 구분 | URL |
|---|---|
| **신버전 (메인)** | https://recipe-app-next-xi.vercel.app |
| 구버전 (Streamlit) | https://recipe-app-c3eo8batqztropwmwjkqzu.streamlit.app |

## 깃허브

- 신버전: https://github.com/jinha2559-arch/recipe-app-next
- 구버전: https://github.com/jinha2559-arch/recipe-app

## 로컬 경로

- 신버전: C:\Users\박진하\Desktop\recipe-app-next
- 구버전: C:\Users\박진하\Desktop\recipe-app

---

## ⚠️ 남은 작업 (딱 1개)

Supabase SQL Editor에서 아래 실행 필요:

👉 https://supabase.com/dashboard/project/gqnyjsrjtpfgxcujukiv/sql/new

```sql
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS device_id TEXT;
CREATE INDEX IF NOT EXISTS idx_recipes_device_id ON recipes(device_id);
```

이것만 하면 레시피 저장/조회가 완전히 동작함.

---

## 기술 스택

- Next.js 14.2.30 + TypeScript + Tailwind CSS
- 배포: Vercel (항상 켜짐, 잠자기 없음)
- DB: Supabase (기존 프로젝트 그대로 사용)
- AI: OpenAI gpt-4o-mini

## Vercel 환경변수 (등록 완료)

- OPENAI_API_KEY ✅
- NEXT_PUBLIC_SUPABASE_URL ✅
- NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
- SUPABASE_SERVICE_KEY ✅

## Supabase 정보

- 프로젝트 URL: https://gqnyjsrjtpfgxcujukiv.supabase.co
- 테이블명: recipes
- 컬럼: id, title, content, device_id, created_at
- RLS: 비활성화 상태

## 파일 구조

```
recipe-app-next/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← 메인 페이지
│   ├── globals.css           ← 전역 스타일
│   └── api/
│       ├── analyze/route.ts  ← OpenAI 이미지 분석
│       ├── recipes/route.ts  ← 레시피 저장/조회
│       └── recipes/[id]/route.ts  ← 레시피 삭제
├── components/
│   ├── Hero.tsx
│   ├── PhotoButtons.tsx
│   ├── RecipeResult.tsx
│   └── SavedRecipes.tsx
└── lib/
    └── deviceId.ts           ← 기기별 개인화 (로그인 없이)
```

## 개인화 방식

로그인 없이 기기별 UUID를 localStorage에 저장 → 내 기기에서 저장한 레시피만 보임

## 구현된 기능

- 카메라 1클릭 실행 (capture=environment)
- 갤러리 사진 업로드
- AI 재료 인식 + 레시피 추천 (gpt-4o-mini)
- 레시피 저장 (중복 방지)
- 저장된 레시피 목록 (날짜순, 기기별)
- 레시피 삭제 (2단계 확인)
- 로딩 애니메이션, 에러 처리, 빈 상태 화면
- 10MB 용량 제한, 30초 AI 타임아웃
- 모바일 우선 반응형 디자인

## 다음 단계 아이디어

- 레시피 검색 기능
- 재료 즐겨찾기
- 카카오/인스타 공유 기능
