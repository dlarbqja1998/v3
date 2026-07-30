import { describe, expect, it } from 'vitest';
import { getBottomNavigationItems } from './bottom-navigation';

describe('하단 네비게이션 항목', () => {
	it('학식, 셔틀, 핀, 마이를 1차 네비게이션으로 제공한다', () => {
		expect(getBottomNavigationItems()).toEqual([
			{ key: 'cafeteria', label: '학식', href: '/?panel=cafeteria', icon: 'utensils' },
			{ key: 'shuttle', label: '셔틀', href: '/?panel=shuttle', icon: 'bus' },
			{ key: 'pin', label: '핀', href: '/?panel=pin', icon: 'map-pin' },
			{ key: 'my', label: '마이', href: '/my', icon: 'user' }
		]);
	});
});
