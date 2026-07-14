import { asc, eq, sql } from 'drizzle-orm';
import type { CafeteriaPanelItem, CafeteriaSummary, Place, PlaceCategory, ShuttleSummary, WeeklyMenu, Zone } from '$lib/domain/places';
import { cafeteriaPlaces, staticFoodCourtVendors } from '$lib/domain/cafeterias';
import { categories, nextShuttle, places as seedPlaces, todayCafeteria, zones as seedZones } from '$lib/domain/seed';
import { createDb } from './index';
import {
	cafeteriaMenus,
	cafeterias,
	placeCategories,
	places,
	shuttleSchedules,
	shuttleStops,
	zones
} from './schema';

export type HomeData = {
	cafeterias: CafeteriaPanelItem[];
	categories: PlaceCategory[];
	places: Place[];
	todayCafeteria: CafeteriaSummary;
	nextShuttle: ShuttleSummary;
	zones: Zone[];
};

export async function getHomeData(databaseUrl?: string, weeklyMenu: WeeklyMenu | null = null): Promise<HomeData> {
	if (!databaseUrl) {
		return getSeedHomeData(weeklyMenu);
	}

	try {
		const db = createDb(databaseUrl);
		const [dbCategories, dbZones, dbPlaces, dbCafeteria, dbShuttle] = await Promise.all([
			db
				.select()
				.from(placeCategories)
				.where(eq(placeCategories.isVisible, true))
				.orderBy(asc(placeCategories.displayOrder)),
			db
				.select()
				.from(zones)
				.where(eq(zones.isVisible, true))
				.orderBy(asc(zones.displayOrder)),
			db
				.select({
					id: places.id,
					type: places.type,
					name: places.name,
					categorySlug: placeCategories.slug,
					categoryName: placeCategories.name,
					zoneId: zones.slug,
					latitude: places.latitude,
					longitude: places.longitude,
					description: places.description,
					icon: placeCategories.icon,
					isVisible: places.isVisible,
					displayPriority: places.displayPriority
				})
				.from(places)
				.innerJoin(placeCategories, eq(places.categoryId, placeCategories.id))
				.innerJoin(zones, eq(places.zoneId, zones.id))
				.where(eq(places.isVisible, true))
				.orderBy(asc(places.displayPriority)),
			db
				.select({
					summary: sql<string>`coalesce(${cafeteriaMenus.items}::text, '')`,
					mealType: cafeteriaMenus.mealType,
					updatedAt: cafeteriaMenus.menuDate
				})
				.from(cafeteriaMenus)
				.innerJoin(cafeterias, eq(cafeteriaMenus.cafeteriaId, cafeterias.placeId))
				.orderBy(asc(cafeteriaMenus.menuDate))
				.limit(1),
			db
				.select({
					stopName: places.name,
					departureTime: sql<string>`${shuttleSchedules.departureTime}::text`,
					routeName: shuttleSchedules.routeName
				})
				.from(shuttleSchedules)
				.innerJoin(shuttleStops, eq(shuttleSchedules.stopId, shuttleStops.placeId))
				.innerJoin(places, eq(shuttleStops.placeId, places.id))
				.where(eq(shuttleSchedules.isActive, true))
				.orderBy(asc(shuttleSchedules.departureTime))
				.limit(1)
		]);

		return {
			cafeterias: buildCafeteriaPanelItems(weeklyMenu),
			categories: dbCategories.map((category) => ({
				id: category.id,
				name: category.name,
				slug: category.slug,
				icon: category.icon,
				color: category.color,
				displayOrder: category.displayOrder
			})),
			places: appendCafeteriaPlaces(dbPlaces as Place[]),
			todayCafeteria: dbCafeteria[0]
				? {
						...dbCafeteria[0],
						summary: formatMenuSummary(dbCafeteria[0].summary)
					}
				: todayCafeteria,
			nextShuttle: dbShuttle[0]
				? {
						...dbShuttle[0],
						departureTime: formatDepartureTime(dbShuttle[0].departureTime)
					}
				: nextShuttle,
			zones: dbZones.map((zone) => ({
				id: zone.slug,
				name: zone.name,
				slug: zone.slug,
				centerLatitude: zone.centerLatitude,
				centerLongitude: zone.centerLongitude
			}))
		};
	} catch (error) {
		console.error('Neon 데이터를 불러오지 못해 seed 데이터로 대체합니다.', error);
		return getSeedHomeData(weeklyMenu);
	}
}

function formatMenuSummary(summary: string) {
	try {
		const parsed = JSON.parse(summary);
		if (Array.isArray(parsed)) {
			return parsed.filter((item) => typeof item === 'string').join(', ');
		}
	} catch {
		// DB에는 텍스트 요약과 JSON 배열이 모두 들어올 수 있다.
	}

	return summary;
}

function formatDepartureTime(departureTime: string) {
	return departureTime.replace(/:00$/, '');
}

function getSeedHomeData(weeklyMenu: WeeklyMenu | null): HomeData {
	return {
		cafeterias: buildCafeteriaPanelItems(weeklyMenu),
		categories,
		places: appendCafeteriaPlaces(seedPlaces.filter((place) => place.id !== 'place-3')),
		todayCafeteria,
		nextShuttle,
		zones: seedZones
	};
}

function appendCafeteriaPlaces(basePlaces: Place[]) {
	const existingIds = new Set(basePlaces.map((place) => place.id));
	const missingCafeterias = cafeteriaPlaces.filter((place) => !existingIds.has(place.id));
	return [...basePlaces, ...missingCafeterias].sort((a, b) => a.displayPriority - b.displayPriority);
}

function buildCafeteriaPanelItems(weeklyMenu: WeeklyMenu | null): CafeteriaPanelItem[] {
	return cafeteriaPlaces.map((place) => {
		if (place.id === 'cafeteria-foodcourt') {
			return {
				id: 'foodcourt',
				placeId: place.id,
				name: place.name,
				description: place.description,
				source: 'static',
				latitude: place.latitude,
				longitude: place.longitude,
				staticVendors: staticFoodCourtVendors
			};
		}

		return {
			id: place.id === 'cafeteria-faculty' ? 'faculty' : 'jinri',
			placeId: place.id,
			name: place.name,
			description: place.description,
			source: 'crawler',
			latitude: place.latitude,
			longitude: place.longitude,
			weeklyMenu
		};
	});
}
