import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import * as schema from './db/schema';
import { eventCandidateFixture } from './event-candidate-fixtures';
import { parseEventProposal } from '../domain/event-candidates';

const state = vi.hoisted(() => ({ db: null as unknown }));
vi.mock('./db', () => ({ createDb: () => state.db }));
import { beginEventImportRun, getEventCandidate, importEventProposal, publishEventCandidate, saveEventCandidate, saveEventCandidateLocation } from './event-candidates';
import { saveCampusEventLocation } from './campus-events';
import { importManualEventCandidates } from './manual-event-import';

let pg: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
const bucket = { get: vi.fn(async () => ({ body: new Uint8Array([1]) })), put: vi.fn(), delete: vi.fn() };

beforeAll(async () => {
	pg = new PGlite();
	await pg.exec('CREATE TABLE users (id integer PRIMARY KEY, role text); INSERT INTO users VALUES (1, \'admin\');');
	await pg.exec(readFileSync('drizzle/0007_fancy_beast.sql', 'utf8'));
	await pg.exec('ALTER TABLE campus_events ADD COLUMN external_url text; ALTER TABLE campus_events ADD COLUMN location jsonb;');
	await pg.exec(readFileSync('drizzle/0013_event_collection_inbox.sql', 'utf8'));
	db = drizzle(pg, { schema }); state.db = db;
}, 20000);
beforeEach(async () => { await pg.exec('TRUNCATE event_candidates, event_candidate_sources, campus_event_images, campus_events, event_import_runs CASCADE;'); bucket.get.mockResolvedValue({ body: new Uint8Array([1]) }); });
afterAll(async () => { await pg?.close(); });

async function insertCandidate() { const candidate = eventCandidateFixture(); await db.insert(schema.eventCandidates).values(candidate); return candidate; }
function proposal(hash = 'same-source', board = '370457') {
	const draft = eventCandidateFixture().draft;
	const value = parseEventProposal({ ...draft, sourceUrl: `https://everytime.kr/${board}/v/123`, sourceTitle: '행사 안내', evidence: '9월 23일 12시부터 14시까지', missing: [], isCancellation: false });
	value.source.contentHash = hash; return value;
}

