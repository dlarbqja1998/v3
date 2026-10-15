import { describe, expect, it } from 'vitest';
import {
	buildCollegeOptions,
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
		const jamoNickname = validateOnboardingInput({ ...baseInput, nickname: 'ㅇㄹㅇㄹ' });
		expect(jamoNickname.ok).toBe(false);
		if (!jamoNickname.ok) expect(jamoNickname.message).toContain('완성된 한글');
	});

	it('단과대에 맞는 학과 목록을 반환하고 그 외 항목을 지원한다', () => {
		expect(buildDepartmentOptions('과학기술대학')).toContain('컴퓨터소프트웨어학과');
		expect(buildDepartmentOptions('그 외')).toEqual(['그 외']);
	});

	it('기존 오타로 저장된 학과도 정정한 선택지와 일치하고 중복 항목을 만들지 않는다', () => {
		const saved = { college: '문화스포츠대학', department: '국제스포츠학부 문화유산융합학부' };
		const input = { nickname: '참살이', ...saved, studentYear: '26학번', gender: 'unknown' };
		const result = validateOnboardingInput(input, saved);

		expect(result).toMatchObject({ ok: true, value: { department: '문화유산융합학부' } });
		expect(buildDepartmentOptions(saved.college, saved)).toEqual(buildDepartmentOptions(saved.college));
	});

	it.each([
		{ college: '취창업지원센터(관)', department: '취창업지원센터' },
		{ college: '과학기술대학', department: '스마트에코시티 융합전공' },
		{ college: '과학기술대학', department: '첨단반도체공정장비 융합전공' },
		{ college: '문화스포츠대학', department: '국제스포츠학부' },
		{ college: '크림슨산학융합원(관)', department: '크림슨산학융합원' }
	])('기존 회원의 $department 소속은 유지하되 신규 선택으로는 허용하지 않는다', (saved) => {
		const input = { nickname: '참살이', ...saved, studentYear: '26학번', gender: 'unknown' };

		expect(validateOnboardingInput(input).ok).toBe(false);
		expect(validateOnboardingInput(input, saved)).toEqual({ ok: true, value: input });
		expect(buildCollegeOptions(saved)).toContain(saved.college);
		expect(buildDepartmentOptions(saved.college, saved)).toContain(saved.department);
		expect(buildDepartmentOptions(saved.college)).not.toContain(saved.department);
	});

	it('기존 소속 보존으로 다른 단과대나 임의 학과를 선택할 수는 없다', () => {
		const saved = { college: '과학기술대학', department: '스마트에코시티 융합전공' };
		const input = { nickname: '참살이', ...saved, studentYear: '26학번', gender: 'unknown' };

		expect(validateOnboardingInput({ ...input, college: '문화스포츠대학' }, saved).ok).toBe(false);
		expect(validateOnboardingInput({ ...input, department: '임의학과' }, saved).ok).toBe(false);
		expect(buildDepartmentOptions('문화스포츠대학', saved)).not.toContain(saved.department);
	});

	it.each([
		{ college: '과학기술대학', department: '자유전공학부(과학기술)' },
		{ college: '글로벌비즈니스대학', department: '자유전공학부(글로벌비즈니스)' },
		{ college: '공공정책대학', department: '자유전공학부(공공정책)' },
		{ college: '문화스포츠대학', department: '자유전공학부(문화스포츠)' },
		{ college: '글로벌비즈니스대학', department: '글로벌학부 (전공 미정)' },
		{ college: '글로벌비즈니스대학', department: '융합경영학부 (전공 미정)' },
		{ college: '공공정책대학', department: '공공사회·통일외교학부 (전공 미정)' },
		{ college: '문화스포츠대학', department: '국제스포츠학부 (전공 미정)' },
		{ college: '문화스포츠대학', department: '문화창의학부 (전공 미정)' },
		{ college: '과학기술대학', department: '자유공학부' },
		{ college: '글로벌비즈니스대학', department: '글로벌학부 독일학전공' }
	])('$department 학생은 단과대와 소속 두 값으로 가입할 수 있다', (affiliation) => {
		const input = { nickname: '참살이', ...affiliation, studentYear: '26학번', gender: 'unknown' };

		expect(validateOnboardingInput(input)).toEqual({ ok: true, value: input });
		expect(buildDepartmentOptions(affiliation.college)).toContain(affiliation.department);
		expect(validateOnboardingInput({ ...input, college: '약학대학' }).ok).toBe(false);
	});

	it('취창업지원센터는 신규 단과대 선택지에서 제외한다', () => {
		expect(buildCollegeOptions()).not.toContain('취창업지원센터(관)');
	});
});
