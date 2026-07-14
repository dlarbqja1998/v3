export type PlaceType = 'restaurant' | 'cafeteria' | 'shuttle_stop' | 'cafe' | 'meetup';

export type PlaceCategory = {
	id: string;
	name: string;
	slug: string;
	icon: string;
	color: string;
	displayOrder: number;
};

export type Zone = {
	id: string;
	name: string;
	slug: string;
	centerLatitude: number;
	centerLongitude: number;
};

export type Place = {
	id: string;
	type: PlaceType;
	name: string;
	categorySlug: string;
	categoryName: string;
	zoneId: string;
	latitude: number;
	longitude: number;
	description: string;
	icon: string;
	isVisible: boolean;
	displayPriority: number;
};

export type CafeteriaSummary = {
	summary: string;
	mealType: string;
	updatedAt: string;
};

export type ShuttleSummary = {
	stopName: string;
	departureTime: string;
	routeName: string;
};

export type MenuDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export type DailyMenu = {
	key: MenuDayKey;
	date: string;
	day: string;
	student: {
		breakfast: string[];
		korean: string[];
		special: string[];
		snack: string[];
		dinner: string[];
	};
	faculty: {
		lunch: string[];
		dinner: string[];
	};
};

export type WeeklyMenu = {
	weekStartDate: string;
	todayKey: MenuDayKey;
	todayDate: string;
	todayDay: string;
	days: DailyMenu[];
};

export type CafeteriaMeal = {
	id: string;
	name: string;
	items: string[];
	ratingTarget: {
		cafeteriaId: string;
		mealType: string;
		menuDate?: string;
	};
};

export type CafeteriaPanelItem = {
	id: string;
	placeId: string;
	name: string;
	description: string;
	source: 'crawler' | 'static';
	latitude: number;
	longitude: number;
	weeklyMenu?: WeeklyMenu | null;
	staticVendors?: {
		id: string;
		name: string;
		menus: string[];
	}[];
};
