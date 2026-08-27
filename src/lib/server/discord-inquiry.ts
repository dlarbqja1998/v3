type InquiryNotification = {
	id: string;
	categoryLabel: string;
	title: string;
	content: string;
};

export async function notifyDiscordOfInquiry(
	webhookUrl: string | undefined,
	inquiry: InquiryNotification,
	fetcher: typeof fetch = fetch
) {
	if (!webhookUrl) return false;

	try {
		const response = await fetcher(webhookUrl, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				content: [
					'새 문의가 등록되었습니다.',
					`문의 번호: ${inquiry.id}`,
					`유형: ${inquiry.categoryLabel}`,
					`제목: ${inquiry.title}`,
					`내용: ${inquiry.content.slice(0, 500)}`
				].join('\n'),
				allowed_mentions: { parse: [] }
			})
		});
		if (!response.ok) throw new Error(`Discord webhook returned ${response.status}`);
		return true;
	} catch (error) {
		console.error('Discord 문의 알림 전송 실패:', error);
		return false;
	}
}
