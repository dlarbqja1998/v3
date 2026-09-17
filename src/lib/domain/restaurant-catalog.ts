import type { OutsideCuisine, OutsidePlaceCategory } from './outside-place-filters';

export const restaurantWeekdays = [
	'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
] as const;
export type RestaurantWeekday = typeof restaurantWeekdays[number];

export type SourceDayHours = {
	isClosed: boolean | null;
	open: string | null;
	close: string | null;
	breakTimes: { start: string; end: string }[];
	lastOrder: string | null;
	note: string | null;
};
export type RestaurantDayHours = {
	status: 'scheduled' | 'closed' | 'unknown';
	open: string | null;
	close: string | null;
	closesNextDay: boolean;
	breakTimes: { start: string; end: string }[];
	lastOrders: string[];
	note: string | null;
};
export type RestaurantHolidayRule = {
	kind: 'monthly_weekday' | 'alternating_weekday' | 'last_weekday';
	weekday: RestaurantWeekday;
	occurrences: number[];
	anchorDate: string | null;
	text: string;
};
export type RestaurantOpeningHours = {
	weekly: Record<RestaurantWeekday, RestaurantDayHours>;
	holidayRules: RestaurantHolidayRule[];
	closureNotices: string[];
	exceptions: ({ date: string; reason: string } & (
		{ status: 'closed' } | (RestaurantDayHours & { status: 'scheduled' })
	))[];
	validFrom: string | null;
	validThrough: string | null;
	channel: 'store';
};
export type SourceRestaurantMenu = {
	category: string | null;
	name: string;
	price: number | null;
	priceText: string;
	description: string;
	options: unknown[];
	status: string;
	channel?: 'store' | 'delivery' | 'unconfirmed';
};
export type RestaurantMenu = {
	name: string;
	category: string | null;
	price: number | null;
	priceText: string;
	priceStatus: 'priced' | 'unconfirmed' | 'conflict';
	descriptions: string[];
	options: unknown[];
	channel: 'store' | 'delivery' | 'unconfirmed';
	sourceIndexes: number[];
	priceCandidates: { price: number | null; priceText: string }[];
};
export type RestaurantBoundary = { latitude: number; longitude: number }[];

const koreanWeekdays: Record<string, RestaurantWeekday> = {
	월: 'monday', 화: 'tuesday', 수: 'wednesday', 목: 'thursday',
	금: 'friday', 토: 'saturday', 일: 'sunday'
};

export function isRestaurantTime(value: unknown): value is string {
	return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/.test(value);
}

export function normalizeRestaurantDay(raw: SourceDayHours): RestaurantDayHours {
	const conditional = /격주|매달|매월|마지막\s*주/.test(raw.note ?? '');
	const hasHours = isRestaurantTime(raw.open) && isRestaurantTime(raw.close);
	const status = raw.isClosed && !conditional ? 'closed' : hasHours ? 'scheduled' : 'unknown';
	return {
		status,
		open: status === 'scheduled' ? raw.open : null,
		close: status === 'scheduled' ? raw.close : null,
		closesNextDay: status === 'scheduled' && (raw.close === '24:00' || raw.close! < raw.open!),
		breakTimes: status === 'scheduled'
			? raw.breakTimes.filter(b => isRestaurantTime(b.start) && isRestaurantTime(b.end)) : [],
		lastOrders: status === 'scheduled'
			? [...new Set((raw.lastOrder ?? '').split(',').map(time => time.trim()).filter(isRestaurantTime))] : [],
		note: raw.note
	};
}

