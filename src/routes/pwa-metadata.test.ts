// @ts-expect-error 프로젝트 tsconfig는 Node 타입을 전역으로 포함하지 않는다.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const layoutSource = readFileSync('src/routes/+layout.svelte', 'utf8');

describe('iPhone 홈 화면 메타데이터', () => {
	it('호이 핀 이미지를 홈 화면 아이콘으로 명시한다', () => {
		expect(layoutSource).toContain('<link rel="apple-touch-icon" href="/icon.png" />');
		expect(existsSync('static/icon.png')).toBe(true);
	});

	it('홈 화면 앱 이름을 골라바유로 명시한다', () => {
		expect(layoutSource).toContain(
			'<meta name="apple-mobile-web-app-title" content="골라바유" />'
		);
	});
});
