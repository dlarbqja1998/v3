import { describe, expect, it } from 'vitest';
import { toCommercialZone } from './queries';

describe('상권 DB 행 변환', () => {
	it('DB polygon과 중심 좌표를 학교 밖 지도 DTO로 변환한다', () => {
		expect(
			toCommercialZone({
				slug: 'front-gate',
				name: '고대앞',
				centerLatitude: 36.6,
				centerLongitude: 127.29,
				polygon: [{ latitude: 36.601, longitude: 127.291 }]
			})
		).toEqual({
			id: 'front-gate',
			name: '고대앞',
			center: { latitude: 36.6, longitude: 127.29 },
			boundary: [{ latitude: 36.601, longitude: 127.291 }]
		});
	});

	it('유효하지 않은 polygon 좌표는 제외한다', () => {
		expect(
			toCommercialZone({
				slug: 'station',
				name: '조치원역',
				centerLatitude: 36.61,
				centerLongitude: 127.3,
				polygon: [
					{ latitude: 36.61, longitude: 127.3 },
					{ latitude: '잘못된 값', longitude: 127.31 },
					null
				]
			})
		).toMatchObject({
			boundary: [{ latitude: 36.61, longitude: 127.3 }]
		});
	});
});
