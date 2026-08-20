import { describe, expect, it } from 'vitest';
import { getHomeMapResetState } from './home-map-state';

describe('홈 지도 상태 초기화', () => {
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
