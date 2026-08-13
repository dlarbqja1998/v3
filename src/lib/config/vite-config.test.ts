import { describe, expect, it } from 'vitest';
import type { UserConfig } from 'vite';
import viteConfig from '../../../vite.config';

describe('Vite 개발 서버', () => {
	it('일반 브라우저가 IPv4 주소로 접속할 수 있게 연다', () => {
		const config = viteConfig as UserConfig;

		expect(config.server?.host).toBe('0.0.0.0');
	});
});
