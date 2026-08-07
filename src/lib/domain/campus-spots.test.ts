import { describe, expect, it } from 'vitest';
import { campusSpots, getCampusSpotById, isValidCampusSpotBoundary } from './campus-spots';

describe('캠퍼스 스팟 데이터', () => {
	it('건물 20개와 수동 스팟 5개를 지도 선택 대상으로 제공한다', () => {
		const buildingNames = campusSpots
			.filter((spot) => spot.type === 'building')
			.map((spot) => spot.name);

		expect(campusSpots).toHaveLength(25);
		expect(buildingNames).toHaveLength(20);
		expect(buildingNames).toContain('문화융합관');
		expect(buildingNames).toContain('호익프라자');
		expect(buildingNames).not.toContain('고고환경연구원');
		expect(buildingNames).not.toContain('GS25');
	});

	it('사용자가 제공한 야외 스팟을 원래 이름과 좌표로 찾는다', () => {
		expect(getCampusSpotById('grass-square')).toMatchObject({
			name: '잔디광장',
			center: { latitude: 36.6099921641862, longitude: 127.28856751856308 }
		});
		expect(getCampusSpotById('central-square')?.name).toBe('중앙광장');
		expect(getCampusSpotById('green-playground')?.name).toBe('녹지운동장');
		expect(getCampusSpotById('tiger-statue')?.name).toBe('호랑이동상');
		expect(getCampusSpotById('new-main-gate')?.name).toBe('신정문');
	});

	it('모든 스팟은 지도에 그릴 수 있는 중심 좌표와 바운더리를 가진다', () => {
		for (const spot of campusSpots) {
			expect(Number.isFinite(spot.center.latitude)).toBe(true);
			expect(Number.isFinite(spot.center.longitude)).toBe(true);
			expect(isValidCampusSpotBoundary(spot)).toBe(true);
			expect(spot.description.length).toBeGreaterThan(0);
		}
	});
});
