// 기존 소속 저장값을 유지하고, 비학부생의 구분은 department에 저장한다.
export const nonUndergraduateCollege = '그 외';
export const nonUndergraduateOptions = ['대학원생', '졸업생', '교직원', '기타 외부인'];

export function getCollegeLabel(college: string) {
	return college === nonUndergraduateCollege ? '현재 학부생이 아니에요' : college;
}

export function isNonUndergraduateAffiliation(affiliation: { college: string; department: string }) {
	return affiliation.college === nonUndergraduateCollege && nonUndergraduateOptions.includes(affiliation.department);
}

// 2026학년도 2학기 주 소속 기준. 모집 중단 여부와 별개로 재학생 소속도 선택할 수 있다.
export const universityData: Record<string, string[]> = {
	공공정책대학: [
		'자유전공학부(공공정책)',
		'경제통계학부 경제정책학전공',
		'공공사회·통일외교학부 (전공 미정)',
		'공공사회·통일외교학부 공공사회학전공',
		'공공사회·통일외교학부 통일외교안보전공',
		'빅데이터사이언스학부',
		'정부행정학부'
	],
	과학기술대학: [
		'자유전공학부(과학기술)',
		'자유공학부',
		'반도체물리학부',
		'디지털헬스케어공학과',
		'미래모빌리티학과',
		'생명정보공학과',
		'식품생명공학과',
		'신소재화학과',
		'응용수리과학부 데이터계산과학전공',
		'인공지능사이버보안학과',
		'전자·기계융합공학과',
		'전자및정보공학과',
		'지능형반도체공학과',
		'컴퓨터소프트웨어학과',
		'환경시스템공학과'
	],
	글로벌비즈니스대학: [
		'자유전공학부(글로벌비즈니스)',
		'글로벌학부 (전공 미정)',
		'글로벌학부 독일학전공',
		'글로벌학부 영미학전공',
		'글로벌학부 중국학전공',
		'글로벌학부 한국학전공',
		'융합경영학부 (전공 미정)',
		'융합경영학부 글로벌경영전공',
		'융합경영학부 디지털경영전공',
		'표준·지식학과'
	],
	문화스포츠대학: [
		'자유전공학부(문화스포츠)',
		'국제스포츠학부 (전공 미정)',
		'국제스포츠학부 스포츠과학전공',
		'국제스포츠학부 스포츠비즈니스전공',
		'문화유산융합학부',
		'문화창의학부 (전공 미정)',
		'문화창의학부 문화콘텐츠전공',
		'문화창의학부 미디어문예창작전공'
	],
	스마트도시학부: ['스마트도시학부'],
	약학대학: ['약학과', '첨단융합신약학과'],
	[nonUndergraduateCollege]: nonUndergraduateOptions
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

type AcademicAffiliation = Pick<OnboardingInput, 'college' | 'department'>;

// 기존 저장값의 오타만 정정한다. 없어진 소속을 다른 학과나 기관으로 바꾸지 않는다.
const departmentCorrections: Record<string, Record<string, string>> = {
	공공정책대학: {
		'공공사회통일외교학부 공공사회학전공': '공공사회·통일외교학부 공공사회학전공',
		'공공사회통일외교학부 통일외교안보전공': '공공사회·통일외교학부 통일외교안보전공'
	},
	과학기술대학: {
		'응용수리과학부 데이터계산학과전공': '응용수리과학부 데이터계산과학전공',
		전자기계융합공학과: '전자·기계융합공학과'
	},
	글로벌비즈니스대학: { 표준지식학과: '표준·지식학과' },
	문화스포츠대학: { '국제스포츠학부 문화유산융합학부': '문화유산융합학부' }
};

function normalizeAcademicAffiliation(input: AcademicAffiliation): AcademicAffiliation {
	const college = input.college.trim();
	const department = input.department.trim();
	const correctedDepartment = departmentCorrections[college]?.[department];
	return { college, department: typeof correctedDepartment === 'string' ? correctedDepartment : department };
}

export function buildCollegeOptions(savedAffiliation?: AcademicAffiliation) {
	const savedCollege = savedAffiliation?.college.trim();
	return savedCollege && !collegeOptions.includes(savedCollege)
		? [...collegeOptions, savedCollege]
		: collegeOptions;
}

export function buildDepartmentOptions(college: string, savedAffiliation?: AcademicAffiliation) {
	const options = Object.hasOwn(universityData, college) ? universityData[college] : [];
	const saved = savedAffiliation && normalizeAcademicAffiliation(savedAffiliation);
	// 프로필 수정에서는 본인이 이미 저장한 옛 소속만 추가로 유지할 수 있다.
	return saved?.college === college && saved.department && !options.includes(saved.department)
		? [...options, saved.department]
		: options;
}

export function validateNickname(nickname: string) {
	if (!nickname.trim()) {
		return '닉네임을 입력해 주세요.';
	}

	if (nickname.length < 2 || nickname.length > 10) {
		return '닉네임은 2자 이상 10자 이하로 입력해 주세요.';
	}

	if (!/^[가-힣A-Za-z0-9_]+$/.test(nickname)) {
		return '닉네임은 완성된 한글, 영문, 숫자, 밑줄(_)만 사용할 수 있어요.';
	}

	return null;
}

export function normalizeOnboardingInput(input: OnboardingInput): OnboardingInput {
	const nickname = input.nickname;
	const { college, department } = normalizeAcademicAffiliation(input);
	const studentYear = isNonUndergraduateAffiliation({ college, department }) ? '' : input.studentYear.trim();
	const gender = input.gender.trim();

	return {
		nickname,
		college,
		department,
		studentYear,
		gender
	};
}

export function validateOnboardingInput(
	input: OnboardingInput,
	savedAffiliation?: AcademicAffiliation
): OnboardingValidationResult {
	const value = normalizeOnboardingInput(input);

	const nicknameError = validateNickname(value.nickname);
	if (nicknameError) {
		return { ok: false, message: nicknameError, value };
	}

	if (!buildCollegeOptions(savedAffiliation).includes(value.college)) {
		return { ok: false, message: '단과대를 선택해 주세요.', value };
	}

	if (!buildDepartmentOptions(value.college, savedAffiliation).includes(value.department)) {
		return {
			ok: false,
			message: value.college === nonUndergraduateCollege ? '현재 신분을 선택해 주세요.' : '학부·학과/전공을 선택해 주세요.',
			value
		};
	}

	if (!isNonUndergraduateAffiliation(value) && !studentYearOptions.includes(value.studentYear)) {
		return { ok: false, message: '학번을 선택해 주세요.', value };
	}

	if (!genderOptions.some((option) => option.value === value.gender)) {
		return { ok: false, message: '성별을 선택해 주세요.', value };
	}

	return { ok: true, value };
}
