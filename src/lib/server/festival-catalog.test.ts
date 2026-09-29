import { afterEach, describe, expect, it, vi } from 'vitest';
const environment = vi.hoisted(() => ({ dev: true }));
const candidateLookup = vi.hoisted(() => vi.fn());
const publicEventLookup = vi.hoisted(() => vi.fn());
vi.mock('$app/environment', () => environment);
vi.mock('./event-candidates', () => ({ getEventCandidate: candidateLookup }));
vi.mock('./campus-events', () => ({ getPublicCampusEvent: publicEventLookup }));
import { readFestivalForPage } from './festival-catalog';
import { festivalPreview } from '$lib/domain/festival';
import { eventCandidateFixture } from './event-candidate-fixtures';

afterEach(() => { environment.dev = true; candidateLookup.mockReset(); publicEventLookup.mockReset(); });

describe('축제 로컬 미리보기와 공개 데이터 분리', () => {
	it.each(['localhost', '127.0.0.1', '[::1]'])('%s의 개발 화면에서만 새 축제를 제공한다', async (host) => {
		const get = vi.fn(async () => JSON.stringify({ festival: festivalPreview }));
		const put = vi.fn();
		const festival = await readFestivalForPage(host, { get, put });
		expect(festival?.id).toBe('gb-the-match-2026');
		expect(festival?.booths.map((booth) => booth.id)).toEqual(['gb-spc', 'gb-gusia', 'gb-english', 'gb-digital-management', 'gb-chinese']);
		expect(get).not.toHaveBeenCalled();
		expect(put).not.toHaveBeenCalled();
	});
	it.each(['golabau.com', 'localhost.example.com', '192.168.0.10'])('개발 서버여도 %s에 초안을 노출하지 않는다', async (host) => {
		expect(await readFestivalForPage(host)).toBeNull();
	});
	it('운영 빌드에서는 로컬 주소로 요청해도 초안을 반환하지 않는다', async () => {
		environment.dev = false;
		expect(await readFestivalForPage('localhost', undefined, 'test')).toBeNull();
		expect(candidateLookup).not.toHaveBeenCalled();
	});
	it('사용자가 확인한 POLARIS 위치를 쓰고, 관리자가 새로 저장한 핀을 우선 반영한다', async () => {
		const original = await readFestivalForPage('localhost');
		expect(original?.area).toMatchObject({ latitude: festivalPreview.area.latitude, longitude: festivalPreview.area.longitude, approximate: false });
		const candidate = eventCandidateFixture();
		candidateLookup.mockResolvedValue(candidate);
		const moved = await readFestivalForPage('localhost', undefined, 'test');
		expect(moved?.area).toMatchObject({ latitude: candidate.draft.latitude, longitude: candidate.draft.longitude, boundary: [] });
		expect(festivalPreview.area.latitude).toBe(original?.area.latitude);
	});
	it('운영에서는 승인된 공개 행사의 위치로 축제를 연결하고 중복 제거용 행사 ID를 전달한다', async () => {
		environment.dev = false;
		publicEventLookup.mockResolvedValue({ id: 'approved-gb', latitude: 36.6106648, longitude: 127.2886266, locationName: '학생회관 주차장', location: { type: 'pin' } });
		expect(await readFestivalForPage('golabau.com', undefined, 'test')).toMatchObject({ id: 'gb-the-match-2026', eventId: 'approved-gb', preview: false, area: { latitude: 36.6106648, longitude: 127.2886266 } });
		expect(candidateLookup).not.toHaveBeenCalled();
		publicEventLookup.mockResolvedValue(null);
		expect(await readFestivalForPage('golabau.com', undefined, 'test')).toBeNull();
	});
	it('한 요청에서 수정한 자료가 다음 요청이나 이전 축제에 섞이지 않는다', async () => {
		const first = await readFestivalForPage('localhost');
		first!.booths.length = 0;
		expect((await readFestivalForPage('localhost'))?.booths).toHaveLength(5);
		expect(festivalPreview.booths.length).toBeGreaterThan(2);
	});
});
