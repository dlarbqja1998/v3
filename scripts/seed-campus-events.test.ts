import { describe, expect, it } from 'vitest';
import { getCampusEventStatus } from '../src/lib/domain/campus-events';
import { createCampusEventSeed } from './campus-event-seed';

describe('교내 행사 테스트 시드', () => {
	it('고정 UUID의 진행 중과 진행 예정 행사 두 건을 만든다', () => {
		const now = new Date('2026-08-30T03:00:00.000Z');
		const events = createCampusEventSeed(now);

		expect(events.map((event) => event.id)).toEqual([
			'00000000-0000-4000-8000-000000000001',
			'00000000-0000-4000-8000-000000000002'
		]);
		expect(getCampusEventStatus(events[0], now)).toBe('ongoing');
		expect(getCampusEventStatus(events[1], now)).toBe('upcoming');
	});

	it('각 행사에 서로 다른 카테고리·좌표·대표 이미지 객체 키를 준다', () => {
		const [ongoing, upcoming] = createCampusEventSeed(new Date('2026-08-30T03:00:00.000Z'));
		expect(ongoing.category).not.toBe(upcoming.category);
		expect([ongoing.latitude, ongoing.longitude]).not.toEqual([upcoming.latitude, upcoming.longitude]);
		expect(ongoing.image.objectKey).not.toBe(upcoming.image.objectKey);
		expect(ongoing.image.isCover).toBe(true);
		expect(upcoming.image.isCover).toBe(true);
	});
});