export function extractRestaurantHolidayRules(texts: string[]): RestaurantHolidayRule[] {
	const rules = new Map<string, RestaurantHolidayRule>();
	for (const text of texts) {
		const day = text.match(/([월화수목금토일])요일/)?.[1];
		if (!day) continue;
		const weekday = koreanWeekdays[day];
		let rule: RestaurantHolidayRule | null = null;
		if (/격주/.test(text)) {
			rule = { kind: 'alternating_weekday', weekday, occurrences: [], anchorDate: null, text };
		} else if (/마지막\s*주/.test(text)) {
			rule = { kind: 'last_weekday', weekday, occurrences: [], anchorDate: null, text };
		} else {
			const weeks = text.match(/(?:매달|매월)\s*([1-5](?:\s*,\s*[1-5])*)\s*번째/);
			if (weeks) rule = {
				kind: 'monthly_weekday', weekday,
				occurrences: weeks[1].split(',').map(Number), anchorDate: null, text
			};
		}
		if (rule) rules.set(`${rule.kind}:${rule.weekday}:${rule.occurrences.join(',')}`, rule);
	}
	return [...rules.values()];
}

export function normalizeRestaurantHours(
	weekly: Record<RestaurantWeekday, SourceDayHours>,
	notices: string[] = []
): RestaurantOpeningHours {
	const allNotices = [...new Set([...notices, ...Object.values(weekly).map(d => d.note)].filter((x): x is string => Boolean(x)))];
	return {
		weekly: Object.fromEntries(restaurantWeekdays.map(d => [d, normalizeRestaurantDay(weekly[d])])) as Record<RestaurantWeekday, RestaurantDayHours>,
		holidayRules: extractRestaurantHolidayRules(allNotices),
		closureNotices: notices,
		exceptions: [], validFrom: null, validThrough: null, channel: 'store'
	};
}

/** 날짜 인자는 한국 날짜(YYYY-MM-DD)다. 시간 미확인 상태를 영업 중으로 바꾸지 않는다. */
export function resolveRestaurantDay(hours: RestaurantOpeningHours, date: string): RestaurantDayHours {
	const unknown = (): RestaurantDayHours => ({
		status: 'unknown', open: null, close: null, closesNextDay: false,
		breakTimes: [], lastOrders: [], note: '영업시간 확인 필요'
	});
	const parsed = new Date(`${date}T00:00:00Z`);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== date) return unknown();
	const exception = hours.exceptions.find(e => e.date === date);
	if (exception?.status === 'closed') return { ...unknown(), status: 'closed', note: exception.reason };
	if (exception?.status === 'scheduled') return { ...exception, note: exception.reason };
	if ((hours.validFrom && date < hours.validFrom) || (hours.validThrough && date > hours.validThrough)) return unknown();
	const weekday = restaurantWeekdays[(parsed.getUTCDay() + 6) % 7];
	const day = hours.weekly[weekday];
	for (const rule of hours.holidayRules.filter(r => r.weekday === weekday)) {
		let closed = false;
		if (rule.kind === 'monthly_weekday') closed = rule.occurrences.includes(Math.ceil(parsed.getUTCDate()/7));
		if (rule.kind === 'last_weekday') {
			const next = new Date(parsed.getTime() + 7*86400000);
			closed = next.getUTCMonth() !== parsed.getUTCMonth();
		}
		if (rule.kind === 'alternating_weekday') {
			if (!rule.anchorDate) return { ...unknown(), note: rule.text };
			const delta = (parsed.getTime() - new Date(`${rule.anchorDate}T00:00:00Z`).getTime())/86400000;
			if (!Number.isFinite(delta)) return { ...unknown(), note: rule.text };
			closed = delta % 14 === 0;
		}
		if (closed) return { ...unknown(), status: 'closed', note: rule.text };
	}
	return day;
}

