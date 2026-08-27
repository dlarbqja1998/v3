export type NoticeStatus = 'DRAFT' | 'PUBLISHED';

export type PublicNotice = {
	id: string;
	isPinned: boolean;
	publishedAt: Date | null;
};

export type NoticeInput = {
	title: string;
	content: string;
	status: NoticeStatus;
	isPinned: boolean;
	showOnHome: boolean;
};

export function sortPublicNotices<T extends PublicNotice>(rows: T[]) {
	return [...rows].sort(
		(a, b) =>
			Number(b.isPinned) - Number(a.isPinned) ||
			(b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
	);
}

export function normalizeNoticeInput(formData: FormData) {
	const title = String(formData.get('title') ?? '').trim();
	const content = String(formData.get('content') ?? '').trim();
	const status: NoticeStatus = formData.get('status') === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

	if (title.length < 2 || title.length > 100 || content.length < 10 || content.length > 10_000) {
		return { ok: false, message: '공지 제목과 내용을 확인해 주세요.' } as const;
	}

	return {
		ok: true,
		value: {
			title,
			content,
			status,
			isPinned: formData.get('isPinned') === 'on',
			showOnHome: formData.get('showOnHome') === 'on'
		} satisfies NoticeInput
	} as const;
}
