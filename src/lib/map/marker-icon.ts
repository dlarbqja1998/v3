import { isFacilityIconName } from '$lib/domain/facility-categories';

export function getSafeMarkerIcon(icon: string) {
	return isFacilityIconName(icon) || icon === 'food' || icon === 'bus' ? icon : '';
}