export function normalizeRestaurantMenus(menus: SourceRestaurantMenu[]): RestaurantMenu[] {
	const groups = new Map<string, RestaurantMenu>();
	for (const [index, menu] of menus.entries()) {
		// 옵션이 다른 메뉴는 같은 이름이라도 합치지 않는다.
		const key = `${menu.channel ?? 'unconfirmed'}:${menu.category ?? ''}:${menu.name.normalize('NFKC').replace(/\s/g,'')}:${JSON.stringify(menu.options)}`;
		const candidate = { price: menu.price, priceText: menu.priceText };
		let item = groups.get(key);
		if (!item) {
			item = {
				name: menu.name, category: menu.category, price: menu.price, priceText: menu.priceText,
				priceStatus: menu.price === null ? 'unconfirmed' : 'priced',
				descriptions: menu.description ? [menu.description] : [], options: menu.options,
				channel: menu.channel ?? 'unconfirmed', sourceIndexes: [], priceCandidates: []
			};
			groups.set(key,item);
		}
		item.sourceIndexes.push(index);
		if (!item.priceCandidates.some(p => p.price === candidate.price && p.priceText === candidate.priceText)) item.priceCandidates.push(candidate);
		if (menu.description && !item.descriptions.includes(menu.description)) item.descriptions.push(menu.description);
		const prices = new Set(item.priceCandidates.filter(p => p.price !== null).map(p => p.price));
		if (prices.size > 1 || (item.priceCandidates.length > 1 && item.priceCandidates.some(p => p.price === null))) {
			item.price = null;
			item.priceText = '가격 확인 필요';
			item.priceStatus = 'conflict';
		}
	}
	return [...groups.values()];
}

export function classifyRestaurant(category: string, naverCategory = ''): {
	category: Exclude<OutsidePlaceCategory,'all'>; cuisine: Exclude<OutsideCuisine,'all'>
} {
	const text = `${category} ${naverCategory}`;
	if (/주점|술집|포장마차|바\(BAR\)|이자카야/.test(text)) return {category:'bar',cuisine:'other'};
	if (/카페|디저트|커피|케이크|다방|빙수|아이스크림|베이커리|제과|호두과자/.test(text) || category === '차') return {category:'cafe',cuisine:'other'};
	let cuisine: Exclude<OutsideCuisine,'all'> = 'other';
	if (/양꼬치|마라탕|중식/.test(text)) cuisine='chinese';
	else if (/치킨|닭강정/.test(category)) cuisine='chicken';
	else if (/햄버거|피자|맘스터치|후렌치후라이/.test(category)) cuisine='fastfood';
	else if (/일식|일본식|초밥|소바|우동|덮밥|샤브샤브|돈가스|돈까스/.test(category)) cuisine='japanese';
	else if (/양식|이탈리아|프랑스|브런치|패밀리레스토랑|샌드위치|샐러드/.test(category)) cuisine='western';
	else if (/베트남|태국|인도|아시아/.test(category)) cuisine='asian';
	else if (/분식|김밥|떡볶이|호떡|주먹밥|핫도그|토스트/.test(category) || category === '만두') cuisine='snack';
	else if (/고기|곱창|막창|정육|족발|보쌈/.test(category)) cuisine='korean';
	else if (/한식/.test(naverCategory) || /한식|향토음식|국|탕|찌개|전골|생선|굴요리|갈비|백숙|전,빈대떡|도시락|오리|닭|주꾸미|아귀찜|해물|오징어|막국수|냉면|두부|죽$|한정식|낙지|보리밥|기사식당|게요리/.test(category)) cuisine='korean';
	return {category:'restaurant',cuisine};
}

export function isInsideRestaurantZone(latitude: number, longitude: number, boundary: RestaurantBoundary): boolean {
	if (boundary.length < 3 || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
	let inside = false;
	for (let i=0,j=boundary.length-1;i<boundary.length;j=i++) {
		const a=boundary[j],b=boundary[i];
		const dx=b.longitude-a.longitude,dy=b.latitude-a.latitude;
		const cross=(longitude-a.longitude)*dy-(latitude-a.latitude)*dx;
		const length=Math.hypot(dx,dy);
		if (length>0 && Math.abs(cross)/length<1e-9 && longitude>=Math.min(a.longitude,b.longitude)-1e-9 && longitude<=Math.max(a.longitude,b.longitude)+1e-9 && latitude>=Math.min(a.latitude,b.latitude)-1e-9 && latitude<=Math.max(a.latitude,b.latitude)+1e-9) return true;
		if ((a.latitude>latitude)!==(b.latitude>latitude) && longitude<dx*(latitude-a.latitude)/dy+a.longitude) inside=!inside;
	}
	return inside;
}
