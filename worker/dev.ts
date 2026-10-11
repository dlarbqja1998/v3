// 운영용 진입점은 SvelteKit 빌드가 생성한다. 개발 서버에서는 인증을 먼저 확인한다.
import application from './index';
import {
	checkDevelopmentAccess,
	type DevelopmentEnv
} from '../src/lib/server/dev-access';

export default {
	async fetch(request: Request, env: DevelopmentEnv, ctx: Parameters<typeof application.fetch>[2]) {
		const denied = await checkDevelopmentAccess(request, env);
		if (denied) return denied;

		const response = await application.fetch(request, env, ctx);
		const result = new Response(response.body, response);
		result.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
		result.headers.set('Cache-Control', 'private, no-store');
		return result;
	}
};