describe('실제 PostgreSQL 후보 승인과 재시도', () => {
	it('후보의 위치만 저장하며 대표 이미지 승인·설명과 다른 검토 항목을 유지한다', async () => {
		const candidate = eventCandidateFixture({ coverApproved: false, reviewFlags: ['행사 구역의 지도 위치 확인', '이미지 사용 확인'] });
		await db.insert(schema.eventCandidates).values(candidate);
		const location = { locationName: '미래관 사거리 앞', latitude: 36.6102923, longitude: 127.2861632, location: { type: 'pin' as const } };
		expect(await saveEventCandidateLocation('test', candidate, location)).toMatchObject({ state: 'pending', coverApproved: false, coverImage: candidate.coverImage, draft: { ...candidate.draft, ...location }, reviewFlags: ['이미지 사용 확인'], version: 2 });
		expect(await saveEventCandidateLocation('test', candidate, { ...location, locationName: '이전 화면의 장소' })).toBeNull();
		expect(await db.query.campusEvents.findMany()).toHaveLength(0);
	});
	it('등록된 행사의 위치 저장은 공개 상태를 유지하고 오래된 화면의 덮어쓰기를 막는다', async () => {
		const candidate = await insertCandidate();
		await publishEventCandidate('test', candidate.id, 1, 1, [], bucket);
		await pg.exec(`UPDATE campus_events SET is_visible = false, updated_at = '2026-09-29 13:00:00.123456+09'`);
		const event = (await db.query.campusEvents.findFirst())!;
		const location = { locationName: '미래관 사거리 앞', latitude: 36.6102923, longitude: 127.2861632, location: { type: 'pin' as const } };
		expect(await saveCampusEventLocation('test', event.id, event.updatedAt, location)).toMatchObject({ ...location, title: event.title, description: event.description, isVisible: false });
		expect(await saveCampusEventLocation('test', event.id, event.updatedAt, { ...location, locationName: '이전 화면의 장소' })).toBeNull();
	});
	it('체크한 후보의 행사·이미지·승인 완료를 함께 저장한다', async () => {
		const candidate = await insertCandidate();
		expect(await publishEventCandidate('test', candidate.id, 1, 1, [], bucket)).toMatchObject({ ok: true });
		expect(await db.query.campusEvents.findMany()).toMatchObject([{ id: candidate.id, isVisible: true, createdBy: 1 }]);
		expect(await db.query.campusEventImages.findMany()).toMatchObject([{ isCover: true, eventId: candidate.id }]);
		expect(await getEventCandidate('test', candidate.id)).toMatchObject({ state: 'published', version: 2, publishedEventId: candidate.id });
	});
	it('동시에 두 번 승인해도 행사는 하나만 생성된다', async () => {
		const candidate = await insertCandidate();
		const results = await Promise.all([publishEventCandidate('test', candidate.id, 1, 1, [], bucket), publishEventCandidate('test', candidate.id, 1, 1, [], bucket)]);
		expect(results.filter((result) => result.ok)).toHaveLength(1);
		expect(await db.query.campusEvents.findMany()).toHaveLength(1);
	});
	it('화면을 연 뒤 수정된 후보는 예전 버전으로 게시하지 못한다', async () => {
		const candidate = await insertCandidate();
		await saveEventCandidate('test', { id: candidate.id, version: 1, draft: { ...candidate.draft, title: '수정한 행사' }, coverImage: candidate.coverImage, coverApproved: true, acknowledged: false });
		expect(await publishEventCandidate('test', candidate.id, 1, 1, [], bucket)).toMatchObject({ ok: false });
		expect(await db.query.campusEvents.findMany()).toHaveLength(0);
	});
	it('이미지 저장 단계가 실패하면 행사와 승인 상태가 모두 롤백된다', async () => {
		const candidate = await insertCandidate();
		await pg.exec('ALTER TABLE campus_event_images ADD CONSTRAINT reject_test_image CHECK (byte_size < 0);');
		try { await expect(publishEventCandidate('test', candidate.id, 1, 1, [], bucket)).rejects.toBeDefined(); }
		finally { await pg.exec('ALTER TABLE campus_event_images DROP CONSTRAINT reject_test_image;'); }
		expect(await db.query.campusEvents.findMany()).toHaveLength(0);
		expect(await getEventCandidate('test', candidate.id)).toMatchObject({ state: 'pending', version: 1 });
	});
	it('행사 관리 화면에서 수정한 내용을 수집 후보 승인으로 덮지 않는다', async () => {
		const candidate = await insertCandidate(); await publishEventCandidate('test', candidate.id, 1, 1, [], bucket);
		await db.update(schema.campusEvents).set({ title: '관리자가 직접 고친 제목', updatedAt: new Date('2026-12-01T00:00:00Z') }).where(eq(schema.campusEvents.id, candidate.id));
		await db.update(schema.eventCandidates).set({ state: 'pending' }).where(eq(schema.eventCandidates.id, candidate.id));
		expect(await publishEventCandidate('test', candidate.id, 2, 1, [], bucket)).toMatchObject({ ok: false });
		expect((await db.query.campusEvents.findFirst())?.title).toBe('관리자가 직접 고친 제목');
	});
	it('두 게시판의 같은 행사를 묶고 원문이 같으면 모델 요약 변화는 무시한다', async () => {
		const first = await importEventProposal('test', proposal(), []);
		const second = await importEventProposal('test', proposal('other-board', '367439'), []);
		expect(second).toMatchObject({ id: first.id, status: 'merged' });
		const again = proposal(); again.draft.description = '같은 원문을 다르게 요약한 문장';
		expect(await importEventProposal('test', again, [])).toMatchObject({ status: 'unchanged' });
		expect((await getEventCandidate('test', first.id))?.sources).toHaveLength(2);
	});
	it('원문 변경은 수동 보완 내용을 유지하면서 변경 제안으로 남긴다', async () => {
		const imported = await importEventProposal('test', proposal(), []);
		await db.update(schema.eventCandidates).set({ manuallyEdited: true, draft: { ...proposal().draft, locationName: '관리자가 확인한 장소' } }).where(eq(schema.eventCandidates.id, imported.id));
		const changed = proposal('changed'); changed.draft.locationName = '새로 안내한 장소';
		await importEventProposal('test', changed, []);
		const candidate = await getEventCandidate('test', imported.id);
		expect(candidate?.draft.locationName).toBe('관리자가 확인한 장소');
		expect(candidate?.suggestedDraft?.locationName).toBe('새로 안내한 장소');
		expect(candidate?.reviewFlags.length).toBeGreaterThan(0);
	});
	it('다른 게시판에서 발견한 취소 공지도 기존 후보의 검토를 요구한다', async () => {
		const imported = await importEventProposal('test', proposal(), []);
		const cancellation = proposal('cancelled', '367439'); cancellation.isCancellation = true;
		expect(await importEventProposal('test', cancellation, [])).toMatchObject({ id: imported.id, status: 'changed' });
		expect((await getEventCandidate('test', imported.id))?.reviewFlags.join('')).toContain('취소');
	});
	it('정기 수집의 중복 실행을 막고 오래된 실행은 실패로 남긴다', async () => {
		const now = new Date('2026-09-20T00:00:00Z');
		expect(await beginEventImportRun('test', 'first', now)).not.toBeNull();
		expect(await beginEventImportRun('test', 'second', now)).toBeNull();
		expect(await beginEventImportRun('test', 'third', new Date(now.getTime() + 17 * 60000))).not.toBeNull();
		expect(await db.query.eventImportRuns.findMany()).toEqual(expect.arrayContaining([expect.objectContaining({ slot: 'first', status: 'failed' })]));
	});
});

