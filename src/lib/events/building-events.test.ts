import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import BuildingEvents from './BuildingEvents.svelte';
import type { CampusEventDto } from '$lib/server/campus-events';

const now = new Date('2026-09-20T03:00Z');
function event(id: string, startsAt = new Date('2026-09-20T02:00Z')): CampusEventDto {
	return { id, title: `농심국제관 행사 ${id}`, category: '강연', organizer: '학생회', description: '행사 설명', externalUrl: null, startsAt, endsAt: new Date('2026-09-21T08:00Z'), locationName: '농심국제관 101호', location: { type: 'building', buildingIds: ['building-농심국제관'] }, latitude: 36.609, longitude: 127.285, isVisible: true, createdBy: null, createdAt: now, updatedAt: now, coverImageId: null, images: [] };
}

describe('건물 행사 목록', () => {
	it('여러 행사의 제목·장소·기간·상태와 각각의 상세 링크를 모두 표시한다', () => {
		const body = render(BuildingEvents, { props: { events: [event('1'), event('2'), event('3', new Date('2026-09-21T03:00Z'))], now, placeName: '농심국제관' } }).body;
		for (const id of ['1', '2', '3']) { expect(body).toContain(`농심국제관 행사 ${id}`); expect(body).toContain(`href="/today/${id}"`); }
		expect(body).toContain('진행 중'); expect(body).toContain('진행 예정'); expect(body).toContain('농심국제관 101호'); expect(body).toContain('11:00');
	});
	it('행사가 없는 건물도 빈 상태를 표시한다', () => {
		const body = render(BuildingEvents, { props: { events: [], now, placeName: '농심국제관' } }).body;
		expect(body).toContain('지금 이곳에 등록된 행사가 없어요.');
	});
});
