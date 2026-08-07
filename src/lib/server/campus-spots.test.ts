import { describe, expect, it } from 'vitest';
import { getCampusSpotCenter, normalizeCampusBoundary, toCampusSpot } from './campus-spots';

describe('캠퍼스 스팟 DB 변환', () => {
	it('유효한 좌표 배열을 그대로 바운더리로 사용한다', () => {
		expect(
			normalizeCampusBoundary([
				{ latitude: 36.61, longitude: 127.28 },
				{ latitude: 36.62, longitude: 127.28 },
				{ latitude: 36.62, longitude: 127.29 }
			])
		).toHaveLength(3);
	});

	it('잘못 저장된 바운더리는 빈 배열로 바꿔 지도 렌더링 오류를 막는다', () => {
		expect(normalizeCampusBoundary([{ latitude: 36.61, longitude: 'wrong' }])).toEqual([]);
	});

	it('DB 행을 앱에서 쓰는 캠퍼스 스팟 형태로 바꾼다', () => {
		expect(
			toCampusSpot({
				id: 'grass-square', name: '잔디광장', type: 'outdoor', centerLatitude: 36.61,
				centerLongitude: 127.28, boundary: [{ latitude: 36.61, longitude: 127.28 }, { latitude: 36.62, longitude: 127.28 }, { latitude: 36.62, longitude: 127.29 }], source: 'manual-rough', osmId: null, description: '잔디광장 구역입니다.'
			})
		).toMatchObject({ id: 'grass-square', center: { latitude: 36.61, longitude: 127.28 } });
	});
});

it('경계 상자의 중앙 좌표를 계산한다', () => {
	expect(getCampusSpotCenter([
		{ latitude: 36.6, longitude: 127.2 },
		{ latitude: 36.8, longitude: 127.6 },
		{ latitude: 36.7, longitude: 127.4 }
	])).toEqual({ latitude: 36.7, longitude: 127.4 });
});
