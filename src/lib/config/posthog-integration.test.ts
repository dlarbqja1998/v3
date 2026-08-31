// @ts-expect-error 프로젝트 tsconfig는 Node 타입을 전역으로 포함하지 않는다.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('PostHog 운영 설정', () => {
	it('운영 도메인에서 새 프로젝트를 명시적 이벤트 방식으로 초기화한다', () => {
		const appHtml = readFileSync(new URL('../../app.html', import.meta.url), 'utf8');

		expect(appHtml).toContain("hostname === 'golabau.com'");
		expect(appHtml).toContain("api_host: 'https://us.i.posthog.com'");
		expect(appHtml).toContain('autocapture: false');
		expect(appHtml).toContain('capture_pageview: false');
		expect(appHtml).toContain('disable_session_recording: true');
	});
});
