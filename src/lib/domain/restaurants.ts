import type { Place } from './places';
import type { OutsideCuisine, OutsidePlaceCategory } from './outside-place-filters';
import { classifyRestaurant, resolveRestaurantDay, type RestaurantOpeningHours, type RestaurantMenu } from './restaurant-catalog';

export type KuMembership = {
	id: string; placeId: string; periodLabel: string; sourceName: string; summary: string;
	benefits: string[]; conditions: string[]; sourceUrl: string; sourceLabel: string;
	checkedOn: string; status: 'active' | 'ended'; validFrom: string | null; validThrough: string | null;
};
export type OutsideDirectoryView = {
	zone: string; category: OutsidePlaceCategory; cuisine: OutsideCuisine; query: string;
	membershipOnly: boolean; expanded?: boolean; scrollTop?: number; clusterPlaceIds?: string[]; focusPlaceId?: string;
};
export type RestaurantSummary = {
	place: Place; zoneName: string; cuisine: OutsideCuisine; sourceCategory: string;
	roadAddress: string; todayHours: string; membership: KuMembership | null;
};
export type RestaurantDetail = RestaurantSummary & {
	openingHours: RestaurantOpeningHours | null; menus: RestaurantMenu[];
	naverUrl: string | null; checkedOn: string | null;
};
export const EMPTY_OUTSIDE_VIEW: OutsideDirectoryView = {
	zone: 'all', category: 'all', cuisine: 'all', query: '', membershipOnly: false
};
export function getRestaurantMapHref(restaurant: RestaurantSummary) {
	return `/?outside=${encodeURIComponent(restaurant.place.zoneId ?? 'all')}&restaurant=${encodeURIComponent(restaurant.place.id)}`;
}
const koreanDateFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
});
export function koreanDate(now = new Date()) {
	return koreanDateFormatter.format(now);
}
export function membershipIsActive(membership: KuMembership | null | undefined, date?: string) {
	if (!membership || membership.status !== 'active') return false;
	if (!membership.validFrom && !membership.validThrough) return true;
	const today = date ?? koreanDate();
	return (!membership.validFrom || membership.validFrom <= today) &&
		(!membership.validThrough || membership.validThrough >= today);
}
export function restaurantTodayHours(hours: RestaurantOpeningHours | null, date = koreanDate()) {
	if (!hours?.weekly) return '영업시간 확인 중';
	const day = resolveRestaurantDay(hours, date);
	if (day.status === 'closed') return '오늘 휴무';
	if (day.status !== 'scheduled') return '영업시간 확인 중';
	return `오늘 ${day.open}~${day.closesNextDay && day.close !== '24:00' ? '다음 날 ' : ''}${day.close}`;
}
export function filterRestaurants(rows: RestaurantSummary[], view: OutsideDirectoryView, date = koreanDate()) {
	const terms = view.query.toLocaleLowerCase('ko').replace(/\s/g, '');
	return rows.filter(row => {
		if (view.zone !== 'all' && row.place.zoneId !== view.zone) return false;
		if (view.category !== 'all' && row.place.categorySlug !== view.category) return false;
		// 기존 저장 분류를 덮어쓰지 않고 원문 업종으로 현재 화면의 세부 필터를 적용한다.
		if (view.category === 'restaurant' && view.cuisine !== 'all' && classifyRestaurant(row.sourceCategory).cuisine !== view.cuisine) return false;
		if (view.clusterPlaceIds && !view.clusterPlaceIds.includes(row.place.id)) return false;
		if (view.membershipOnly && !membershipIsActive(row.membership, date)) return false;
		return !terms || `${row.place.name} ${row.membership?.sourceName??''} ${row.sourceCategory} ${row.roadAddress} ${row.zoneName}`.toLocaleLowerCase('ko').replace(/\s/g,'').includes(terms);
	}).sort((a,b) => Number(membershipIsActive(b.membership,date)) - Number(membershipIsActive(a.membership,date)) || a.place.name.localeCompare(b.place.name,'ko'));
}

/** 검토 중인 교외 정보는 개발 서버의 루프백 주소에서만 열어 둔다. */
export function isOutsidePreview(isDev: boolean, hostname: string) {
	return isDev && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);
}
