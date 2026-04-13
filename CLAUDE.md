# AI 롤플레이 직무 시뮬레이터

## 프로젝트 개요
교육 수강생이 AI와 실전 대화 연습을 하고,
세션 종료 후 AI가 자동으로 피드백 리포트를 생성하는 웹앱.
하이바이브 코딩 공모전 (KIT) 제출용 MVP.

## 기술 스택
- Next.js 14 (App Router)
- Tailwind CSS
- Claude API (claude-sonnet-4-20250514)
- Supabase (대화 세션 저장)
- Vercel (배포)

## 파일 구조
app/
  page.tsx              # 시나리오 선택
  roleplay/page.tsx     # 채팅 롤플레이
  feedback/page.tsx     # 피드백 리포트
  dashboard/page.tsx    # 교강사 대시보드
  api/
    chat/route.ts       # Claude 롤플레이 API
    feedback/route.ts   # 피드백 생성 API
lib/
  prompts.ts            # 시스템 프롬프트 모음

## 핵심 설계 원칙
- Claude API는 반드시 서버사이드 API Routes에서만 호출 (클라이언트 노출 금지)
- 시스템 프롬프트로 Claude 페르소나 고정 (카테고리/난이도별 분기)
- 세션 단위로 대화 Supabase에 저장
- 피드백은 JSON 형식으로만 응답받아 파싱

## 환경 변수
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

## 구현 순위
1. 시나리오 선택 페이지 (카테고리 + 난이도)
2. 롤플레이 채팅 UI + Claude API 연동
3. 세션 저장 + 피드백 생성 로직
4. 교강사 대시보드
5. Vercel 배포

## 현재 작업 상태
- [ ] 프로젝트 초기 세팅
- [ ] 시나리오 선택 페이지
- [ ] 채팅 UI
- [ ] 피드백 페이지
- [ ] 대시보드
- [ ] 배포