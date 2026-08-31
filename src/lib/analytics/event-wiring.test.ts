// @ts-expect-error 프로젝트 tsconfig는 Node 타입을 전역으로 포함하지 않는다.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('핵심 사용자 행동 이벤트 연결', () => {
	it('하단 내비게이션 선택을 추적한다', () => {
		const source = readSource('../navigation/BottomNavigation.svelte');
		expect(source).toContain('analyticsEvents.navigationTabSelected');
		expect(source).toContain('navigation_key: key');
	});

	it('메인 지도에서 카테고리·검색·핀·건물·행사 선택을 추적한다', () => {
		const source = readSource('../../routes/+page.svelte');
		for (const event of [
			'analyticsEvents.selectCategory',
			'analyticsEvents.searchPlace',
			'analyticsEvents.clickPlaceMarker',
			'analyticsEvents.selectBuilding',
			'analyticsEvents.selectEvent'
		]) {
			expect(source).toContain(event);
		}
	});

	it('학식 식당·날짜·메뉴 평가를 추적한다', () => {
		const source = readSource('../../routes/cafeteria/+page.svelte');
		expect(source).toContain('analyticsEvents.selectCafeteria');
		expect(source).toContain('analyticsEvents.selectMealDate');
		expect(source).toContain('analyticsEvents.menuReactionChanged');
	});

	it('셔틀 노선과 오늘 행사 탐색을 추적한다', () => {
		const shuttle = readSource('../../routes/shuttle/+page.svelte');
		const today = readSource('../../routes/today/+page.svelte');
		const eventDetail = readSource('../../routes/today/[id]/+page.svelte');

		expect(shuttle).toContain('analyticsEvents.selectShuttleRoute');
		expect(today).toContain('analyticsEvents.selectTodayTab');
		expect(today).toContain('analyticsEvents.selectEvent');
		expect(eventDetail).toContain('analyticsEvents.viewEventDetail');
	});
});
