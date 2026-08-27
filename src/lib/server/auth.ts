const encoder = new TextEncoder();
const ADMIN_PASSWORD_FORMAT = 'pbkdf2-sha256';
const ADMIN_PASSWORD_ITERATIONS = 310_000;

function bytesToHex(bytes: ArrayBuffer) {
	return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(value: string) {
	if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) return null;
	const bytes = new Uint8Array(value.length / 2);
	for (let index = 0; index < value.length; index += 2) {
		bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
	}
	return bytes;
}

async function deriveAdminPassword(password: string, salt: Uint8Array, iterations: number) {
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		'PBKDF2',
		false,
		['deriveBits']
	);
	return crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
		keyMaterial,
		256
	);
}

export async function hashAdminPassword(password: string, providedSalt?: Uint8Array) {
	const salt = providedSalt ?? crypto.getRandomValues(new Uint8Array(16));
	const hash = await deriveAdminPassword(password, salt, ADMIN_PASSWORD_ITERATIONS);
	return `${ADMIN_PASSWORD_FORMAT}$${ADMIN_PASSWORD_ITERATIONS}$${bytesToHex(salt.buffer as ArrayBuffer)}$${bytesToHex(hash)}`;
}

export async function verifyAdminPassword(password: string, encodedHash: string) {
	const [format, iterationsValue, saltValue, expectedValue, extra] = encodedHash.split('$');
	const iterations = Number.parseInt(iterationsValue ?? '', 10);
	const salt = hexToBytes(saltValue ?? '');
	const expected = hexToBytes(expectedValue ?? '');
	if (
		extra !== undefined ||
		format !== ADMIN_PASSWORD_FORMAT ||
		iterations !== ADMIN_PASSWORD_ITERATIONS ||
		!salt ||
		salt.length !== 16 ||
		!expected ||
		expected.length !== 32
	) {
		return false;
	}

	const actual = new Uint8Array(await deriveAdminPassword(password, salt, iterations));
	let difference = 0;
	for (let index = 0; index < expected.length; index += 1) {
		difference |= expected[index] ^ actual[index];
	}
	return difference === 0;
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
