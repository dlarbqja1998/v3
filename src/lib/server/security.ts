const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export function normalizeInternalRedirect(value: unknown, fallback = '/') {
	if (typeof value !== 'string') return fallback;
	const candidate = value.trim();
	if (
		!candidate.startsWith('/') ||
		candidate.startsWith('//') ||
		candidate.includes('\\') ||
		CONTROL_CHARACTER_PATTERN.test(candidate)
	) {
		return fallback;
	}

	try {
		const parsed = new URL(candidate, 'https://golabau.invalid');
		if (parsed.origin !== 'https://golabau.invalid') return fallback;
		return `${parsed.pathname}${parsed.search}${parsed.hash}`;
	} catch {
		return fallback;
	}
}

export function createOAuthState() {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function isValidOAuthState(expected: string | null | undefined, received: string | null | undefined) {
	if (!expected || !received || expected.length !== received.length) return false;
	let difference = 0;
	for (let index = 0; index < expected.length; index += 1) {
		difference |= expected.charCodeAt(index) ^ received.charCodeAt(index);
	}
	return difference === 0;
}

export function isAllowedMutationOrigin(
	requestOrigin: string | null,
	expectedOrigin: string,
	options: { allowMissing?: boolean } = {}
) {
	if (!requestOrigin) return options.allowMissing === true;
	try {
		return new URL(requestOrigin).origin === new URL(expectedOrigin).origin;
	} catch {
		return false;
	}
}
