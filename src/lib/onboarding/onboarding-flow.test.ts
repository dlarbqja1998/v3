import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import OnboardingFlow from './OnboardingFlow.svelte';

describe('공통 온보딩 화면', () => {
	it('실제 가입 모드는 POST 폼을 제공하고 미리보기 도구를 숨긴다', () => {
		const { body } = render(OnboardingFlow, { props: { mode: 'register' } });

		expect(body).toContain('method="POST"');
		expect(body).toContain('action="?/checkNickname"');
		expect(body).toContain('중복 확인');
		expect(body).toContain('2~10자, 한글/영문/숫자/밑줄(_)만 사용 가능, 공백 및 특수문자 불가합니다.');
		expect(body).not.toContain('미리보기 나가기');
	});

	it('미리보기에서도 닉네임 중복 확인을 제공하되 최종 저장은 차단한다', () => {
		const { body } = render(OnboardingFlow, {
			props: { mode: 'preview', exitHref: '/my' }
		});

		expect(body).toContain('미리보기 나가기');
		expect(body).toContain('href="/my"');
		expect(body).toContain('method="POST"');
		expect(body).toContain('action="?/checkNickname"');
		expect(body).toContain('중복 확인');
		expect(body).toContain('미리보기에서는 정보가 저장되지 않습니다.');
		expect(body).toContain('aria-live="polite"');
	});

	it('Figma 리디자인의 제목과 5단계 진행 상태를 첫 화면에 제공한다', () => {
		const { body } = render(OnboardingFlow, { props: { mode: 'register' } });

		expect(body).toContain('카카오 계정 연동 완료');
		expect(body).toContain('당신의 정보를 알려주세요');
		expect(body).toContain('role="progressbar"');
		expect(body).toContain('aria-valuenow="1"');
		expect(body).toContain('aria-valuemax="5"');
		expect(body).toContain('>이전<');
		expect(body).toContain('>다음<');
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
