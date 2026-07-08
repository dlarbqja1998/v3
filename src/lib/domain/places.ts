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
