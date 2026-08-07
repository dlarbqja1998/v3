import { describe, expect, it } from 'vitest';
import { insertBoundaryPointOnNearestEdge } from './boundary-editor';

describe('insertBoundaryPointOnNearestEdge', () => {
	it('클릭한 위치와 가장 가까운 경계선 사이에 꼭짓점을 삽입한다', () => {
		const boundary = [
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 2 },
			{ latitude: 2, longitude: 2 },
			{ latitude: 2, longitude: 0 }
		];

		expect(insertBoundaryPointOnNearestEdge(boundary, { latitude: 0, longitude: 1 })).toEqual([
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 1 },
			{ latitude: 0, longitude: 2 },
			{ latitude: 2, longitude: 2 },
			{ latitude: 2, longitude: 0 }
		]);
	});

	it('마지막 점과 첫 점을 잇는 경계선에도 꼭짓점을 삽입한다', () => {
		const boundary = [
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 2 },
			{ latitude: 2, longitude: 2 },
			{ latitude: 2, longitude: 0 }
		];

		expect(insertBoundaryPointOnNearestEdge(boundary, { latitude: 1, longitude: 0 })).toEqual([
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 2 },
			{ latitude: 2, longitude: 2 },
			{ latitude: 2, longitude: 0 },
			{ latitude: 1, longitude: 0 }
		]);
	});
});
