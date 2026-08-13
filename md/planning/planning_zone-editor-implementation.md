# 관리자 상권 구역 편집기 구현 계획

> **에이전트 작업 지침:** 이 계획은 `superpowers:executing-plans`를 사용해 현재 세션에서 순서대로 실행한다. 각 기능은 테스트 실패를 먼저 확인한 뒤 최소 구현으로 통과시킨다.

**목표:** 기존 관리자 경계 편집기에서 DB의 상권 구역 목록을 확인하고, 새 구역을 생성하거나 기존 구역의 이름과 경계를 수정할 수 있게 한다.

**구조:** `campus_spots`와 `zones`는 서로 다른 데이터로 유지한다. 서버 전용 순수 함수가 구역 입력 검증과 DB 행 변환을 담당하고, 페이지 서버 액션이 관리자 권한·중복 확인·DB 쓰기를 담당한다. Svelte 페이지는 하나의 네이버 지도 위에 `캠퍼스 장소`와 `상권 구역` 편집 모드를 제공한다.

**기술 스택:** SvelteKit 2, Svelte 5, TypeScript, Drizzle ORM, Neon PostgreSQL, Vitest, 네이버 지도 JavaScript SDK

## 공통 제약

- 모든 사용자 문구와 문서는 한국어로 작성한다.
- 기존 `campus_spots` 편집 기능을 유지한다.
- 음식점 핀 생성·배정과 구역 삭제는 이번 범위에서 제외한다.
- 동일 이름은 자동 덮어쓰기하지 않는다.
- DB 쓰기와 관리자 권한 검사는 SvelteKit 서버 액션에 둔다.
- 커밋과 스테이징은 사용자의 별도 승인이 있기 전까지 수행하지 않는다.

---

### 작업 1: 구역 편집 도메인 함수

**파일:**
- 생성: `src/lib/server/zone-editor.ts`
- 생성: `src/lib/server/zone-editor.test.ts`
- 수정: `src/lib/map/boundary-editor.ts`
- 수정: `src/lib/map/boundary-editor.test.ts`

**인터페이스:**
- `normalizeZoneName(value: unknown): string`
- `normalizeZoneBoundary(value: unknown): CampusCoordinate[]`
- `parseZoneEditorInput(name: unknown, boundaryJson: unknown): { ok: true; name: string; boundary: CampusCoordinate[] } | { ok: false; message: string }`
- `toEditableZone(row): EditableZone`
- `createZoneSlug(uuid: string): string`
- `addBoundaryPoint(boundary: CampusCoordinate[], point: CampusCoordinate): CampusCoordinate[]`

- [ ] 이름 공백 제거, 경계 검증, DB 행 변환, UUID 기반 slug 생성의 실패 테스트를 작성한다.
- [ ] `npm test -- src/lib/server/zone-editor.test.ts`를 실행해 모듈 부재로 실패하는지 확인한다.
- [ ] 위 순수 함수를 최소 구현한다.
- [ ] 같은 테스트를 다시 실행해 통과하는지 확인한다.
- [ ] 새 경계의 첫 세 점은 클릭 순서대로 추가하고 이후 점은 가장 가까운 선분에 삽입하는 테스트를 작성한다.
- [ ] `npm test -- src/lib/map/boundary-editor.test.ts`를 실행해 함수 부재로 실패하는지 확인한다.
- [ ] `addBoundaryPoint`를 구현하고 해당 테스트를 통과시킨다.

### 작업 2: 관리자 서버 로드와 구역 생성·수정 액션

**파일:**
- 수정: `src/routes/admin/boundary-editor/+page.server.ts`

**인터페이스:**
- 로드 결과 `zones`: `EditableZone[]`
- 로드 결과 `initialEditorMode`: `'campus' | 'zone'`
- 로드 결과 `initialZoneId`: `string`
- 액션 `createZone`: 이름·경계를 검증하고 `zones` 행을 생성한다.
- 액션 `updateZone`: UUID로 기존 행의 이름·경계·중심 좌표를 수정한다.
- 기존 액션은 `saveCampusSpot` 이름으로 유지한다.

- [ ] `zones`를 표시 순서와 이름 순서로 조회해 `EditableZone`으로 변환한다.
- [ ] URL의 `mode=zone`, `zone=<uuid>`를 초기 화면 상태로 전달한다.
- [ ] `createZone`에서 입력 검증, 대소문자 무시 이름 중복 검사, 표시 순서 계산, UUID 기반 slug 생성, 중심 좌표 계산 후 INSERT를 수행한다.
- [ ] `updateZone`에서 대상 존재 검사, 자기 자신을 제외한 이름 중복 검사, 중심 좌표 계산 후 UPDATE를 수행한다.
- [ ] 성공하면 선택된 구역을 유지하는 URL로 `303` 이동하고, 실패하면 입력값과 한국어 오류를 반환한다.
- [ ] 캠퍼스 저장 액션 이름 변경 후 기존 캐시 갱신 동작이 유지되는지 정적 검사로 확인한다.

### 작업 3: 관리자 편집 UI

**파일:**
- 수정: `src/routes/admin/boundary-editor/+page.svelte`

**인터페이스:**
- `캠퍼스 장소` 탭은 `data.spots`와 `saveCampusSpot`을 사용한다.
- `상권 구역` 탭은 `data.zones`, `createZone`, `updateZone`을 사용한다.

- [ ] 상단에 두 편집 모드 버튼을 추가하고 활성 상태를 명확히 표시한다.
- [ ] 캠퍼스 모드에서 기존 선택·초기화·저장 흐름을 유지한다.
- [ ] 상권 모드에 기존 구역 선택 목록, 이름 입력, `새 구역 만들기`, 초기화, 생성·수정 저장 버튼을 추가한다.
- [ ] 지도 클릭은 `addBoundaryPoint`를 사용하고, 꼭짓점 드래그와 우클릭 삭제를 두 모드에서 공통으로 동작시킨다.
- [ ] 신규 구역은 빈 경계에서 시작하고 기존 구역 선택 시 저장된 중심으로 지도를 이동한다.
- [ ] 이름이 비어 있거나 꼭짓점이 3개 미만이면 저장 버튼을 비활성화한다.
- [ ] 서버 오류와 저장 완료 문구를 한국어로 표시한다.

### 작업 4: 전체 검증

**파일:**
- 검증 대상: 위에서 수정한 모든 파일

- [ ] `npm test -- src/lib/server/zone-editor.test.ts src/lib/map/boundary-editor.test.ts`를 실행한다.
- [ ] `npm test`를 실행해 전체 회귀 테스트를 확인한다.
- [ ] `npm run check`를 실행해 Svelte 및 TypeScript 오류가 없는지 확인한다.
- [ ] `npm run build`를 실행해 배포 빌드가 성공하는지 확인한다.
- [ ] `git -c safe.directory=C:/v3 diff --check`로 공백 오류를 확인한다.
- [ ] 실제 운영 DB 쓰기는 수행하지 않았음을 최종 보고에 명시한다.
