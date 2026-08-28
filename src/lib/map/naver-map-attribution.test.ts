import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import NaverMap from './NaverMap.svelte';
import { getNaverLogoControlPosition, watchNaverAttributionLogo } from './naver-attribution';

describe('네이버 지도 출처 로고 배치', () => {
	it('지도 내부 로고가 바텀시트보다 앞으로 튀어나오지 않게 쌓임 영역을 분리한다', () => {
		const { body } = render(NaverMap, {
			props: {
				clientId: '',
				places: [],
				activePlaceId: '',
				onMarkerClick: () => undefined
			} as never
		});

		expect(body).toMatch(
			/data-map-layer="background"[^>]*style="[^"]*isolation: isolate;[^"]*z-index: 0;/
		);
	});

	it('지도 SDK의 로고를 오른쪽 하단에 배치한다', () => {
		const position = getNaverLogoControlPosition({
			BOTTOM_LEFT: 'bottom-left',
			BOTTOM_RIGHT: 'bottom-right'
		});

		expect(position).toBe('bottom-right');
	});

	it('SDK가 로고를 늦게 생성해도 바텀시트 위로 올린다', () => {
		const logoLink = { style: { transform: '', transition: '' } };
		let logoExists = false;
		let onMutation: () => void = () => undefined;
		let disconnected = false;
		const root = {
			querySelector: () =>
				logoExists
					? {
							closest: () => logoLink
						}
					: null
		};

		watchNaverAttributionLogo(root, 233, (callback) => {
			onMutation = callback;
			return {
				observe: () => undefined,
				disconnect: () => {
					disconnected = true;
				}
			};
		});

		logoExists = true;
		onMutation();

		expect(logoLink.style.transform).toBe('translateY(-233px)');
		expect(disconnected).toBe(true);
	});

	it('바텀시트 위 지도 영역에 로고를 올릴 기준값을 받는다', () => {
		const { body } = render(NaverMap, {
			props: {
				clientId: '',
				places: [],
				activePlaceId: '',
				onMarkerClick: () => undefined,
				attributionBottomOffset: 233
			} as never
		});

		expect(body).toContain('data-map-attribution-bottom-offset="233"');
	});
});
