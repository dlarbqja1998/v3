import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ShopsPage from './+page.svelte';

describe('상점 빈 상태 페이지', () => {
	it('준비 중 안내와 메인 복귀 링크를 제공한다', () => {
		const { body } = render(ShopsPage);

		expect(body).toContain('아직 등록된 상점이 없습니다.');
		expect(body).toContain('학교 밖 상점 정보를 준비하고 있어요.');
		expect(body).toContain('href="/"');
		expect(body).toContain('메인으로 돌아가기');
	});
});
