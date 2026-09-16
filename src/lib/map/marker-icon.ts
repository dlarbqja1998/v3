import { isFacilityIconName } from '$lib/domain/facility-categories';

export function getSafeMarkerIcon(icon: string) {
	return isFacilityIconName(icon) || icon === 'food' || icon === 'bus' || icon === 'administration' ? icon : '';
}

export function getMapMarkerBackground(isActive: boolean) {
	return isActive ? '#5f0f2d' : '#a51c45';
}
