export const inquiryCategories = [
	{ value: 'SERVICE_ERROR', label: '서비스 오류' },
	{ value: 'INFORMATION_UPDATE', label: '정보 수정 요청' },
	{ value: 'USAGE', label: '이용 문의' },
	{ value: 'OTHER', label: '기타' }
] as const;

export type InquiryCategory = (typeof inquiryCategories)[number]['value'];
export type InquiryStatus = 'WAITING' | 'ANSWERED';
export type InquiryInput = { category: InquiryCategory; title: string; content: string };

const inquiryCategoryValues = new Set<string>(
	inquiryCategories.map((category) => category.value)
);

export function getInquiryCategoryLabel(value: string) {
	return inquiryCategories.find((category) => category.value === value)?.label ?? '기타';
}

export function normalizeInquiryInput(formData: FormData) {
	const category = String(formData.get('category') ?? '');
	const title = String(formData.get('title') ?? '').trim();
	const content = String(formData.get('content') ?? '').trim();

	if (
		!inquiryCategoryValues.has(category) ||
		title.length < 2 ||
		title.length > 60 ||
		content.length < 10 ||
		content.length > 2_000
	) {
		return { ok: false, message: '문의 유형, 제목, 내용을 확인해 주세요.' } as const;
	}

	return {
		ok: true,
		value: { category: category as InquiryCategory, title, content }
	} as const;
}

export function normalizeInquiryAnswer(formData: FormData) {
	const answer = String(formData.get('answer') ?? '').trim();
	if (answer.length < 2 || answer.length > 2_000) {
		return { ok: false, message: '답변을 2자 이상 입력해 주세요.' } as const;
	}
	return { ok: true, value: { answer } } as const;
}
