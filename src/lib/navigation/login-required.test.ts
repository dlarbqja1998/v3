import { describe, expect, it } from 'vitest';
import { getNavigationDecision } from './login-required';

describe('하단 내비게이션 로그인 판단', () => {
	it('비로그인 사용자의 마이는 토스트 후 로그인 이동을 요구한다', () => {
		expect(getNavigationDecision('my', false)).toEqual({
			kind: 'login-required',
			href: '/login?next=/my',
			delayMs: 1000
		});
	});

	it('로그인 사용자의 마이는 즉시 이동을 허용한다', () => {
		expect(getNavigationDecision('my', true)).toEqual({ kind: 'allow' });
	});

	it('로그인 여부와 관계없이 마이 외 항목은 즉시 이동을 허용한다', () => {
		expect(getNavigationDecision('home', false)).toEqual({ kind: 'allow' });
		expect(getNavigationDecision('today', false)).toEqual({ kind: 'allow' });
	});
});
