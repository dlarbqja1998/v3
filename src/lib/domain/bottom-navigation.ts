export type BottomNavigationKey = 'cafeteria' | 'shuttle' | 'pin' | 'my';

export type BottomNavigationIcon = 'utensils' | 'bus' | 'map-pin' | 'user';

export type BottomNavigationItem = {
	key: BottomNavigationKey;
	label: string;
	href: string;
	icon: BottomNavigationIcon;
};

export function getBottomNavigationItems(): BottomNavigationItem[] {
	return [
		{ key: 'cafeteria', label: '학식', href: '/?panel=cafeteria', icon: 'utensils' },
		{ key: 'shuttle', label: '셔틀', href: '/?panel=shuttle', icon: 'bus' },
		{ key: 'pin', label: '핀', href: '/?panel=pin', icon: 'map-pin' },
		{ key: 'my', label: '마이', href: '/my', icon: 'user' }
	];
}
