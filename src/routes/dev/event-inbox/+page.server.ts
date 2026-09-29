import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { eventInboxPreview } from '$lib/server/event-candidate-fixtures';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = () => { if (!dev) error(404, '페이지를 찾지 못했습니다.'); return eventInboxPreview(); };
