import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export const DEVELOPMENT_HOST = 'dev.golabau.com';
export const DEVELOPMENT_DATABASE = 'golabau_dev';

export type DevelopmentEnv = {
	APP_ENV?: string;
	AUTH_URL?: string;
	DATABASE_URL?: string;
	DEV_ALLOWED_EMAILS?: string;
	DEV_ACCESS_ISSUER?: string;
	DEV_ACCESS_AUDIENCE?: string;
};

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function accessKeys(issuer: string) {
	let keys = keySets.get(issuer);
	if (!keys) {
		keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
		keySets.set(issuer, keys);
	}
	return keys;
}

/** 정적 파일을 포함한 모든 요청에서 Access 토큰의 서명과 발급 대상까지 검증한다. */
export async function checkDevelopmentAccess(
	request: Request,
	env: DevelopmentEnv,
	getKey?: JWTVerifyGetKey
): Promise<Response | null> {
	const deny = (message: string, status: number) =>
		new Response(message, {
			status,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'private, no-store',
				'X-Robots-Tag': 'noindex, nofollow, noarchive'
			}
		});

	if (new URL(request.url).hostname !== DEVELOPMENT_HOST) {
		return deny('개발 서버의 지정된 주소로 접속해 주세요.', 403);
	}

	try {
		const database = new URL(env.DATABASE_URL ?? '');
		if (
			env.APP_ENV !== 'development' ||
			env.AUTH_URL !== `https://${DEVELOPMENT_HOST}` ||
			!['postgres:', 'postgresql:'].includes(database.protocol) ||
			database.pathname !== `/${DEVELOPMENT_DATABASE}` ||
			database.username !== 'golabau_dev_app'
		) {
			return deny('개발 서버 설정을 확인하고 있습니다.', 503);
		}
	} catch {
		return deny('개발 서버 설정을 확인하고 있습니다.', 503);
	}

	let allowedEmails: string[];
	try {
		const configuredEmails: unknown = JSON.parse(env.DEV_ALLOWED_EMAILS ?? '[]');
		if (
			!Array.isArray(configuredEmails) ||
			configuredEmails.length === 0 ||
			!configuredEmails.every((value) => typeof value === 'string' && value.includes('@')) ||
			!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.DEV_ACCESS_ISSUER ?? '') ||
			!env.DEV_ACCESS_AUDIENCE?.trim()
		) {
			return deny('개발 서버 접근 권한을 준비하고 있습니다.', 503);
		}
		allowedEmails = configuredEmails.map((email: string) => email.trim().toLowerCase());
	} catch {
		return deny('개발 서버 접근 권한을 준비하고 있습니다.', 503);
	}

	const token = request.headers.get('Cf-Access-Jwt-Assertion');
	if (!token) return deny('팀 전용 접속 인증이 필요합니다.', 403);

	try {
		// 공개키 주소는 신뢰하는 서버 설정에서만 정한다. 토큰 안의 주소는 사용하지 않는다.
		const issuer = env.DEV_ACCESS_ISSUER!;
		const { payload } = await jwtVerify(token, getKey ?? accessKeys(issuer), {
			issuer,
			audience: env.DEV_ACCESS_AUDIENCE,
			algorithms: ['RS256'],
			requiredClaims: ['exp', 'iat', 'email']
		});
		const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
		if (!email || !allowedEmails.includes(email)) {
			return deny('개발 서버 접근 권한이 없는 계정입니다.', 403);
		}
	} catch {
		return deny('접속 인증을 확인하지 못했습니다. 다시 로그인해 주세요.', 403);
	}

	return null;
}
