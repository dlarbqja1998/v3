import { json } from '@sveltejs/kit';
import { zones } from '$lib/domain/seed';

export function GET() {
	return json({ zones });
}
