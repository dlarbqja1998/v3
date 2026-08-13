# 메인 브랜드 아이콘 구현 계획

> **에이전트 작업 필수 절차:** `superpowers:executing-plans`로 아래 체크 항목을 순서대로 실행한다.

**목표:** 신규 호이 핀 이미지를 메인 화면 좌상단에 60×60px로 표시하고 일반 웹 브라우저에서도 로컬 개발 서버에 접속할 수 있게 한다.

**구조:** 최종 투명 PNG를 `static/icon.png`에 두고, 메인 페이지 헤더에서 `/icon.png`를 직접 참조한다. 기존 제목·로그인 영역은 유지하며 아이콘을 60×60px로 확대한다. Vite 개발 서버는 `0.0.0.0`에 바인딩해 `localhost`, `127.0.0.1`, 같은 네트워크의 기기에서 접속할 수 있게 한다.

**기술 스택:** SvelteKit, Svelte 5, Tailwind CSS, Vitest, 정적 PNG

## 공통 제약

- 모든 사용자 문구와 문서는 한국어로 작성한다.
- SvelteKit 웹과 Capacitor WebView에서 모두 동작해야 한다.
- 아이콘 영역은 60×60px로 확대한다.
- 파비콘, 앱 스토어 아이콘, 지도 장소 마커는 변경하지 않는다.
- Git 스테이징과 커밋은 별도 사용자 허락 전에는 수행하지 않는다.

---

### 작업 1: 좌상단 브랜드 아이콘 교체

**파일:**

- 생성: `static/icon.png`
- 생성: `src/lib/brand/MainBrandIcon.svelte`
- 생성: `src/lib/brand/main-brand-icon.test.ts`
- 생성: `src/lib/config/vite-config.test.ts`
- 수정: `vite.config.ts`
- 수정: `src/routes/+page.svelte`

**인터페이스:**

- 입력: SvelteKit 정적 경로 `/icon.png`
- 출력: 메인 헤더의 60×60 이미지 요소와 IPv4 접속 가능한 개발 서버

- [x] **1단계: 실패하는 테스트 작성**

  `src/lib/brand/main-brand-icon.test.ts`에서 `MainBrandIcon.svelte`를 서버 렌더링해 다음 조건을 검사한다.

  - 렌더링 결과가 `src="/icon.png"`를 사용한다.
  - 렌더링 결과가 `alt="골라바유 호이 핀"`을 제공한다.
  - 렌더링 결과가 `h-[60px] w-[60px] object-contain` 클래스를 사용한다.
  - Vite 개발 서버 설정이 `host: '0.0.0.0'`을 사용한다.

- [x] **2단계: 실패 확인**

  실행: `npm test -- src/lib/brand/main-brand-icon.test.ts`

  예상: `MainBrandIcon.svelte`가 아직 없어 테스트 모듈을 불러오지 못하고 실패한다.

- [x] **3단계: 최소 구현**

  - `static/images/map/campus-hoi-pin.png`를 `static/icon.png`로 복사한다.
  - 다음 컴포넌트를 만들고 기존 크림슨 사각형과 `Map` 아이콘을 컴포넌트로 교체한다.

  ```svelte
  <img
    class="h-[60px] w-[60px] shrink-0 object-contain"
    src="/icon.png"
    alt="골라바유 호이 핀"
  />
  ```

  - `vite.config.ts`의 `server.host`를 `0.0.0.0`으로 설정한다.

- [x] **4단계: 테스트와 정적 검사**

  실행:

  ```text
  npm test -- src/lib/brand/main-brand-icon.test.ts
  npm test
  npm run check
  npm run build
  ```

  예상: 모든 명령이 종료 코드 0으로 끝나며 빌드 결과에 `icon.png`가 포함된다.

  실행 중인 개발 서버에서 `http://localhost:5173/`과 `http://127.0.0.1:5173/`을 각각 요청해 모두 HTTP 200인지 확인한다.

- [x] **5단계: 화면 확인**

  메인 화면에서 아이콘 전체가 잘리지 않고 60×60px 영역에 표시되며 제목과 로그인 영역이 유지되는지 확인한다.

- [x] **6단계: 커밋 대기**

  변경 결과를 보고하되 사용자가 명시적으로 허락하기 전에는 스테이징과 커밋을 수행하지 않는다.
