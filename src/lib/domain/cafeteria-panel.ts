import { cafeteriaPlaces } from './cafeterias';
import type { CafeteriaPanelItem, WeeklyMenu } from './places';

export function buildCafeteriaPanelItems(weeklyMenu: WeeklyMenu | null): CafeteriaPanelItem[] {
	return cafeteriaPlaces.map((place) => {
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
