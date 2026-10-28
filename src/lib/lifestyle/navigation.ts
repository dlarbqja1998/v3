export type LifestyleView = 'shuttle' | 'cafeteria' | 'today';

export const lifestyleItems = [
	{ id: 'shuttle', title: '셔틀', icon: 'bus' },
	{ id: 'cafeteria', title: '학식', icon: 'food' },
	{ id: 'today', title: '오늘', icon: 'today' }
] as const;

export function readLifestyleView(url: URL): LifestyleView | null {
	const view = url.searchParams.get('view');
	return view === 'shuttle' || view === 'cafeteria' || view === 'today' ? view : null;
}

export function getLifestyleUrl(routeUrl: URL, shallowHref?: string): URL {
	return new URL(shallowHref ?? routeUrl.href, routeUrl);
}

export function lifestyleHref(view: LifestyleView, params: Record<string, string> = {}) {
	return `/?${new URLSearchParams({ view, ...params })}`;
}

/** 시트의 상태만 걷어내고 기존 지도 검색·구역 정보는 보존한다. */
export function withoutLifestyle(url: URL) {
	const result = new URL(url);
	for (const key of ['view', 'detail', 'cafeteria', 'day', 'stop']) result.searchParams.delete(key);
	return `${result.pathname}${result.search}${result.hash}`;
}
