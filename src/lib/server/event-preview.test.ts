import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ dev: true, candidate: vi.fn(), publicEvent: vi.fn() }));
vi.mock('$app/environment', () => ({ get dev() { return mocks.dev; } }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'test' } }));
vi.mock('./event-candidates', () => ({ getEventCandidate: mocks.candidate }));
vi.mock('./campus-events', () => ({ listPublicCampusEvents: async () => [], getPublicCampusEvent: mocks.publicEvent }));
vi.mock('./festival-catalog', () => ({ readFestivalForPage: async () => null }));
vi.mock('./db/queries', () => ({ getHomeData: async () => ({ places: [], cafeterias: [] }) }));
vi.mock('./notices', () => ({ getHomeNotice: async () => null }));
vi.mock('./restaurants', () => ({ readOutsideCatalog: async () => ({ restaurants: [], memberships: {} }) }));
import { readLocalEventPreviews } from './event-preview';
import { eventCandidateFixture } from './event-candidate-fixtures';
import { load as loadHome } from '../../routes/+page.server';
import { load as loadToday } from '../../routes/today/+page.server';
import { load as loadDetail } from '../../routes/today/[id]/+page.server';

const candidateId = '5a443533-9343-442b-aedb-f7d8ace96e66';
function kusCandidate() {
	const candidate = eventCandidateFixture({ id: candidateId });
	candidate.draft = { ...candidate.draft, title: 'KUS대학혁신사업단 서포터즈 홍보부스',
		startsAt: '2026-09-30T11:30:00+09:00', endsAt: '2026-09-30T14:00:00+09:00',
		locationName: '미래관 사거리 앞', latitude: 36.6102923, longitude: 127.2861632 };
	return candidate;
}
beforeEach(() => {
	mocks.dev = true;
	mocks.candidate.mockReset().mockResolvedValue(kusCandidate());
	mocks.publicEvent.mockReset().mockResolvedValue(null);
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-09-29T14:00:00+09:00'));
});
afterEach(() => vi.useRealTimers());

describe('요청한 행사의 로컬 미리보기', () => {
	it('이미 공개된 행사는 로컬 미리보기로 다시 합쳐 중복 표시하지 않는다', async () => {
		vi.setSystemTime(new Date('2026-10-06T14:30:00+09:00'));
		mocks.publicEvent.mockResolvedValue({ id: '30ac5cc8-7f19-44a0-bd14-faebf7cfe19a' });
		expect(await readLocalEventPreviews('test', 'localhost', false)).toEqual([]);
		expect(mocks.candidate).not.toHaveBeenCalled();
	});
	it('오늘 확인한 연구 페스타만 로컬에서 예정 행사로 보여주고 종료 후 숨긴다', async () => {
		vi.setSystemTime(new Date('2026-10-06T14:30:00+09:00'));
		const preview = await readLocalEventPreviews(undefined, 'localhost', false);
		expect(preview).toHaveLength(1);
		expect(preview[0]).toMatchObject({ locationName: '중앙광장 에코업부스', startsAt: new Date('2026-10-07T10:00:00+09:00'), endsAt: new Date('2026-10-07T17:00:00+09:00') });
		expect(mocks.candidate).not.toHaveBeenCalled();
		expect(await readLocalEventPreviews('test', 'golabau.com', true)).toEqual([]);
		mocks.dev = false;
		expect(await readLocalEventPreviews(undefined, 'localhost', false)).toEqual([]);
		mocks.dev = true;
		expect(await readLocalEventPreviews(undefined, 'localhost', false, new Date('2026-10-07T17:00:01+09:00'))).toEqual([]);
	});
	it('홈 지도와 진행 예정, 상세 화면에 같은 일정·핀·대표 이미지를 전달한다', async () => {
		const request = { url: new URL('http://127.0.0.1:5173/'), locals: { user: { id: 1, role: 'admin' } }, params: { id: candidateId } } as never;
		const [home, today, detail] = await Promise.all([loadHome(request), loadToday(request), loadDetail(request)]);
		if (!today || !detail) throw new Error('행사 화면 데이터를 받지 못했습니다.');
		expect(home.campusEvents).toHaveLength(1);
		expect(today).toMatchObject({ ongoingEvents: [], initialTab: 'upcoming' });
		expect(today.upcomingEvents).toEqual(home.campusEvents);
		expect(detail.event).toEqual(home.campusEvents[0]);
		expect(detail.event).toMatchObject({ latitude: 36.6102923, longitude: 127.2861632, startsAt: new Date('2026-09-30T11:30:00+09:00') });
		expect(detail.event.images[0].url).toContain(`/admin/events/inbox/${candidateId}/image`);
	});
	it.each([['https://golabau.com', true], ['http://localhost.example.com', true], ['http://127.0.0.1:5173', false]])('허용하지 않은 접근 %s / 관리자 %s는 후보를 읽지 않는다', async (origin, isAdmin) => {
		expect(await readLocalEventPreviews('test', new URL(origin).hostname, isAdmin)).toEqual([]);
		expect(mocks.candidate).not.toHaveBeenCalled();
	});
	it('운영 빌드와 일반 사용자는 관리자 미리보기를 받지 않는다', async () => {
		mocks.dev = false;
		expect(await readLocalEventPreviews('test', 'localhost', true)).toEqual([]);
		expect(mocks.candidate).not.toHaveBeenCalled();
		mocks.dev = true;
		const url = new URL('http://127.0.0.1:5173/');
		await loadHome({ url, locals: { user: { id: 1, role: 'admin' } } } as never);
		expect((await loadHome({ url, locals: { user: null } } as never)).campusEvents).toEqual([]);
	});
	it('시작 시 진행 중으로 바뀌고 종료 후에는 미리보기에서도 사라진다', async () => {
		vi.setSystemTime(new Date('2026-09-30T11:30:00+09:00'));
		const today = await loadToday({ url: new URL('http://localhost/today'), locals: { user: { role: 'admin' } } } as never);
		if (!today) throw new Error('오늘 행사 데이터를 받지 못했습니다.');
		expect(today.ongoingEvents).toHaveLength(1);
		expect(today.upcomingEvents).toEqual([]);
		expect(await readLocalEventPreviews('test', 'localhost', true, new Date('2026-09-30T14:00:01+09:00'))).toEqual([]);
	});
	it('위치 미지정·거절·게시 완료 후보를 임의로 표시하지 않는다', async () => {
		for (const candidate of [
			{ ...kusCandidate(), state: 'rejected' },
			{ ...kusCandidate(), state: 'published', publishedEventId: 'published' },
			{ ...kusCandidate(), draft: { ...kusCandidate().draft, latitude: null, longitude: null } }
		]) {
			mocks.candidate.mockResolvedValue(candidate);
			expect(await readLocalEventPreviews('test', 'localhost', true)).toEqual([]);
		}
	});
});
