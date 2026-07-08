# 골라바유 v3 구현 계획

## 1단계: 로컬 앱 뼈대

- SvelteKit + TypeScript 앱 생성
- 모바일 우선 첫 화면 구성
- 지도 홈, 구역 선택, 카테고리 필터, 하단 시트 구현

## 2단계: 도메인 경계

- `places` 중심 타입 정의
- `zones`, `place_categories`, `cafeteria`, `shuttle` seed 데이터 구성
- API route에서 seed 데이터를 반환하도록 구성

## 3단계: 외부 리소스 연결

사용자가 준비할 항목:

- 새 Cloudflare 프로젝트
- 새 Neon 프로젝트
- v3용 도메인 또는 베타 도메인 후보
- 네이버 지도 API 키
- 카카오 로그인 redirect URI
- PostHog 프로젝트 선택

## 4단계: DB 연결

- Drizzle 설치
- `places` 중심 스키마 작성
- Neon 연결
- seed 데이터를 migration 또는 seed script로 이동

## 5단계: 지도 연결

- `NaverMapProvider`에 실제 네이버 지도 SDK 로더 연결
- 화면 코드는 `MapProvider` 인터페이스에만 의존
- 지도 이동마다 외부 장소 API를 호출하지 않고 DB/API 데이터를 사용

## 6단계: MVP 완성

- 카카오 로그인
- 하이브리드 온보딩
- 식당 미리보기
- 학식 오늘 메뉴
- 셔틀 다음 시간
- PostHog 핵심 이벤트
- Cloudflare 베타 배포
