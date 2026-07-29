import type { Handle } from '@sveltejs/kit';
import { getUserBySessionToken, toSafeUser } from '$lib/server/user';

export const handle: Handle = async ({ event, resolve }) => {
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
		return new Response(null, {
			status: 303,
			headers: { location: `/register?next=${next}` }
		});
	}

	return resolve(event);
};
