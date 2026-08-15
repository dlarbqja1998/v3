import { describe, expect, it } from 'vitest';
import { getBottomNavigationItems } from './bottom-navigation';

describe('하단 내비게이션 항목', () => {
	it('홈, 학식, 셔틀, 오늘, 마이를 1차 내비게이션으로 제공한다', () => {
		expect(getBottomNavigationItems()).toEqual([
			{ key: 'home', label: '홈', href: '/', icon: 'home' },
			{ key: 'cafeteria', label: '학식', href: '/?panel=cafeteria', icon: 'food' },
			{ key: 'shuttle', label: '셔틀', href: '/?panel=shuttle', icon: 'bus' },
			{ key: 'today', label: '오늘', href: '/today', icon: 'today' },
			{ key: 'my', label: '마이', href: '/my', icon: 'my' }
		]);
	});
});
