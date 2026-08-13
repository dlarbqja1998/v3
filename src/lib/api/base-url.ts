export function resolveApiUrl(path: string, publicApiBaseUrl: string): string {
	if (!path.startsWith('/')) {
		throw new Error('API 경로는 슬래시로 시작해야 합니다.');
	}
	if (!publicApiBaseUrl.trim()) return path;

	const baseUrl = new URL(publicApiBaseUrl);
	if (baseUrl.protocol !== 'https:') {
		throw new Error('운영 API 주소는 HTTPS여야 합니다.');
	}

	return new URL(path, baseUrl.origin).toString();
}
