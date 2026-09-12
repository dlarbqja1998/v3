/** HTTP 지도 요청은 로컬 개발 서버에서만 허용한다. 운영·LAN 주소에는 적용하지 않는다. */
export function usesLocalHttpMapRequests(url: URL, development: boolean) {
	return (
		development &&
		url.protocol === 'http:' &&
		['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
	);
}
