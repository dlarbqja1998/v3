export const universityData: Record<string, string[]> = {
	공공정책대학: [
		'경제통계학부 경제정책학전공',
		'공공사회통일외교학부 공공사회학전공',
		'공공사회통일외교학부 통일외교안보전공',
		'빅데이터사이언스학부',
		'정부행정학부'
	],
	과학기술대학: [
		'반도체물리학부',
		'디지털헬스케어공학과',
		'미래모빌리티학과',
		'생명정보공학과',
		'스마트에코시티 융합전공',
		'식품생명공학과',
		'신소재화학과',
		'응용수리과학부 데이터계산학과전공',
		'인공지능사이버보안학과',
		'전자기계융합공학과',
		'전자및정보공학과',
		'지능형반도체공학과',
		'첨단반도체공정장비 융합전공',
		'컴퓨터소프트웨어학과',
		'환경시스템공학과'
	],
	글로벌비즈니스대학: [
		'글로벌학부 독일학전공',
		'글로벌학부 영미학전공',
		'글로벌학부 중국학전공',
		'글로벌학부 한국학전공',
		'융합경영학부 글로벌경영전공',
		'융합경영학부 디지털경영전공',
		'표준지식학과'
	],
	문화스포츠대학: [
		'국제스포츠학부',
		'국제스포츠학부 스포츠과학전공',
		'국제스포츠학부 스포츠비즈니스전공',
		'국제스포츠학부 문화유산융합학부',
		'문화창의학부 문화콘텐츠전공',
		'문화창의학부 미디어문예창작전공'
	],
	스마트도시학부: ['스마트도시학부'],
	약학대학: ['약학과', '첨단융합신약학과'],
	'크림슨산학융합원(관)': ['크림슨산학융합원'],
	'그 외': ['그 외']
};

export const collegeOptions = Object.keys(universityData);

export const studentYearOptions = [
	'20학번 이전',
	'21학번',
	'22학번',
	'23학번',
	'24학번',
	'25학번',
	'26학번',
	'졸업생',
	'외부인',
	'그 외'
];

export const genderOptions = [
	{ value: 'male', label: '남성' },
	{ value: 'female', label: '여성' },
	{ value: 'unknown', label: '응답하지 않음' }
] as const;

export type GenderValue = (typeof genderOptions)[number]['value'];

export type OnboardingInput = {
	nickname: string;
	college: string;
	department: string;
	studentYear: string;
	gender: string;
};

export type OnboardingValidationResult =
	| { ok: true; value: OnboardingInput }
	| { ok: false; message: string; value: OnboardingInput };

export function buildDepartmentOptions(college: string) {
	return universityData[college] ?? [];
}

export function normalizeOnboardingInput(input: OnboardingInput): OnboardingInput {
	const nickname = input.nickname.trim();
	const college = input.college.trim();
	const studentYear = input.studentYear.trim();
	const gender = input.gender.trim();
	const department = college === '그 외' ? '그 외' : input.department.trim();

	return {
		nickname,
		college,
		department,
		studentYear,
		gender
	};
}

export function validateOnboardingInput(input: OnboardingInput): OnboardingValidationResult {
	const value = normalizeOnboardingInput(input);

	if (!value.nickname) {
		return { ok: false, message: '닉네임을 입력해 주세요.', value };
	}

	if (value.nickname.length > 10) {
		return { ok: false, message: '닉네임은 10글자 이하로 입력해 주세요.', value };
	}

	if (!collegeOptions.includes(value.college)) {
		return { ok: false, message: '단과대를 선택해 주세요.', value };
	}

	if (!buildDepartmentOptions(value.college).includes(value.department)) {
		return { ok: false, message: '학과를 선택해 주세요.', value };
	}

	if (!studentYearOptions.includes(value.studentYear)) {
		return { ok: false, message: '학번을 선택해 주세요.', value };
	}

	if (!genderOptions.some((option) => option.value === value.gender)) {
		return { ok: false, message: '성별을 선택해 주세요.', value };
	}

	return { ok: true, value };
}
