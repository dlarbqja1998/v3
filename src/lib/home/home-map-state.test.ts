import { describe, expect, it } from 'vitest';
import { getHomeMapResetState, getShuttlePanelInitialDetent } from './home-map-state';

describe('홈 지도 상태 초기화', () => {
	it('셔틀 핀으로 열 때는 남은 시간이 보이는 중간 높이로 시작한다', () => {
		expect(getShuttlePanelInitialDetent('home_map')).toBe('medium');
		expect(getShuttlePanelInitialDetent('home_bottom_navigation')).toBe('collapsed');
	});

	it('학교 밖 구역에서 홈을 누르면 캠퍼스와 기본 필터 상태로 돌아간다', () => {
		expect(getHomeMapResetState()).toEqual({
			selectedMapAreaId: 'campus',
			areaMode: 'campus',
			selectedCommercialZoneId: 'all',
			selectedOutsideCategory: 'all',
			selectedOutsideCuisine: 'all'
		});
	});
});
