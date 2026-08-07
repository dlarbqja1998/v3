import { describe, expect, it } from 'vitest';
import { cancelMapMotion } from './map-motion';

describe('지도 이동 취소', () => {
	it('사용자 조작이 시작되면 진행 중인 지도 애니메이션을 멈춘다', () => {
		let stopped = 0;
		cancelMapMotion({ stop: () => stopped++ });

		expect(stopped).toBe(1);
	});
});
