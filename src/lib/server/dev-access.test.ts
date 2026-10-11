import { beforeAll, describe, expect, it } from 'vitest';
import {
	createLocalJWKSet,
	exportJWK,
	generateKeyPair,
	SignJWT,
	type JWTPayload,
	type JWTVerifyGetKey
} from 'jose';
import { checkDevelopmentAccess, type DevelopmentEnv } from './dev-access';

const env: DevelopmentEnv = {
	APP_ENV: 'development',
	AUTH_URL: 'https://dev.golabau.com',
	DATABASE_URL: 'postgresql://golabau_dev_app:test@example.com/golabau_dev',
	DEV_ALLOWED_EMAILS: JSON.stringify(['member@example.com']),
	DEV_ACCESS_ISSUER: 'https://test-team.cloudflareaccess.com',
	DEV_ACCESS_AUDIENCE: 'development-application'
};
let privateKey: CryptoKey;
let getKey: JWTVerifyGetKey;

beforeAll(async () => {
	const keys = await generateKeyPair('RS256');
	privateKey = keys.privateKey;
	getKey = createLocalJWKSet({
		keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'test-key', alg: 'RS256' }]
	});
});

async function token(overrides: JWTPayload = {}, key = privateKey) {
	const now = Math.floor(Date.now() / 1000);
	return new SignJWT({
		email: 'member@example.com',
		iss: env.DEV_ACCESS_ISSUER,
		aud: env.DEV_ACCESS_AUDIENCE,
		iat: now,
		exp: now + 3600,
		...overrides
	})
		.setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
		.sign(key);
}

function request(jwt?: string, url = 'https://dev.golabau.com/') {
	return new Request(url, {
		headers: jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {}
	});
}

describe('팀 전용 개발 서버 접근 제한', () => {
	it('서명이 유효한 토큰의 등록 이메일만 허용한다', async () => {
		expect(await checkDevelopmentAccess(request(await token()), env, getKey)).toBeNull();
		expect((await checkDevelopmentAccess(request(await token({ email: 'other@example.com' })), env, getKey))?.status).toBe(403);
	});

	it('인증 토큰 없이 이메일 헤더만 위조해도 접근하지 못한다', async () => {
		const spoofed = new Request(request(), {
			headers: { 'Cf-Access-Authenticated-User-Email': 'member@example.com' }
		});
		const response = await checkDevelopmentAccess(spoofed, env, getKey);
		expect(response?.status).toBe(403);
		expect(response?.headers.get('Cache-Control')).toBe('private, no-store');
		expect(response?.headers.get('X-Robots-Tag')).toContain('noindex');
	});

	it('다른 키로 서명하거나 본문을 변조한 토큰을 차단한다', async () => {
		const wrongKey = await generateKeyPair('RS256');
		const forged = await token({}, wrongKey.privateKey);
		const parts = (await token()).split('.');
		parts[1] = Buffer.from(JSON.stringify({ email: 'member@example.com', exp: 9999999999 })).toString('base64url');
		for (const jwt of [forged, parts.join('.')]) {
			expect((await checkDevelopmentAccess(request(jwt), env, getKey))?.status).toBe(403);
		}
	});

	it.each([
		{ iss: 'https://another-team.cloudflareaccess.com' },
		{ aud: 'production-application' },
		{ exp: 1 },
		{ exp: undefined },
		{ email: undefined }
	])('발급자·대상·만료·이메일 조건이 맞지 않으면 차단한다: %j', async (claims) => {
		expect((await checkDevelopmentAccess(request(await token(claims)), env, getKey))?.status).toBe(403);
	});

	it('운영 DB 또는 운영 계정이 연결되면 인증된 팀원도 차단한다', async () => {
		const authenticated = request(await token());
		for (const databaseUrl of [
			'postgresql://golabau_dev_app:test@example.com/neondb',
			'postgresql://neondb_owner:test@example.com/golabau_dev',
			''
		]) {
			expect((await checkDevelopmentAccess(authenticated, { ...env, DATABASE_URL: databaseUrl }, getKey))?.status).toBe(503);
		}
	});

	it('기본 Worker 주소로 직접 접근하는 경로를 차단한다', async () => {
		expect((await checkDevelopmentAccess(request(await token(), 'https://v3-dev.example.workers.dev/'), env, getKey))?.status).toBe(403);
	});

	it('인증 설정이나 허용 명단이 누락되면 접근을 열지 않는다', async () => {
		for (const settings of [
			{ DEV_ALLOWED_EMAILS: '[]' },
			{ DEV_ALLOWED_EMAILS: '잘못된 JSON' },
			{ DEV_ACCESS_ISSUER: '' },
			{ DEV_ACCESS_ISSUER: 'https://attacker.example' },
			{ DEV_ACCESS_AUDIENCE: '' }
		]) {
			expect((await checkDevelopmentAccess(request(await token()), { ...env, ...settings }, getKey))?.status).toBe(503);
		}
	});

	it('인증서 조회가 실패해도 접근을 열지 않는다', async () => {
		const unavailableKeys: JWTVerifyGetKey = async () => { throw new Error('인증서 조회 실패'); };
		expect((await checkDevelopmentAccess(request(await token()), env, unavailableKeys))?.status).toBe(403);
	});
});
