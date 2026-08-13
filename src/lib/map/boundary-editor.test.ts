import { describe, expect, it } from 'vitest';
import { addBoundaryPoint, insertBoundaryPointOnNearestEdge } from './boundary-editor';

describe('addBoundaryPoint', () => {
	it('새 경계의 첫 세 꼭짓점은 클릭 순서대로 추가한다', () => {
		const first = { latitude: 0, longitude: 0 };
		const second = { latitude: 0, longitude: 2 };
		const third = { latitude: 2, longitude: 0 };

		expect(addBoundaryPoint([first, second], third)).toEqual([first, second, third]);
	});

	it('완성된 경계에는 가장 가까운 경계선 사이로 꼭짓점을 삽입한다', () => {
		const boundary = [
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 2 },
			{ latitude: 2, longitude: 0 }
		];

		expect(addBoundaryPoint(boundary, { latitude: 0, longitude: 1 })).toEqual([
			{ latitude: 0, longitude: 0 },
			{ latitude: 0, longitude: 1 },
			{ latitude: 0, longitude: 2 },
			{ latitude: 2, longitude: 0 }
		]);
	});
});

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
