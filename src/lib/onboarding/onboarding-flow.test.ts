import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import OnboardingFlow from './OnboardingFlow.svelte';

describe('공통 온보딩 화면', () => {
	it('실제 가입 모드는 POST 폼을 제공하고 미리보기 도구를 숨긴다', () => {
		const { body } = render(OnboardingFlow, { props: { mode: 'register' } });

		expect(body).toContain('method="POST"');
		expect(body).toContain('action="?/complete"');
		expect(body).toContain('중복 확인');
		expect(body).toContain('2~10자, 한글/영문/숫자/밑줄(_)만 사용 가능, 공백 및 특수문자 불가합니다.');
		expect(body).not.toContain('미리보기 나가기');
	});

	it('미리보기 모드는 나가기와 저장 차단 안내를 제공하고 POST 폼을 만들지 않는다', () => {
		const { body } = render(OnboardingFlow, {
			props: { mode: 'preview', exitHref: '/my' }
		});

		expect(body).toContain('미리보기 나가기');
		expect(body).toContain('href="/my"');
		expect(body).not.toContain('method="POST"');
		expect(body).not.toContain('중복 확인');
		expect(body).toContain('미리보기에서는 정보가 저장되지 않습니다.');
		expect(body).toContain('aria-live="polite"');
	});

	it('중복 확인 응답의 닉네임과 결과를 첫 단계에 다시 표시한다', () => {
		const { body } = render(OnboardingFlow, {
			props: {
				mode: 'register',
				submittedValues: {
					nickname: '골라바유',
					college: '',
					department: '',
					studentYear: '',
					gender: ''
				},
				nicknameCheck: {
					nickname: '골라바유',
					status: 'available',
					message: '사용 가능한 닉네임입니다.'
				}
			}
		});

		expect(body).toContain('value="골라바유"');
		expect(body).toContain('사용 가능한 닉네임입니다.');
	});
});
