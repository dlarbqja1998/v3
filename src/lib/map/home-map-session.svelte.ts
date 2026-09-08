import type { ComponentProps } from 'svelte';
import type NaverMap from './NaverMap.svelte';

export const HOME_MAP_SESSION = Symbol('home-map-session');

/** 레이아웃 인스턴스에 귀속된다. 서버 전역이나 다른 사용자와 공유하지 않는다. */
export class HomeMapSession {
	props = $state.raw<ComponentProps<typeof NaverMap> | null>(null);
	host = $state.raw<HTMLElement | null>(null);
	hasAttached = false;
	focusEpoch = 0;
}
