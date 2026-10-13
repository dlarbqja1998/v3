import { describe, expect, it } from 'vitest';
import { getCampusAreaBoundary } from './campus-area-boundary';
import { findContainingZoneId } from '$lib/domain/facility-zone';

const point = (longitude: number, latitude: number) => ({ latitude, longitude });

describe('교내 전체 점선 초안', () => {
	it('건물 사이의 길까지 감싸되 중간 점과 중복 꼭짓점은 외곽선에서 제외한다', () => {
		const spots = [
			{ boundary: [point(0, 0), point(1, 0), point(1, 1), point(0, 1)] },
			{ boundary: [point(2, 0), point(3, 0), point(3, 1), point(2, 1)] },
			{ boundary: [point(0, 0), point(1.5, 0.5)] }
		];
		const snapshot = JSON.stringify(spots);
		const boundary = getCampusAreaBoundary(spots);
		expect(boundary).toHaveLength(4);
		expect(findContainingZoneId(point(1.5, 0.5), [{ id: 'campus', boundary }])).toBe('campus');
		expect(findContainingZoneId(point(4, 0.5), [{ id: 'campus', boundary }])).toBeNull();
		expect(JSON.stringify(spots)).toBe(snapshot);
	});

	it('유효한 면적을 만들 수 없으면 점선을 만들지 않는다', () => {
		expect(getCampusAreaBoundary([])).toEqual([]);
		expect(getCampusAreaBoundary([{ boundary: [point(0, 0), point(1, 1), point(2, 2), point(NaN, 4)] }])).toEqual([]);
	});
});
