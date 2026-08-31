import { describe, expect, it } from 'vitest';
import {
	createOAuthState,
	isAllowedMutationOrigin,
	isValidOAuthState,
	normalizeInternalRedirect
} from './security';

describe('서버 보안 유틸리티', () => {
	it('내부 절대 경로만 로그인 이후 이동 경로로 허용한다', () => {
		expect(normalizeInternalRedirect('/my?tab=inquiries')).toBe('/my?tab=inquiries');
		expect(normalizeInternalRedirect('https://example.com')).toBe('/');
		expect(normalizeInternalRedirect('//example.com/path')).toBe('/');
		expect(normalizeInternalRedirect('\\example.com')).toBe('/');
		expect(normalizeInternalRedirect('/\u0000admin')).toBe('/');
	});

	it('OAuth state는 매번 새 난수를 만들고 정확히 일치할 때만 승인한다', () => {
		const first = createOAuthState();
		const second = createOAuthState();

		expect(first).not.toBe(second);
		expect(first.length).toBeGreaterThanOrEqual(32);
		expect(isValidOAuthState(first, first)).toBe(true);
		expect(isValidOAuthState(first, second)).toBe(false);
		expect(isValidOAuthState(first, null)).toBe(false);
	});

	it('변경 요청은 서비스 자체 Origin만 허용하고 Origin이 없는 서버 호출은 명시적으로 선택한다', () => {
		expect(isAllowedMutationOrigin('https://golabau.com', 'https://golabau.com')).toBe(true);
		expect(isAllowedMutationOrigin('https://evil.example', 'https://golabau.com')).toBe(false);
		expect(isAllowedMutationOrigin(null, 'https://golabau.com')).toBe(false);
		expect(isAllowedMutationOrigin(null, 'https://golabau.com', { allowMissing: true })).toBe(true);
	});
});
