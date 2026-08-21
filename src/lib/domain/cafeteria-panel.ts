import { cafeteriaPlaces, staticFoodCourtVendors } from './cafeterias';
import type { CafeteriaPanelItem, WeeklyMenu } from './places';

export function buildCafeteriaPanelItems(weeklyMenu: WeeklyMenu | null): CafeteriaPanelItem[] {
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
