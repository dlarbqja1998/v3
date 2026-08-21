export type BottomNavigationKey = 'home' | 'cafeteria' | 'shuttle' | 'today' | 'my';

export type BottomNavigationIcon = 'home' | 'food' | 'bus' | 'today' | 'my';

export type BottomNavigationItem = {
	key: BottomNavigationKey;
	label: string;
	href: string;
	icon: BottomNavigationIcon;
};

export function getBottomNavigationItems(): BottomNavigationItem[] {
	return [
		{ key: 'home', label: '홈', href: '/', icon: 'home' },
		{ key: 'cafeteria', label: '학식', href: '/cafeteria', icon: 'food' },
		{ key: 'shuttle', label: '셔틀', href: '/?panel=shuttle', icon: 'bus' },
		{ key: 'today', label: '오늘', href: '/today', icon: 'today' },
		{ key: 'my', label: '마이', href: '/my', icon: 'my' }
	];
}
