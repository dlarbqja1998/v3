import { genderOptions, isNonUndergraduateAffiliation } from './onboarding';

type MyPageUser = {
	nickname: string | null;
	college: string | null;
	department: string | null;
	grade: string | null;
	gender: string | null;
	role: string;
};

export type MyPageRow = {
	label: string;
	value: string;
};

export function canManageCampusBoundaries(role: string) {
	return role === 'admin';
}

function displayValue(value: string | null) {
	return value?.trim() || '미입력';
}

function getGenderLabel(gender: string | null) {
	return genderOptions.find((option) => option.value === gender)?.label ?? displayValue(gender);
}

export function getLoginMethodLabel(user: Pick<MyPageUser, 'role'>) {
	return user.role === 'admin' ? '관리자 로그인' : '카카오 로그인';
}

export function buildMyPageRows(user: MyPageUser): MyPageRow[] {
	const affiliationRows: MyPageRow[] = isNonUndergraduateAffiliation({
		college: user.college ?? '', department: user.department ?? ''
	})
		? [{ label: '현재 신분', value: displayValue(user.department) }]
		: [
			{ label: '단과대', value: displayValue(user.college) },
			{ label: '학과', value: displayValue(user.department) },
			{ label: '학번', value: displayValue(user.grade) }
		];
	return [
		{ label: '닉네임', value: displayValue(user.nickname) },
		...affiliationRows,
		{ label: '성별', value: getGenderLabel(user.gender) },
		{ label: '로그인 방식', value: getLoginMethodLabel(user) }
	];
}
