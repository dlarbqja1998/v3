import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import OnboardingPreviewPage from './+page.svelte';

describe('관리자 온보딩 미리보기 화면', () => {
	it('닉네임 중복 확인 결과를 공통 온보딩 화면에 다시 표시한다', () => {
		const { body } = render(OnboardingPreviewPage, {
			props: {
				data: { preview: true },
				form: {
					nicknameCheck: {
						nickname: '골라바유',
						status: 'available',
						message: '사용 가능한 닉네임입니다.'
					},
					values: {
						nickname: '골라바유',
						college: '',
						department: '',
						studentYear: '',
						gender: ''
					}
				}
			} as never
		});

		expect(body).toContain('value="골라바유"');
		expect(body).toContain('사용 가능한 닉네임입니다.');
	});
});
