import { describe, expect, it } from 'vitest';
import { getHomeLoadPolicy } from './home-load-policy';

describe('홈 패널별 로드 정책', () => {
	it('셔틀 패널은 학식 메뉴와 평가를 기다리지 않는다', () => {
		expect(getHomeLoadPolicy('shuttle')).toEqual({
			initialPanel: 'shuttle',
			needsCafeteriaMenu: false,
			needsCafeteriaFeedback: false,
			shouldSyncCafeteriaMenu: false
		});
	});

	it('핀 패널은 장소 데이터만 빠르게 보여주기 위해 학식 작업을 생략한다', () => {
		expect(getHomeLoadPolicy('pin')).toEqual({
			initialPanel: 'pin',
			needsCafeteriaMenu: false,
			needsCafeteriaFeedback: false,
			shouldSyncCafeteriaMenu: false
		});
	});

	it('학식 패널과 기본 홈은 학식 메뉴와 평가를 유지한다', () => {
		expect(getHomeLoadPolicy('cafeteria')).toEqual({
			initialPanel: 'cafeteria',
			needsCafeteriaMenu: true,
			needsCafeteriaFeedback: true,
			shouldSyncCafeteriaMenu: true
		});
		expect(getHomeLoadPolicy(null)).toEqual({
			initialPanel: null,
			needsCafeteriaMenu: true,
			needsCafeteriaFeedback: true,
			shouldSyncCafeteriaMenu: true
		});
	});

	it('알 수 없는 panel 값은 기본 홈 정책으로 다룬다', () => {
		expect(getHomeLoadPolicy('unknown')).toEqual({
			initialPanel: null,
			needsCafeteriaMenu: true,
			needsCafeteriaFeedback: true,
			shouldSyncCafeteriaMenu: true
		});
	});
});
