export type BottomNavigationKey = 'home' | 'cafeteria' | 'shuttle' | 'today' | 'my';

export type BottomNavigationIcon = 'home' | 'utensils' | 'bus' | 'calendar-days' | 'user';

export type BottomNavigationItem = {
	key: BottomNavigationKey;
	label: string;
	href: string;
	icon: BottomNavigationIcon;
};

export function getBottomNavigationItems(): BottomNavigationItem[] {
	return [
		{ key: 'home', label: '홈', href: '/', icon: 'home' },
		{ key: 'cafeteria', label: '학식', href: '/?panel=cafeteria', icon: 'utensils' },
		{ key: 'shuttle', label: '셔틀', href: '/?panel=shuttle', icon: 'bus' },
		{ key: 'today', label: '오늘', href: '/today', icon: 'calendar-days' },
		{ key: 'my', label: '마이', href: '/my', icon: 'user' }
	];
}
