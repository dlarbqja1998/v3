import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('PostHog 운영 설정', () => {
	it('운영 도메인의 전체 클릭을 자동 수집하고 주요 행동 이벤트를 함께 기록한다', () => {
		const appHtml = readFileSync(new URL('../../app.html', import.meta.url), 'utf8');

		expect(appHtml).toContain("hostname === 'golabau.com'");
		expect(appHtml).toContain("api_host: 'https://us.i.posthog.com'");
		expect(appHtml).toContain("autocapture: { dom_event_allowlist: ['click'] }");
		expect(appHtml).toContain('capture_pageview: false');
		expect(appHtml).toContain('disable_session_recording: true');
	});
});
