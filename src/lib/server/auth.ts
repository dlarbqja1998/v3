const encoder = new TextEncoder();

function bytesToHex(bytes: ArrayBuffer) {
	return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function signSessionValue(secret: string, value: string) {
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
	return bytesToHex(signature);
}

export async function createSessionToken(secret: string, userId: string | number) {
	const value = String(userId);
	const signature = await signSessionValue(secret, value);
	return `${value}.${signature}`;
}

export async function getUserIdFromSessionToken(secret: string, sessionToken: string) {
	const [value, signature] = sessionToken.split('.');
	if (!value || !signature) return null;

	const expectedSignature = await signSessionValue(secret, value);
	return signature === expectedSignature ? value : null;
}

export async function validateAdminCredentials({
	inputId,
	inputPassword,
	expectedId,
	expectedPassword
}: {
	inputId: string;
	inputPassword: string;
	expectedId: string;
	expectedPassword: string;
}) {
	await new Promise((resolve) => setTimeout(resolve, 250));
	return inputId === expectedId && inputPassword === expectedPassword;
}