function manualPayload(overrides = {}) {
	return JSON.stringify({ schemaVersion: 1, since: '2026-09-06T00:00:00Z', checkedAt: new Date().toISOString(), checkedBoards: ['370457', '367439'], coverage: 'complete', candidates: [{ ...eventCandidateFixture().draft, sourceUrl: 'https://everytime.kr/370457/v/123', sourceTitle: '행사 안내', evidence: '9월 23일 학생회관 앞에서 문화제 진행', missing: ['포스터의 상세 위치 확인'], state: 'published', coverApproved: true }], ...overrides });
}

describe('요청형 후보 가져오기', () => {
	it('같은 결과를 다시 가져와도 검토 대기 후보 하나만 남고 공개 행사는 만들지 않는다', async () => {
		const text = manualPayload();
		const first = await importManualEventCandidates('test', text, []);
		const again = await importManualEventCandidates('test', text, []);
		expect(first).toMatchObject({ status: 'completed', newCount: 1, failedCount: 0 });
		expect(again).toMatchObject({ newCount: 0, unchangedCount: 1 });
		expect(await db.query.eventCandidates.findMany()).toMatchObject([{ state: 'pending', coverApproved: false, coverImage: null, reviewFlags: ['포스터의 상세 위치 확인'] }]);
		expect(await db.query.eventCandidates.findMany()).toHaveLength(1);
		expect(await db.query.campusEvents.findMany()).toHaveLength(0);
		expect((await db.query.eventImportRuns.findFirst())?.checkpoint?.startedAt).toBe(JSON.parse(text).checkedAt);
	});
	it('파일의 뒤쪽 후보가 잘못되어도 저장을 시작하지 않는다', async () => {
		const payload = JSON.parse(manualPayload());
		payload.candidates.push({ ...payload.candidates[0], sourceUrl: 'https://evil.test/' });
		await expect(importManualEventCandidates('test', JSON.stringify(payload), [])).rejects.toThrow('2번째 후보');
		expect(await db.query.eventCandidates.findMany()).toHaveLength(0);
		expect(await db.query.eventImportRuns.findMany()).toHaveLength(0);
	});
	it('일부 범위와 전체 범위의 0건 결과를 구분한다', async () => {
		expect(await importManualEventCandidates('test', manualPayload({ candidates: [], checkedBoards: ['370457'], coverage: 'partial', note: '홍보게시판 미확인' }), [])).toMatchObject({ status: 'partial', newCount: 0 });
		expect(await importManualEventCandidates('test', manualPayload({ candidates: [] }), [])).toMatchObject({ status: 'completed', newCount: 0 });
	});
	it('한 후보의 저장 실패는 부분 실패로 남기고 재시도 시 성공한 후보를 재사용한다', async () => {
		const payload = JSON.parse(manualPayload());
		payload.candidates.push({ ...payload.candidates[0], title: '저장 실패 행사', sourceUrl: 'https://everytime.kr/367439/v/456' });
		const text = JSON.stringify(payload);
		await pg.exec("ALTER TABLE event_candidates ADD CONSTRAINT reject_manual_test CHECK (draft->>'title' <> '저장 실패 행사');");
		try { expect(await importManualEventCandidates('test', text, [])).toMatchObject({ status: 'partial', newCount: 1, failedCount: 1 }); }
		finally { await pg.exec('ALTER TABLE event_candidates DROP CONSTRAINT reject_manual_test;'); }
		expect(await importManualEventCandidates('test', text, [])).toMatchObject({ status: 'completed', newCount: 1, unchangedCount: 1, failedCount: 0 });
		expect(await db.query.eventCandidates.findMany()).toHaveLength(2);
		expect(await db.query.campusEvents.findMany()).toHaveLength(0);
	});
	it('예전 확인 파일로 더 최근의 원문 변경을 되돌리지 않는다', async () => {
		const older = JSON.parse(manualPayload({ checkedAt: '2026-09-18T00:00:00Z' }));
		const newer = structuredClone(older); newer.checkedAt = '2026-09-19T00:00:00Z'; newer.candidates[0].description = '원문에 새로 추가된 행사 안내입니다.';
		await importManualEventCandidates('test', JSON.stringify(newer), []);
		expect(await importManualEventCandidates('test', JSON.stringify(older), [])).toMatchObject({ unchangedCount: 1 });
		expect((await db.query.eventCandidates.findFirst())?.draft.description).toBe('원문에 새로 추가된 행사 안내입니다.');
	});
	it('다른 저장 작업이 실행 중이면 새 후보를 쓰지 않는다', async () => {
		await beginEventImportRun('test', 'active', new Date());
		await expect(importManualEventCandidates('test', manualPayload(), [])).rejects.toThrow('진행 중');
		expect(await db.query.eventCandidates.findMany()).toHaveLength(0);
	});
});
