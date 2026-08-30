import { describe, expect, it } from 'vitest';
import { getEventSpotlight, getHomeEventFilterOrder, getInitialHomeEventId } from './home-events';

const categories = [
	{ slug: 'copy-room', name: '복사실', icon: 'print' },
	{ slug: 'gym', name: '헬스장', icon: 'gym' },
	{ slug: 'bookstore', name: '서점', icon: 'bookstore' },
	{ slug: 'convenience-store', name: '편의점', icon: 'convenience_store_GS' },
	{ slug: 'post-office', name: '우체국', icon: 'post_office' },
	{ slug: 'cafe', name: '카페', icon: 'cafe' },
	{ slug: 'crimson-store', name: '크림슨스토어', icon: 'crimson_store' }
];

function event(id: string, startsAt: string, endsAt: string) {
	return { id, startsAt: new Date(startsAt), endsAt: new Date(endsAt) };
}

describe('메인 행사 탐색', () => {
	it('행사를 맨 앞에 두고 시설 카테고리를 승인된 순서로 정렬한다', () => {
		expect(getHomeEventFilterOrder(categories).map((category) => category.slug)).toEqual([
			'event', 'convenience-store', 'cafe', 'bookstore', 'copy-room', 'post-office', 'crimson-store', 'gym'
		]);
	});

	it('요청한 행사 ID가 유효하면 유지하고 아니면 첫 행사로 대체한다', () => {
		const events = [event('first', '2026-08-30T02:00:00Z', '2026-08-30T04:00:00Z'), event('second', '2026-08-31T02:00:00Z', '2026-08-31T04:00:00Z')];
		expect(getInitialHomeEventId(events, 'second')).toBe('second');
		expect(getInitialHomeEventId(events, 'missing')).toBe('first');
	});

	it('진행 중 우선, 없으면 시작이 가장 가까운 예정 행사를 스포트라이트로 고른다', () => {
		const now = new Date('2026-08-30T03:00:00Z');
		const ongoing = event('ongoing', '2026-08-30T02:00:00Z', '2026-08-30T04:00:00Z');
		const upcoming = event('upcoming', '2026-08-31T02:00:00Z', '2026-08-31T04:00:00Z');
		expect(getEventSpotlight([upcoming, ongoing], now)?.id).toBe('ongoing');
		expect(getEventSpotlight([upcoming], now)?.id).toBe('upcoming');
	});
});
