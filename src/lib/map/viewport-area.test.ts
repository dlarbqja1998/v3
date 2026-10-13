import { describe, expect, it } from 'vitest';
import { resolveViewportArea } from './viewport-area';
import type { CommercialCoordinate, CommercialZone } from '$lib/domain/commercial-zones';

const point = (latitude: number, longitude = 127.29): CommercialCoordinate => ({ latitude, longitude });
const campus = [{ id: 'library', center: point(36.609), boundary: [point(36.6085, 127.2895), point(36.6085, 127.2905), point(36.6095, 127.2905), point(36.6095, 127.2895)] }];
const zones: CommercialZone[] = [
	{ id: 'front-gate', name: '고대앞', center: point(36.606), boundary: [point(36.605, 127.289), point(36.605, 127.291), point(36.607, 127.291), point(36.607, 127.289)] },
	{ id: 'station', name: '조치원역', center: point(36.6, 127.30), boundary: [] }
];
const resolve = (latitude: number, longitude = 127.29, previous = 'campus', zoom = 16) => resolveViewportArea({ latitude, longitude, zoom }, zones, campus, previous);

describe('지도 이동에 따른 현재 구역', () => {
	it('교내에서 상권으로 이동하고 다시 돌아오면 각각의 구역을 표시한다', () => {
		expect(resolve(36.609)).toBe('campus');
		expect(resolve(36.606)).toBe('front-gate');
		expect(resolve(36.609, 127.29, 'front-gate')).toBe('campus');
	});

	it('다른 구역의 폴리곤에 들어가면 이전 구역을 유지하지 않는다', () => {
		expect(resolve(36.6069, 127.29, 'campus')).toBe('front-gate');
	});

	it('건물 사이 교내 공간과 경계가 없는 상권도 가까운 좌표로 판정한다', () => {
		expect(resolve(36.61)).toBe('campus');
		expect(resolve(36.6, 127.30, 'front-gate')).toBe('station');
	});

	it('구역 사이 빈 공간의 작은 움직임에는 이름이 깜빡이지 않는다', () => {
		expect(resolve(36.60748, 127.29, 'campus')).toBe('campus');
		expect(resolve(36.6071, 127.29, 'campus')).toBe('front-gate');
	});

	it('상권 경계에서 조금 벗어나도 유지하고 충분히 이동하면 새 구역으로 바뀐다', () => {
		expect(resolve(36.6072, 127.29, 'front-gate')).toBe('front-gate');
		expect(resolve(36.609, 127.29, 'front-gate')).toBe('campus');
	});

	it('현재 구역 경계의 양쪽을 조금씩 오가도 구역 이름을 뒤집지 않는다', () => {
		const adjacent = { ...zones[0], id: 'adjacent', center: point(36.608), boundary: [point(36.607, 127.289), point(36.607, 127.291), point(36.608, 127.291), point(36.608, 127.289)] };
		const resolveBorder = (latitude: number, previous: string) => resolveViewportArea({ ...point(latitude), zoom: 16 }, [zones[0], adjacent], [], previous);
		expect(resolveBorder(36.6071, 'front-gate')).toBe('front-gate');
		expect(resolveBorder(36.6075, 'front-gate')).toBe('adjacent');
		expect(resolveBorder(36.6069, 'adjacent')).toBe('adjacent');
	});

	it('주변 전체로 축소했거나 서비스 구역에서 멀어지면 교외 전체를 표시한다', () => {
		expect(resolve(36.609, 127.29, 'campus', 13)).toBe('outside-all');
		expect(resolve(37, 127.4, 'station')).toBe('outside-all');
	});

	it('교외 링크 진입으로 교내 도형이 아직 없을 때도 캠퍼스로 돌아갈 수 있다', () => {
		expect(resolveViewportArea({ latitude: 36.6093, longitude: 127.2875, zoom: 16 }, zones, [], 'front-gate')).toBe('campus');
	});

	it('구역이 겹쳐도 실제 캠퍼스 건물 안에서는 교내를 표시한다', () => {
		expect(resolveViewportArea({ ...campus[0].center, zoom: 16 }, [{ ...zones[0], boundary: campus[0].boundary }], campus)).toBe('campus');
	});

	it('저장한 캠퍼스 전체 경계 안의 공간은 건물에서 멀어도 교내로 판정한다', () => {
		const customBoundary = [point(36.604, 127.289), point(36.604, 127.291), point(36.611, 127.291), point(36.611, 127.289)];
		expect(resolveViewportArea({ ...point(36.605), zoom: 16 }, zones, campus, 'outside-all', customBoundary)).toBe('campus');
	});

	it('관리자가 교내 경계를 줄이면 옛 건물 좌표의 근접 판정으로 범위를 되살리지 않는다', () => {
		const customBoundary = [point(36.6102, 127.289), point(36.6102, 127.291), point(36.611, 127.291), point(36.611, 127.289)];
		expect(resolveViewportArea({ ...campus[0].center, zoom: 16 }, zones, campus, 'campus', customBoundary)).not.toBe('campus');
	});
});
