import { json } from '@sveltejs/kit';
import { nextShuttle } from '$lib/domain/seed';

export function GET() {
	return json({ shuttle: nextShuttle });
}
