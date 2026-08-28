import { describe, expect, it } from 'vitest';
import { formatHomeDate } from './home-date';

describe('메인 바텀시트 날짜', () => {
	it('한국 시간의 요일·일·월을 영문 보조 표기로 보여준다', () => {
		const date = new Date('2026-08-27T15:30:00.000Z');

		expect(formatHomeDate(date)).toBe('FRI · 28 AUG');
	});
});
