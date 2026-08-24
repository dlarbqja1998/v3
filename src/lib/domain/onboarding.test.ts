import { describe, expect, it } from 'vitest';
import {
	buildDepartmentOptions,
	normalizeOnboardingInput,
	validateOnboardingInput
} from './onboarding';

describe('하이브리드 온보딩', () => {
	it('단과대 그 외를 선택하면 학과도 그 외로 정규화한다', () => {
		const input = normalizeOnboardingInput({
			nickname: '참살이',
			college: '그 외',
			department: '',
			studentYear: '외부인',
			gender: 'unknown'
		});

		expect(input.department).toBe('그 외');
	});

	it('닉네임, 단과대, 학과, 학번, 성별을 필수로 검증한다', () => {
		const result = validateOnboardingInput({
			nickname: '',
			college: '',
			department: '',
			studentYear: '',
			gender: ''
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.message).toBe('닉네임을 입력해 주세요.');
		}
	});

	it('닉네임은 2~10자의 한글, 영문, 숫자, 밑줄만 허용한다', () => {
		const baseInput = {
			college: '과학기술대학',
			department: '컴퓨터소프트웨어학과',
			studentYear: '26학번',
			gender: 'unknown'
		};

		expect(validateOnboardingInput({ ...baseInput, nickname: '골라_bayu26' }).ok).toBe(true);
		expect(validateOnboardingInput({ ...baseInput, nickname: '가' }).ok).toBe(false);
		expect(validateOnboardingInput({ ...baseInput, nickname: ' 골라바유' }).ok).toBe(false);
		expect(validateOnboardingInput({ ...baseInput, nickname: '골라 바유' }).ok).toBe(false);
		expect(validateOnboardingInput({ ...baseInput, nickname: '골라바유!' }).ok).toBe(false);
	});

	it('단과대에 맞는 학과 목록을 반환하고 그 외 항목을 지원한다', () => {
		expect(buildDepartmentOptions('과학기술대학')).toContain('컴퓨터소프트웨어학과');
		expect(buildDepartmentOptions('그 외')).toEqual(['그 외']);
	});
});
