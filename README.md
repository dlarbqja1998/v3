# 골라바유 v3

고려대 세종 학생을 위한 네이버 지도 기반 로컬 생활 플랫폼입니다. v3는 기존 v2 운영 코드와 분리된 새 SvelteKit 앱으로 시작합니다.

## 현재 상태

- SvelteKit + TypeScript 최소 앱 생성
- 모바일 우선 지도 홈 화면 초안 구현
- `places`, `zones`, `categories`, `cafeteria`, `shuttle` seed 데이터 구성
- 지도 제공자 타입 경계와 `NaverMapProvider` 자리 마련
- PostHog 핵심 이벤트 이름 정리
- API route 초안 구성

## 개발 실행

```sh
npm run dev
```

## 확인 명령

```sh
npm run check
npm run build
```

## 운영 리소스 연결 전제

사용자가 새 Cloudflare 프로젝트와 새 Neon 프로젝트를 만든 뒤, 다음 단계에서 실제 환경변수와 Drizzle 스키마를 연결합니다.

값 자체는 문서에 적지 않고, `.env.example`에는 키 이름과 설명만 둡니다.
