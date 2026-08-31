import type { Handle } from '@sveltejs/kit';
import { isAllowedMutationOrigin } from '$lib/server/security';
import { getUserBySessionToken, toSafeUser } from '$lib/server/user';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const DEFAULT_MUTATION_MAX_BYTES = 256 * 1024;
const EVENT_UPLOAD_MAX_BYTES = 65 * 1024 * 1024;
const CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	"base-uri 'self'",
	"object-src 'none'",
	"frame-ancestors 'none'",
	"form-action 'self'",
	"script-src 'self' 'unsafe-inline' https://oapi.map.naver.com https://nrbe.pstatic.net https://map.pstatic.net https://us-assets.i.posthog.com",
	"style-src 'self' 'unsafe-inline' https://oapi.map.naver.com",
	"img-src 'self' data: blob: https:",
	"font-src 'self' data: https:",
	"connect-src 'self' https:",
	"worker-src 'self' blob:",
	"frame-src 'none'",
	'upgrade-insecure-requests',
	'block-all-mixed-content'
].join('; ');

function withSecurityHeaders(response: Response, isHttps: boolean) {
	const secured = new Response(response.body, response);
	secured.headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
	secured.headers.set('X-Content-Type-Options', 'nosniff');
	secured.headers.set('X-Frame-Options', 'DENY');
	secured.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	secured.headers.set('Permissions-Policy', 'microphone=(), payment=(), usb=()');
	secured.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
	secured.headers.set('X-XSS-Protection', '0');
	if (isHttps) {
		secured.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
	return secured;
}

export const handle: Handle = async ({ event, resolve }) => {
	const forwardedProtocol = event.request.headers.get('x-forwarded-proto');
	const isHttps = event.url.protocol === 'https:' || forwardedProtocol === 'https';
	if (event.url.hostname === 'golabau.com' && !isHttps) {
		const secureUrl = new URL(event.url);
		secureUrl.protocol = 'https:';
		return withSecurityHeaders(
			new Response(null, { status: 308, headers: { location: secureUrl.toString() } }),
			false
		);
	}

	if (!SAFE_METHODS.has(event.request.method)) {
		const contentLength = Number.parseInt(event.request.headers.get('content-length') ?? '', 10);
		const maxBodyBytes = event.url.pathname.startsWith('/admin/events/')
			? EVENT_UPLOAD_MAX_BYTES
			: DEFAULT_MUTATION_MAX_BYTES;
		if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
			return withSecurityHeaders(new Response('요청 본문이 너무 큽니다.', { status: 413 }), isHttps);
		}
		const allowMissingOrigin = event.url.pathname === '/api/refresh-menu';
		if (
			!isAllowedMutationOrigin(event.request.headers.get('origin'), event.url.origin, {
				allowMissing: allowMissingOrigin
			})
		) {
			return withSecurityHeaders(new Response('허용되지 않은 요청입니다.', { status: 403 }), isHttps);
		}
	}

	event.locals.user = null;

	const sessionToken = event.cookies.get('session_id');
	if (sessionToken) {
		const user = await getUserBySessionToken(sessionToken);
		if (user) {
			event.locals.user = toSafeUser(user);
		} else {
			event.cookies.delete('session_id', { path: '/' });
		}
	}

	const path = event.url.pathname;
	const isAuthPath = path === '/login' || path === '/register' || path.startsWith('/auth/');
	const needsOnboarding = event.locals.user && !event.locals.user.isOnboarded && !isAuthPath;

	if (needsOnboarding) {
		const next = encodeURIComponent(`${event.url.pathname}${event.url.search}`);
		return withSecurityHeaders(
			new Response(null, {
				status: 303,
				headers: { location: `/register?next=${next}` }
			}),
			isHttps
		);
	}

	const response = await resolve(event);
	if (sessionToken || path.startsWith('/admin') || path.startsWith('/my') || isAuthPath) {
		response.headers.set('Cache-Control', 'private, no-store');
	}
	return withSecurityHeaders(response, isHttps);
};
